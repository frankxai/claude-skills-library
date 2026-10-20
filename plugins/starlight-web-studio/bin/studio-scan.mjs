#!/usr/bin/env node
// Model-free audit of one live page: search, answer-engine, mobile, access, craft, speed.
// It reads what a crawler reads (server HTML, robots.txt, llms.txt, sitemap), so it
// cannot see layout or motion. Those need eyes: the visual-proof capture and the
// studio rubric. A clean scan is necessary, never sufficient.
//
// Exit codes: 0 scanned, no P0 · 1 scanned, at least one P0 · 3 page could not be fetched
// · 4 fetched but the analysis threw (a scanner bug; the message says so).

import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

export const DIMENSIONS = ['search', 'answer', 'mobile', 'access', 'craft', 'speed'];

const PENALTY = { P0: 3, P1: 1, P2: 0.5, info: 0 };

// Search and user-fetch agents decide whether a page can be cited in an AI answer.
// Training crawlers are a licensing choice, so blocking them is reported, not penalised.
const AI_SEARCH_AGENTS = ['OAI-SearchBot', 'ChatGPT-User', 'Claude-SearchBot', 'Claude-User', 'PerplexityBot', 'Perplexity-User'];
const AI_TRAINING_AGENTS = ['GPTBot', 'ClaudeBot', 'Google-Extended', 'Applebot-Extended', 'CCBot', 'meta-externalagent'];

// AGENTS.md §11.1 "vocabulary from nowhere", plus the stock words the humanizer pass cuts.
const SLOP_WORDS = ['seamless', 'seamlessly', 'unleash', 'next-gen', 'next-generation', 'revolutionary', 'revolutionize',
  'supercharge', 'empower', 'empowering', '10x', 'cutting-edge', 'game-changer', 'game-changing', 'unlock your',
  'elevate your', 'harness the power', 'in today\'s fast-paced', 'world-class', 'best-in-class', 'synergy'];

const SEARCH_WORD_FLOOR = 150;

// HTML maps numeric references 128-159 through windows-1252, as browsers do.
const CP1252 = { 128: 0x20ac, 130: 0x201a, 131: 0x192, 132: 0x201e, 133: 0x2026, 134: 0x2020, 135: 0x2021, 136: 0x2c6,
  137: 0x2030, 138: 0x160, 139: 0x2039, 140: 0x152, 142: 0x17d, 145: 0x2018, 146: 0x2019, 147: 0x201c, 148: 0x201d,
  149: 0x2022, 150: 0x2013, 151: 0x2014, 152: 0x2dc, 153: 0x2122, 154: 0x161, 155: 0x203a, 156: 0x153, 158: 0x17e, 159: 0x178 };

const NAMED = { nbsp: ' ', lt: '<', gt: '>', quot: '"', apos: "'", amp: '&', copy: '©', reg: '®', trade: '™', mdash: '—',
  ndash: '–', hellip: '…', lsquo: '‘', rsquo: '’', ldquo: '“', rdquo: '”', euro: '€', middot: '·', bull: '•', times: '×' };

function codePoint(n) {
  const mapped = CP1252[n] ?? n;
  return Number.isInteger(mapped) && mapped > 0 && mapped <= 0x10ffff && !(mapped >= 0xd800 && mapped <= 0xdfff)
    ? String.fromCodePoint(mapped) : '�';
}

// One pass, so "&amp;lt;" decodes to "&lt;" and not to "<".
// Numeric references may omit the semicolon in HTML; named ones need it here.
function decode(s) {
  return s.replace(/&(#x[0-9a-f]+;?|#\d+;?|[a-z]+;)/gi, (m, ref) => {
    const body = ref.replace(/;$/, '');
    if (body[0] === '#') return codePoint(body[1].toLowerCase() === 'x' ? parseInt(body.slice(2), 16) : +body.slice(1));
    return NAMED[body.toLowerCase()] ?? m;
  });
}

// One left-to-right pass over comments and raw-text elements, as an HTML tokenizer reads them:
// whichever starts first wins, so "<!--" inside a script string and "<script>" inside a comment
// are both inert. Returns the markup with comments removed and raw-text bodies emptied, plus
// the script elements that really exist.
// An attribute list where ">" inside a quoted value does not end the tag.
const ATTRS = `((?:[^>"']|"[^"]*"|'[^']*')*)`;

export function tokenize(html) {
  const scripts = [];
  const markup = html.replace(new RegExp(`<!--[\\s\\S]*?(?:-->|$)|<(script|style|template|textarea|title)\\b${ATTRS}>([\\s\\S]*?)<\\/\\1\\s*>`, 'gi'),
    (m, tag, attrs, body) => {
      if (!tag) return '';
      if (tag.toLowerCase() === 'script') scripts.push({ attrs: ` ${attrs}`, body });
      return tag.toLowerCase() === 'title' ? m : `<${tag}${attrs}></${tag}>`;
    });
  return { markup, scripts };
}

function markupOnly(html) {
  return tokenize(html).markup;
}

function stripTags(s) {
  return decode(s.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
}

// Walks the attribute list name by name, so text inside one quoted value is never read as
// another attribute. Accepts a whole tag or just its attribute string.
function attr(tag, name) {
  const list = tag.replace(/^<[a-z0-9-]+/i, '').replace(/\/?>$/, '');
  const re = /([^\s"'>\/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  for (const m of list.matchAll(re)) {
    if (m[1].toLowerCase() === name.toLowerCase()) return m[2] !== undefined || m[3] !== undefined || m[4] !== undefined
      ? decode(m[2] ?? m[3] ?? m[4]) : '';
  }
  return null;
}

function tags(html, name) {
  return html.match(new RegExp(`<${name}\\b${ATTRS}>`, 'gi')) ?? [];
}

function meta(html, key) {
  for (const t of tags(html, 'meta')) {
    const k = (attr(t, 'name') ?? attr(t, 'property') ?? '').toLowerCase();
    if (k === key) return attr(t, 'content');
  }
  return null;
}

// Directives whose names take a value after a colon; anything else before a colon in a header
// line is a crawler name scoping the rest of the line.
const VALUE_DIRECTIVES = new Set(['max-snippet', 'max-image-preview', 'max-video-preview', 'unavailable_after']);

// True when a directive list says the page must not be indexed: "noindex", or "none"
// (which means noindex, nofollow). "max-image-preview: none" is a preview limit, not this.
export function directivesBlockIndex(list) {
  return (list ?? '').toLowerCase().split(',').some(token => {
    const name = token.split(':')[0].trim();
    return name === 'noindex' || name === 'none';
  });
}

// Repeated X-Robots-Tag headers reach fetch joined by commas, so a crawler scope can start any
// token ("max-image-preview:large, googlebot: noindex"). Strip the scope per token.
function headerBlocksIndex(value) {
  return (value ?? '').split(',').some(token => {
    const m = token.trim().match(/^([a-z0-9_.-]+)\s*:\s*(.*)$/i);
    return directivesBlockIndex(m && !VALUE_DIRECTIVES.has(m[1].toLowerCase()) ? m[2] : token);
  });
}

// Every robots meta tag and every crawler-specific one (googlebot, bingbot, ...) counts, and
// restrictions combine across tags, as search engines apply them. Returns the evidence or null.
export function indexingBlocks(html, robotsHeader) {
  for (const t of tags(html, 'meta')) {
    const name = (attr(t, 'name') ?? '').toLowerCase();
    if ((name === 'robots' || /bot$/.test(name)) && directivesBlockIndex(attr(t, 'content'))) {
      return `meta ${name}="${attr(t, 'content')}"`;
    }
  }
  return headerBlocksIndex(robotsHeader) ? `X-Robots-Tag: ${robotsHeader}` : null;
}

function linkRel(html, rel) {
  return tags(html, 'link').filter(t => (attr(t, 'rel') ?? '').toLowerCase().split(/\s+/).includes(rel));
}

export function visibleText(html) {
  const clean = markupOnly(html);
  const body = clean.match(/<body\b[^>]*>([\s\S]*)<\/body>/i)?.[1] ?? clean;
  return stripTags(body.replace(/<(script|style|noscript|svg|template|head)\b[\s\S]*?<\/\1>/gi, ' '));
}

// RFC 9309: consecutive user-agent lines open one group; rules follow until the next group.
export function parseRobots(txt) {
  const groups = [];
  let current = null;
  let lastWasAgent = false;
  for (const raw of (txt ?? '').split(/\r?\n/)) {
    const line = raw.replace(/#.*/, '').trim();
    const m = line.match(/^([A-Za-z-]+)\s*:\s*(.*)$/);
    if (!m) continue;
    const key = m[1].toLowerCase();
    const value = m[2].trim();
    if (key === 'user-agent') {
      if (!lastWasAgent) { current = { agents: [], rules: [] }; groups.push(current); }
      current.agents.push(value.toLowerCase());
      lastWasAgent = true;
      continue;
    }
    // Only rules close a run of user-agent lines; Sitemap and other extension records do not
    // split a group (RFC 9309 2.2.4).
    if (key !== 'allow' && key !== 'disallow') continue;
    lastWasAgent = false;
    if (current && value) current.rules.push({ allow: key === 'allow', path: value });
  }
  const sitemaps = (txt ?? '').split(/\r?\n/).map(l => l.match(/^\s*sitemap\s*:\s*(\S+)/i)?.[1]).filter(Boolean);
  return { groups, sitemaps };
}

// RFC 9309 2.2.2: compare paths after decoding percent-encoded unreserved ASCII and
// percent-encoding everything outside ASCII, so "/%70rivate" matches "/private" and
// "/café" matches "/caf%C3%A9". Encoded "/" and "%" keep their meaning.
export function normalizePath(path) {
  return path
    .replace(/%([0-9a-f]{2})/gi, (m, hex) => {
      const ch = String.fromCharCode(parseInt(hex, 16));
      return /[A-Za-z0-9\-._~]/.test(ch) ? ch : m.toUpperCase();
    })
    .replace(/[^\x00-\x7F]/gu, ch => encodeURIComponent(ch));
}

function ruleRegex(path) {
  const anchored = path.endsWith('$');
  const body = (anchored ? path.slice(0, -1) : path).split('*').map(s => s.replace(/[.+?^${}()|[\]\\]/g, '\\$&')).join('.*');
  return new RegExp(`^${body}${anchored ? '$' : ''}`);
}

// All groups naming the agent are merged; '*' groups apply only when none do. The longest
// matching rule wins, and allow wins a tie (RFC 9309 section 2.2.2).
export function isAllowed(robots, agent, path = '/') {
  const name = agent.toLowerCase();
  let groups = robots.groups.filter(g => g.agents.includes(name));
  if (!groups.length) groups = robots.groups.filter(g => g.agents.includes('*'));
  let best = null;
  const target = normalizePath(path);
  for (const rule of groups.flatMap(g => g.rules)) {
    const rulePath = normalizePath(rule.path);
    if (!ruleRegex(rulePath).test(target)) continue;
    const len = rulePath.replace(/\$$/, '').length;
    if (!best || len > best.len || (len === best.len && rule.allow)) best = { len, allow: rule.allow };
  }
  return best ? best.allow : true;
}

function jsonLd(html) {
  // Only script elements the tokenizer found, and only when the real `type` attribute says JSON-LD
  // (quoted or not); `data-type` and friends do not count.
  const blocks = tokenize(html).scripts
    .filter(s => (attr(s.attrs, 'type') ?? '').trim().toLowerCase() === 'application/ld+json')
    .map(s => s.body);
  const types = new Set();
  let invalid = 0;
  const collect = node => {
    if (Array.isArray(node)) return node.forEach(collect);
    if (!node || typeof node !== 'object') return;
    const t = node['@type'];
    (Array.isArray(t) ? t : t ? [t] : []).forEach(x => types.add(String(x)));
    if (node['@graph']) collect(node['@graph']);
  };
  for (const b of blocks) {
    try { collect(JSON.parse(b)); } catch { invalid += 1; }
  }
  return { count: blocks.length, invalid, types: [...types].sort() };
}

function headingOutline(html) {
  return [...html.matchAll(/<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi)].map(m => ({ level: +m[1], text: stripTags(m[2]).slice(0, 90) }));
}

function allCapsRuns(text) {
  return (text.match(/\b[A-Z][A-Z0-9'’&-]{1,}(?:\s+[A-Z][A-Z0-9'’&-]{1,}){2,}\b/g) ?? []).filter(r => /[A-Z]{3}/.test(r));
}

export function analyze({ url, html: raw, status = 200, robotsTxt = null, robotsState = robotsTxt === null ? 'missing' : 'ok', llmsTxt = null, llmsContentType = null, sitemapOk = null, robotsHeader = null, timing = {} }) {
  const html = markupOnly(raw);
  const findings = [];
  const add = (dimension, severity, id, evidence, fix) => findings.push({ dimension, severity, id, evidence, fix });
  const text = visibleText(raw);
  const words = text ? text.split(/\s+/).length : 0;
  const lower = text.toLowerCase();

  // search
  const title = stripTags(html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? '');
  if (!title) add('search', 'P0', 'title-missing', 'No <title>.', 'Add a title that names the thing and the buyer, 30-60 characters.');
  else if (title.length < 15 || title.length > 65) add('search', 'P2', 'title-length', `Title is ${title.length} chars: "${title}"`, 'Keep the title between 15 and 65 characters so it is not truncated or vague.');
  const description = meta(html, 'description');
  if (!description) add('search', 'P1', 'description-missing', 'No meta description.', 'Write a 70-160 character description that answers "what is this and for whom".');
  else if (description.length < 70 || description.length > 165) add('search', 'P2', 'description-length', `Description is ${description.length} chars.`, 'Aim for 70-160 characters.');
  const indexBlock = indexingBlocks(html, robotsHeader);
  if (indexBlock) add('search', 'P0', 'noindex', indexBlock, 'Remove noindex from a page meant to be found, unless it is deliberate (then accept the finding).');
  const canonical = linkRel(html, 'canonical').map(t => attr(t, 'href'))[0];
  if (!canonical) add('search', 'P1', 'canonical-missing', 'No rel=canonical.', 'Add an absolute canonical URL on the canonical host.');
  else if (!/^https?:\/\//i.test(canonical)) add('search', 'P2', 'canonical-relative', `canonical="${canonical}"`, 'Use an absolute canonical URL.');
  const outline = headingOutline(html);
  const h1s = outline.filter(h => h.level === 1);
  if (h1s.length === 0) add('search', 'P1', 'h1-missing', 'No <h1> in server HTML.', 'Render exactly one h1 that states what the page is.');
  if (h1s.length > 1) add('search', 'P2', 'h1-multiple', `${h1s.length} h1 elements.`, 'Keep one h1; demote the rest.');
  for (let i = 1; i < outline.length; i += 1) {
    if (outline[i].level > outline[i - 1].level + 1) {
      add('search', 'P2', 'heading-skip', `h${outline[i - 1].level} → h${outline[i].level} at "${outline[i].text}"`, 'Do not skip heading levels; size headings with CSS, not tag choice.');
      break;
    }
  }
  const og = ['og:title', 'og:description', 'og:image'].filter(k => !meta(html, k));
  if (og.length) add('search', 'P2', 'open-graph-incomplete', `Missing ${og.join(', ')}.`, 'Add Open Graph title, description and a 1200x630 image so shared links render.');
  const lang = attr(html.match(/<html\b[^>]*>/i)?.[0] ?? '', 'lang');
  if (!lang) add('search', 'P1', 'lang-missing', '<html> has no lang.', 'Set <html lang> so search and screen readers pick the right language.');
  if (sitemapOk === false) add('search', 'P2', 'sitemap-missing', 'No sitemap at robots Sitemap: or /sitemap.xml.', 'Publish sitemap.xml and reference it from robots.txt.');

  // answer engines
  const ld = jsonLd(raw);
  if (ld.count === 0) add('answer', 'P1', 'jsonld-missing', 'No JSON-LD structured data.', 'Add JSON-LD for the entity the page is about (Organization/Person + WebSite, then Product, Article or FAQPage as true).');
  if (ld.invalid) add('answer', 'P1', 'jsonld-invalid', `${ld.invalid} JSON-LD block(s) fail to parse.`, 'Fix the JSON; an unparseable block is ignored entirely.');
  if (ld.count && !ld.types.some(t => ['Organization', 'Person', 'WebSite', 'LocalBusiness', 'Corporation'].includes(t))) {
    add('answer', 'P2', 'jsonld-no-entity', `Types present: ${ld.types.join(', ') || 'none'}.`, 'Declare who publishes this (Organization or Person) so answers can attribute it.');
  }
  if (words < SEARCH_WORD_FLOOR) add('answer', 'P1', 'thin-server-text', `${words} words of text in the server HTML.`, 'Server-render the core copy. Crawlers that do not run JavaScript see only this text.');
  const hiddenOnLoad = (html.match(/style\s*=\s*["'][^"']*opacity\s*:\s*(?:0(?:\.0*)?|\.0+)(?![.\d])/gi) ?? []).length;
  if (hiddenOnLoad >= 3) add('answer', 'P1', 'ssr-hidden-content', `${hiddenOnLoad} elements ship with inline opacity:0.`, 'Animate from a class added after mount, or reset under html:not(.js), so content exists without JavaScript.');
  // Google states AI Overviews need no llms.txt (developers.google.com, "AI features and your website", 2025-12-10),
  // so it is hygiene for agents that do read it, never a score.
  const llmsIsHtml = llmsTxt !== null && ((llmsContentType && /html/i.test(llmsContentType)) || /^\s*<(!doctype|html)/i.test(llmsTxt));
  if (llmsTxt === null) add('answer', 'info', 'llms-txt-missing', 'No /llms.txt.', 'Optional: publish /llms.txt as a markdown index of the pages an agent should read first.');
  else if (llmsIsHtml) add('answer', 'P2', 'llms-txt-html', '/llms.txt returns an HTML page.', 'Serve llms.txt as text/plain or text/markdown, or return 404; an HTML fallback looks like a broken file.');
  // RFC 9309 2.3.1: a 4xx robots.txt means no rules; an unreachable one means assume full disallow.
  const robots = parseRobots(robotsTxt);
  let pagePath = '/';
  try { const u = new URL(url); if (/^https?:$/.test(u.protocol)) pagePath = u.pathname + u.search; } catch { /* file input */ }
  const blocked = agents => (robotsState === 'unreachable' ? agents
    : robotsState === 'ok' ? agents.filter(a => !isAllowed(robots, a, pagePath)) : []);
  const blockedSearch = blocked(AI_SEARCH_AGENTS);
  const blockedTraining = blocked(AI_TRAINING_AGENTS);
  if (robotsState === 'unreachable') add('search', 'P1', 'robots-unreachable', 'robots.txt returned a server error or did not answer.', 'Crawlers treat an unreachable robots.txt as "disallow everything". Make it return 200, or 404 if there are no rules.');
  if (blockedSearch.length) add('answer', 'P1', 'ai-search-blocked', `robots.txt blocks ${blockedSearch.join(', ')} from ${pagePath}.`, 'Allow AI search and user-fetch agents if you want to be cited in AI answers.');

  // mobile
  const viewport = (meta(html, 'viewport') ?? '').toLowerCase().replace(/\s+/g, '');
  if (!viewport) add('mobile', 'P0', 'viewport-missing', 'No viewport meta.', 'Add width=device-width, initial-scale=1, viewport-fit=cover.');
  else {
    if (!viewport.includes('width=device-width')) add('mobile', 'P1', 'viewport-width', `viewport="${viewport}"`, 'Use width=device-width.');
    if (viewport.includes('user-scalable=no') || viewport.includes('user-scalable=0') || /maximum-scale=1(?![.\d])|maximum-scale=1\.0(?!\d)/.test(viewport)) {
      add('mobile', 'P1', 'zoom-disabled', `viewport="${viewport}"`, 'Never disable zoom; fix input font-size (16px) instead.');
    }
    if (!viewport.includes('viewport-fit=cover')) add('mobile', 'P2', 'viewport-fit', 'viewport-fit=cover not set.', 'Set viewportFit: "cover" or every env(safe-area-inset-*) resolves to 0.');
  }
  if (!meta(html, 'theme-color')) add('mobile', 'P2', 'theme-color-missing', 'No theme-color.', 'Declare theme-color per scheme so the status bar matches.');
  if (!linkRel(html, 'manifest').length) add('mobile', 'P2', 'manifest-missing', 'No web app manifest link.', 'Ship app/manifest.ts with display "standalone" and real icons.');
  if (!linkRel(html, 'apple-touch-icon').length) add('mobile', 'P2', 'touch-icon-missing', 'No apple-touch-icon.', 'Add a 180x180 apple-touch-icon.');

  // access (static half only)
  const imgs = tags(html, 'img');
  const noAlt = imgs.filter(t => attr(t, 'alt') === null).length;
  if (noAlt) add('access', noAlt > 3 ? 'P1' : 'P2', 'img-alt-missing', `${noAlt} of ${imgs.length} <img> have no alt attribute.`, 'Give every image alt text, or alt="" when decorative.');
  const emptyLinks = [...html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)]
    .filter(m => !stripTags(m[2]) && !/aria-label|title=/i.test(m[1]) && !/<img\b[^>]*alt\s*=\s*["'][^"']+/i.test(m[2]) && !/aria-label/i.test(m[2])).length;
  if (emptyLinks) add('access', 'P1', 'link-no-name', `${emptyLinks} links have no accessible name.`, 'Give icon links an aria-label or visually hidden text.');
  if (!/href\s*=\s*["']#(main|content|main-content|skip)/i.test(html)) add('access', 'P2', 'skip-link-missing', 'No skip link to main content.', 'Add a skip link as the first focusable element.');

  // craft
  const caps = allCapsRuns(text);
  const capsClasses = (html.match(/class\s*=\s*["'][^"']*\buppercase\b/gi) ?? []).length;
  if (caps.length + capsClasses >= 8) add('craft', 'P1', 'all-caps', `${caps.length} all-caps text runs and ${capsClasses} uppercase classes.`, 'Keep at most one short all-caps eyebrow per viewport; set headings, nav and buttons in sentence case.');
  const slop = SLOP_WORDS.filter(w => lower.includes(w));
  if (slop.length) add('craft', slop.length >= 3 ? 'P1' : 'P2', 'stock-vocabulary', `Stock words: ${slop.join(', ')}.`, 'Replace with the noun the buyer uses, the number you measured, the verb the product does.');
  if (/lorem ipsum/i.test(text)) add('craft', 'P0', 'placeholder-copy', 'Lorem ipsum in live copy.', 'Replace placeholder copy before anyone sees it.');
  if (/trusted by|used by (thousands|millions)|join \d[\d,]* (others|creators|people)/i.test(text)) {
    add('craft', 'P1', 'unbacked-social-proof', 'Social-proof phrasing found; verify it maps to evidence.', 'Every count and "trusted by" needs a source, or cut it.');
  }

  // speed
  const bytes = Buffer.byteLength(raw);
  if (bytes > 600_000) add('speed', 'P1', 'html-heavy', `${Math.round(bytes / 1024)} KB of HTML.`, 'Trim inlined data and RSC payload; aim under 250 KB.');
  else if (bytes > 250_000) add('speed', 'P2', 'html-heavy', `${Math.round(bytes / 1024)} KB of HTML.`, 'Aim under 250 KB of HTML.');
  if (timing.ttfbMs > 1800) add('speed', 'P1', 'slow-ttfb', `${timing.ttfbMs} ms to first byte.`, 'Cache or statically render the route; TTFB over 1.8 s fails the Core Web Vitals budget.');
  else if (timing.ttfbMs > 800) add('speed', 'P2', 'slow-ttfb', `${timing.ttfbMs} ms to first byte.`, 'Target TTFB under 800 ms.');
  const scripts = tags(html, 'script').filter(t => attr(t, 'src')).length;
  if (scripts > 30) add('speed', 'P2', 'script-count', `${scripts} external scripts.`, 'Audit the bundle split and third-party tags.');
  const fontFamilies = linkRel(html, 'stylesheet').map(t => attr(t, 'href') ?? '').filter(h => /fonts\.googleapis/.test(h))
    .flatMap(h => [...h.matchAll(/family=([^:&]+)/g)].map(m => m[1])).length;
  if (fontFamilies > 3) add('speed', 'P2', 'font-families', `${fontFamilies} Google font families.`, 'Self-host with next/font and keep to three families.');

  if (status >= 400) add('search', 'P0', 'http-error', `HTTP ${status}.`, 'The page must return 200.');

  const scores = Object.fromEntries(DIMENSIONS.map(d => {
    const loss = findings.filter(f => f.dimension === d).reduce((n, f) => n + PENALTY[f.severity], 0);
    return [d, Math.max(0, 5 - loss)];
  }));
  const total = DIMENSIONS.reduce((n, d) => n + scores[d], 0);
  const order = { P0: 0, P1: 1, P2: 2, info: 3 };
  findings.sort((a, b) => order[a.severity] - order[b.severity]);

  return {
    url,
    scannedAt: new Date().toISOString(),
    status,
    score: total,
    max: DIMENSIONS.length * 5,
    scores,
    facts: {
      title, description, canonical, lang, words, htmlKB: Math.round(bytes / 1024), ttfbMs: timing.ttfbMs ?? null,
      h1: h1s.map(h => h.text), jsonLdTypes: ld.types, llmsTxt: llmsTxt !== null && !llmsIsHtml,
      aiSearchBlocked: blockedSearch, aiTrainingBlocked: blockedTraining,
    },
    findings,
  };
}

const UA = 'Mozilla/5.0 (compatible; StarlightWebStudio/0.1; +https://github.com/frankxai/claude-skills-library)';

async function get(url, timeoutMs = 15000) {
  const started = performance.now();
  const res = await fetch(url, { headers: { 'user-agent': UA, accept: 'text/html,text/plain,*/*' }, redirect: 'follow', signal: AbortSignal.timeout(timeoutMs) });
  const ttfbMs = Math.round(performance.now() - started);
  const body = await res.text();
  return { res, body, ttfbMs };
}

// Absent (4xx) and unreachable (5xx, timeout, network) mean different things for robots.txt.
async function optional(url) {
  try {
    const { res, body } = await get(url, 8000);
    if (res.ok) return { state: 'ok', body, type: res.headers.get('content-type') ?? '' };
    return { state: res.status >= 500 ? 'unreachable' : 'missing' };
  } catch { return { state: 'unreachable' }; }
}

export async function scanUrl(url) {
  return analyze(await fetchPage(url));
}

export async function fetchPage(url) {
  const page = await get(url);
  const origin = new URL(page.res.url).origin;
  const [robots, llms] = await Promise.all([optional(`${origin}/robots.txt`), optional(`${origin}/llms.txt`)]);
  const declared = parseRobots(robots.body).sitemaps[0];
  const sitemap = await optional(declared ?? `${origin}/sitemap.xml`);
  return {
    url: page.res.url,
    html: page.body,
    status: page.res.status,
    robotsTxt: robots.body ?? null,
    robotsState: robots.state,
    llmsTxt: llms.body ?? null,
    llmsContentType: llms.type ?? null,
    sitemapOk: sitemap.state === 'ok' && /<(urlset|sitemapindex)\b/i.test(sitemap.body),
    robotsHeader: page.res.headers.get('x-robots-tag'),
    timing: { ttfbMs: page.ttfbMs },
  };
}

export function toMarkdown(r) {
  const lines = [`# ${r.url} — machine score ${r.score}/${r.max}`, '', `Scanned ${r.scannedAt}. HTTP ${r.status}, ${r.facts.htmlKB} KB, TTFB ${r.facts.ttfbMs ?? '—'} ms, ${r.facts.words} words of server text.`, '',
    '| Dimension | Score |', '|---|---|', ...DIMENSIONS.map(d => `| ${d} | ${r.scores[d]}/5 |`), '', '## Findings', ''];
  if (!r.findings.length) lines.push('None. This scan only reads server HTML; layout, motion and taste need the visual pass.');
  for (const f of r.findings) lines.push(`- **${f.severity} ${f.dimension}/${f.id}** — ${f.evidence} Fix: ${f.fix}`);
  return lines.join('\n');
}

async function main(argv) {
  const args = argv.slice(2);
  const json = args.includes('--json');
  const fileIdx = args.indexOf('--html');
  const url = args.find(a => /^https?:\/\//.test(a));
  if (!url && fileIdx < 0) {
    console.error('usage: studio-scan.mjs <url> [--json]   |   studio-scan.mjs --html <file> [--json]');
    return 3;
  }
  let input;
  try {
    input = fileIdx >= 0
      ? { url: `file:${args[fileIdx + 1]}`, html: await readFile(args[fileIdx + 1], 'utf8') }
      : await fetchPage(url);
  } catch (err) {
    console.error(`could not fetch ${url ?? args[fileIdx + 1]}: ${err.message}`);
    return 3;
  }
  let report;
  try {
    report = analyze(input);
  } catch (err) {
    console.error(`fetched ${input.url} but the analysis failed: ${err.stack ?? err.message}`);
    return 4;
  }
  console.log(json ? JSON.stringify(report, null, 2) : toMarkdown(report));
  return report.findings.some(f => f.severity === 'P0') ? 1 : 0;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main(process.argv).then(code => { process.exitCode = code; });
}
