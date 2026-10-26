#!/usr/bin/env node
// web-guidelines-lint.mjs — the model-free half of the Web Interface Guidelines.
//
// The `web-design-guidelines` skill needs a model and a network fetch. This
// covers the subset that is pure pattern matching, so it can run in CI on every
// PR and catch regressions between sessions.
//
//   node web-guidelines-lint.mjs <file...>        # explicit files, every line
//   node web-guidelines-lint.mjs --changed        # ONLY lines this PR added
//   node web-guidelines-lint.mjs --changed --base origin/develop
//   node web-guidelines-lint.mjs --changed --all-lines   # whole changed files
//
// Exit 1 if any ERROR fires. WARN never fails the build.
//
// `--changed` is a RATCHET, not an audit: it reports only lines the diff adds.
// A real codebase has thousands of pre-existing violations (frankx.ai had 526
// `transition-all` alone). Failing a PR for a line it merely sat next to is how
// a linter gets switched off. You cannot make it worse; you are not forced to
// fix everything you touch. Use `--all-lines`, or pass files explicitly, when
// you actually want the full audit of a file.
//
// Design rule: every check here must be near-zero false positive. A linter that
// cries wolf gets disabled, and then nothing is enforced at all. Judgment calls
// belong in the skill, not here.
//
// Brand rules. A repo opts in with `.claude/ci/brand-lint.json` at its root
// (the directory the linter runs from). Without that file these rules stay as
// they were: gradient-text, img-empty-alt and decorative-grid-bg warn, and
// banned-hex and font-family-budget do nothing.
//
//   {
//     "bannedHex": ["#ab47c7", "#43bfe3"],  // error on any added line using one
//     "gradientText": "error",              // "warn" (default) | "error" | "off"
//     "maxFontFamilies": 3,                 // whole repo, not just added lines
//     "fontScanIgnore": ["public/games/"]   // path prefixes the font count skips
//   }
//
// Any other key (except `$`-prefixed metadata such as `$schema`) is a
// malformed config and exits 2, so a misspelt key cannot disarm a check.
//
// font-family-budget is the one check that is not a ratchet: a family budget is
// a property of the whole site, so it counts every tracked file. A repo that
// sets maxFontFamilies below what it ships fails until it cuts a family; set
// the budget to today's count first, then lower it.

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, statSync } from 'node:fs';

// argv array, never a template string: `base` comes from --base, which in CI is
// github.base_ref — externally influenced. Low practical risk (you need push
// access to name a branch), but string-built shell is not a habit worth having.
function git(argv, opts = {}) {
  return execFileSync('git', argv, { encoding: 'utf8', ...opts });
}

const UI_EXT = /\.(tsx|jsx|vue|svelte|astro|css|scss|sass)$/;
// Deliberately NARROWER than the PreToolUse hook's NOT_UI, which also skips
// lib/, utils/, hooks/ and server/. The hook is deciding "is this change worth
// interrupting a human about"; this is deciding "does this file contain markup
// worth checking". A component that happens to live under lib/ still ships to a
// browser, so it gets linted even though it does not get nagged about.
const NOT_UI = /(^|\/)(api|__tests__)\/|\.(test|spec|d)\.(ts|tsx|js|jsx)$|(^|\/)route\.(ts|js)$/;

const args = process.argv.slice(2);
const useChanged = args.includes('--changed');
const allLines = args.includes('--all-lines');
const baseIdx = args.indexOf('--base');
const base = baseIdx !== -1 ? args[baseIdx + 1] : 'origin/main';

function requireBase() {
  try {
    git(['rev-parse', '--verify', base], { stdio: 'ignore' });
  } catch {
    console.error(`web-guidelines-lint: base ref '${base}' not found — fetch it first, or pass files explicitly.`);
    process.exit(2);
  }
}

function changedFiles() {
  requireBase();
  const out = git(['diff', '--name-only', '--diff-filter=d', `${base}...HEAD`]);
  return out.split('\n').filter(Boolean);
}

// Map of file → Set of line numbers this diff ADDS. Parsed from -U0 hunks.
function addedLines() {
  requireBase();
  const diff = git(['diff', '-U0', '--diff-filter=d', `${base}...HEAD`], {
    maxBuffer: 64 * 1024 * 1024,
  });
  const map = new Map();
  let file = null;
  for (const line of diff.split('\n')) {
    if (line.startsWith('+++ b/')) {
      file = line.slice(6);
      if (!map.has(file)) map.set(file, new Set());
      continue;
    }
    const hunk = /^@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@/.exec(line);
    if (hunk && file) {
      const start = parseInt(hunk[1], 10);
      const count = hunk[2] === undefined ? 1 : parseInt(hunk[2], 10);
      for (let i = 0; i < count; i++) map.get(file).add(start + i);
    }
  }
  return map;
}

const candidates = useChanged
  ? changedFiles()
  : args.filter(a => !a.startsWith('--') && a !== base);

const files = candidates.filter(f => {
  if (!UI_EXT.test(f) || NOT_UI.test(f)) return false;
  try { return statSync(f).isFile(); } catch { return false; }
});

// A config that is present but wrong exits 2. Silently falling back to the
// defaults would turn a typo into a gate that looks armed and checks nothing.
const BRAND_CONFIG = '.claude/ci/brand-lint.json';
const BRAND_KEYS = ['bannedHex', 'gradientText', 'maxFontFamilies', 'fontScanIgnore'];
function loadBrandConfig() {
  if (!existsSync(BRAND_CONFIG)) return {};
  const fail = why => {
    console.error(`web-guidelines-lint: ${BRAND_CONFIG}: ${why}`);
    process.exit(2);
  };
  let cfg;
  try { cfg = JSON.parse(readFileSync(BRAND_CONFIG, 'utf8')); } catch (e) { fail(`not valid JSON (${e.message})`); }
  if (!cfg || typeof cfg !== 'object' || Array.isArray(cfg)) fail('must be a JSON object');
  // An unknown key is a misspelt known one until proven otherwise: `maxfontFamilies`
  // would otherwise leave the budget unset and pass. `$schema`-style keys are metadata.
  for (const k of Object.keys(cfg)) {
    if (k.startsWith('$') || BRAND_KEYS.includes(k)) continue;
    const near = BRAND_KEYS.find(b => b.toLowerCase() === k.toLowerCase().replace(/[-_\s]/g, ''));
    fail(`unknown key "${k}"${near ? ` (did you mean "${near}"?)` : ''}; known keys: ${BRAND_KEYS.join(', ')}`);
  }
  // A key that is present must hold the right type: `null` is a typo, not a default.
  const has = k => Object.prototype.hasOwnProperty.call(cfg, k);
  const hex = has('bannedHex') ? cfg.bannedHex : [];
  if (!Array.isArray(hex) || hex.some(h => typeof h !== 'string' || !/^#?(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(h))) {
    fail('bannedHex must be an array of 3- or 6-digit hex colours, e.g. ["#ab47c7"]');
  }
  if (has('gradientText') && !['warn', 'error', 'off'].includes(cfg.gradientText)) {
    fail('gradientText must be "warn", "error" or "off"');
  }
  if (has('maxFontFamilies') && !(Number.isInteger(cfg.maxFontFamilies) && cfg.maxFontFamilies >= 1)) {
    fail('maxFontFamilies must be a positive integer');
  }
  const ignore = has('fontScanIgnore') ? cfg.fontScanIgnore : [];
  // An empty prefix matches every path and would switch the budget off.
  if (!Array.isArray(ignore) || ignore.some(p => typeof p !== 'string' || !p.trim())) {
    fail('fontScanIgnore must be an array of non-empty path prefixes');
  }
  return {
    bannedHex: hex.map(h => h.replace(/^#/, '').toLowerCase()),
    gradientText: has('gradientText') ? cfg.gradientText : 'warn',
    maxFontFamilies: has('maxFontFamilies') ? cfg.maxFontFamilies : undefined,
    fontScanIgnore: ignore,
  };
}
const brand = loadBrandConfig();

const CSS_EXT = /\.(css|scss|sass)$/;
const SFC_EXT = /\.(vue|svelte|astro)$/;

// Comments become spaces (newlines kept), so offsets and line numbers still
// line up. String-aware, so 'https://fonts.googleapis.com/…' is not a comment.
// Plain CSS has no // comment (and `url(//cdn…)` is common there); Sass does,
// except inside an unquoted url(…), which it parses as a raw token. A <style>
// block in markup follows the same rules for its own lang, not the file's.
function stripComments(src, file) {
  const fileSass = /\.(scss|sass)$/.test(file);
  const fileCss = CSS_EXT.test(file) && !fileSass;
  const html = /\.(html|vue|svelte|astro)$/.test(file);
  const blank = s => s.replace(/[^\n]/g, ' ');
  let sass = fileSass;
  let css = fileCss;
  let out = '';
  let q = null;
  for (let i = 0; i < src.length;) {
    const c = src[i];
    if (html && !q && c === '<') {
      const open = /^<style\b[^>]*>/i.exec(src.slice(i, i + 200));
      if (open) {
        sass = /\blang\s*=\s*["']?(?:scss|sass)\b/i.test(open[0]);
        css = !sass;
        out += open[0];
        i += open[0].length;
        continue;
      }
      if (/^<\/style\s*>/i.test(src.slice(i, i + 10))) { sass = fileSass; css = fileCss; }
    }
    if (q) {
      out += c;
      if (c === '\\' && i + 1 < src.length) { out += src[i + 1]; i += 2; continue; }
      if (c === q || (c === '\n' && q !== '`')) q = null;
      i++;
      continue;
    }
    let end = -1;
    if (c === '/' && src[i + 1] === '*') {
      const e = src.indexOf('*/', i + 2);
      end = e === -1 ? src.length : e + 2;
    } else if (!css && c === '/' && src[i + 1] === '/' && src[i - 1] !== ':' &&
               !(sass && /url\(\s*$/i.test(src.slice(Math.max(0, i - 8), i)))) {
      const e = src.indexOf('\n', i);
      end = e === -1 ? src.length : e;
    } else if (html && src.startsWith('<!--', i)) {
      const e = src.indexOf('-->', i + 4);
      end = e === -1 ? src.length : e + 3;
    }
    if (end !== -1) { out += blank(src.slice(i, end)); i = end; continue; }
    if (c === '"' || c === "'" || c === '`') q = c;
    out += c;
    i++;
  }
  return out;
}

// Line ranges of <style> blocks in a .vue/.svelte/.astro file: those lines are
// CSS and get the stylesheet scoping, the rest is markup.
function styleRanges(lines) {
  const out = [];
  let start = -1;
  lines.forEach((l, i) => {
    if (start === -1 && /<style\b[^>]*>/i.test(l)) start = i;
    if (start !== -1 && /<\/style>/i.test(l)) { out.push([start, i]); start = -1; }
  });
  return out;
}

// The declarations of the CSS rule (or JS object literal) that encloses
// `pos`, nested blocks excluded, so a parent rule and its nested child never
// add up. Returns null when `pos` sits in no block.
function ownBlock(text, pos) {
  let d = 0;
  let open = -1;
  for (let p = pos - 1; p >= 0; p--) {
    if (text[p] === '}') d++;
    else if (text[p] === '{') { if (d === 0) { open = p; break; } d--; }
  }
  if (open === -1) return null;
  let own = '';
  d = 0;
  for (let p = open + 1; p < text.length; p++) {
    const c = text[p];
    if (c === '{') d++;
    else if (c === '}') { if (d === 0) break; d--; }
    else if (d === 0) own += c;
  }
  return { text: own, key: open };
}

// Offset of the `>` that closes the opening tag starting at `start`: the first
// one outside quotes and outside {…} props, so `title="a > b"`, `[&>svg]:…`
// and `onClick={() => …}` do not end the tag. Unclosed: end of text.
function tagEnd(text, start) {
  let d = 0;
  let q = null;
  for (let p = start + 1; p < text.length; p++) {
    const c = text[p];
    if (q) {
      if (c === '\\') p++;
      else if (c === q) q = null;
    } else if (c === '"' || c === "'" || c === '`') q = c;
    else if (c === '{') d++;
    else if (c === '}') d = Math.max(0, d - 1);
    else if (c === '>' && d === 0) return p;
  }
  return text.length - 1;
}

// The JSX/HTML element whose opening tag contains `pos`: the nearest `<Tag`
// before it whose own closing `>` lies at or after `pos`. A nearer tag that
// closes first (`icon={<Icon />}`, an earlier sibling) is skipped, so the
// answer never depends on what characters sit between the tag and `pos`.
const TAG_LOOKBACK = 4000;
// Offsets of the tag starts between `from` and `to`, read forward so a `<`
// inside a quoted attribute (`title="<Enter"`) is text, not a tag. A `<Tag`
// inside a {…} prop (`icon={<Icon />}`) is a real nested element.
function tagStarts(text, from, to) {
  const starts = [];
  let inTag = false;
  let q = null;
  let d = 0;
  for (let p = from; p < to; p++) {
    const c = text[p];
    const opens = c === '<' && /[A-Za-z]/.test(text[p + 1] || '') &&
      !/[\w$)\]]/.test(text[p - 1] || ''); // `i<n`, `f()<x`: a comparison
    if (!inTag) {
      if (opens) { starts.push(p); inTag = true; d = 0; q = null; }
    } else if (q) {
      if (c === '\\') p++;
      else if (c === q) q = null;
    } else if (c === '"' || c === "'" || c === '`') q = c;
    else if (c === '{') d++;
    else if (c === '}') d = Math.max(0, d - 1);
    else if (opens && d > 0) starts.push(p);
    else if (c === '>' && d === 0) inTag = false;
  }
  return starts;
}

function ownElement(text, pos) {
  let from = Math.max(0, pos - TAG_LOOKBACK);
  if (from > 0) from = text.indexOf('\n', from) + 1 || pos; // a line start, not mid-attribute
  const starts = tagStarts(text, from, pos);
  for (let k = starts.length - 1; k >= 0; k--) {
    const p = starts[k];
    const end = tagEnd(text, p);
    if (end >= pos) return { text: text.slice(p, end + 1), key: p };
  }
  return null;
}

// True when the `{` at `open` starts an object literal (`= {`, `({`, `: {`,
// `return {`), not a function body, block or JSX child expression (`) {`,
// `=> {`, `> {`).
function isObjectLiteral(text, open) {
  let p = open - 1;
  while (p >= 0 && /\s/.test(text[p])) p--;
  if (p < 0) return false;
  if (text[p] === '>') return false;
  return /[(,:=[?&|]/.test(text[p]) || /\breturn$/.test(text.slice(Math.max(0, p - 6), p + 1));
}

const lineStarts = new WeakMap();
function offsetOf(lines, i) {
  let starts = lineStarts.get(lines);
  if (!starts) {
    starts = [0];
    for (const l of lines) starts.push(starts[starts.length - 1] + l.length + 1);
    lineStarts.set(lines, starts);
  }
  return starts[i];
}

// What a two-signal rule may look at besides its trigger: the CSS rule it sits
// in (stylesheets, <style> blocks), else the element whose tag it sits in, else
// the enclosing object literal (CSS-in-JS), else its own line. `lines` are
// comment-stripped. Returns { text, key }; the key de-duplicates a scope that
// carries the trigger twice (-webkit-background-clip + background-clip).
const styleCache = new WeakMap();
function scopeOf(lines, i, col, file) {
  let inStyle = CSS_EXT.test(file);
  if (!inStyle && SFC_EXT.test(file)) {
    if (!styleCache.has(lines)) styleCache.set(lines, styleRanges(lines));
    inStyle = styleCache.get(lines).some(([s, e]) => i > s && i < e);
  }
  const all = lines.join('\n');
  const pos = offsetOf(lines, i) + col;
  let hit = inStyle ? ownBlock(all, pos) : ownElement(all, pos);
  // Outside a tag, an enclosing object literal is a CSS-in-JS style. A function
  // body or block is no scope at all: it holds unrelated siblings, and reading
  // them as the second signal is how this rule would report what is not there.
  if (!hit && !inStyle) {
    const obj = ownBlock(all, pos);
    if (obj && obj.text.length <= 800 && isObjectLiteral(all, obj.key)) hit = obj;
  }
  return hit ? { text: hit.text, key: `s${hit.key}` } : { text: lines[i], key: `l${i}` };
}

// Tailwind arbitrary values spell spaces as underscores: bg-[size:24px_24px].
const tw = s => s.replace(/_/g, ' ');
const HAIRLINE = /\d{1,3}px\s*,\s*transparent\s+\d{1,3}px|transparent\s+calc\(100%\s*-\s*\d{1,3}px\)/i;
const CELL = /(?:background-size\s*:|backgroundSize\s*:\s*['"`]|bg-\[size:|bg-size-\[|\/)\s*(\d{1,3})px\s+(\d{1,3})px/gi;

function gradientLayers(t) {
  const out = [];
  const re = /(repeating-)?linear-gradient\(/gi;
  let m;
  while ((m = re.exec(t))) {
    let d = 1;
    let p = m.index + m[0].length;
    const s = p;
    while (p < t.length && d) { if (t[p] === '(') d++; else if (t[p] === ')') d--; p++; }
    out.push({ repeating: !!m[1], args: t.slice(s, p - 1) });
  }
  return out;
}

// A line's axis from the gradient's direction: `to right`/90deg paints
// vertical lines, `to bottom`/0deg (or no direction, the default) horizontal.
function axis(args) {
  const first = args.split(',')[0].trim().toLowerCase();
  if (/^to\s+(left|right)$|^-?(90|270)deg$/.test(first)) return 'x';
  if (/^to\s+(top|bottom)$|^-?(0|180|360)deg$/.test(first)) return 'y';
  return /^(to\s|-?[\d.]+(deg|turn|rad|grad)$)/.test(first) ? null : 'y';
}

// The generated-UI grid backdrop (impeccable's codex-grid-background): two
// hairline layers crossing each other, tiled by a square-ish pixel cell (or
// tiling themselves as repeating gradients). One hairline, or two parallel
// ones, is a rule or a stripe, not a grid.
function gridBackdrop(text) {
  const t = tw(text);
  const hair = gradientLayers(t).filter(l => HAIRLINE.test(l.args));
  const axes = new Set(hair.map(l => axis(l.args)));
  if (!(axes.has('x') && axes.has('y'))) return false;
  if (hair.every(l => l.repeating)) return true;
  for (const m of t.matchAll(CELL)) {
    const [a, b] = [Number(m[1]), Number(m[2])];
    if (Math.min(a, b) >= 4 && Math.max(a, b) <= 2 * Math.min(a, b)) return true;
  }
  return false;
}

// [id, severity, regex, message, fileGuard?, near?]
// fileGuard: if it matches the whole file, the rule is suppressed for that file.
// near: (text of the trigger's own rule or element) → true when the second
// signal is present there.
// message may be a function of the matched line.
const RULES = [
  ['transition-all', 'error', /transition:\s*all\b|(?:^|["'\s:])transition-all(?:[\s"'/]|$)/,
    'transition: all — list the properties explicitly (it animates layout props too)'],

  ['outline-none', 'error', /outline:\s*none|(?:^|["'\s:])outline-none(?:[\s"'/]|$)/,
    'outline removed with no :focus-visible replacement anywhere in this file',
    /focus-visible|focusVisible/],

  // Exempts the deliberate accessible escape hatch: a div that also carries a
  // role and a keyboard affordance (modal backdrops, custom listbox rows) is a
  // legitimate pattern, and flagging it is how this rule would get muted. A
  // bare onClick with no keyboard path is still a real a11y defect.
  ['div-onclick', 'error',
    /<(?:div|span)\b(?![^>]*\b(?:role=|tabIndex|onKeyDown|onKeyUp|onKeyPress))[^>]*\sonClick=/,
    '<div>/<span> with onClick and no keyboard path — use <button> for actions, <a>/<Link> for navigation, or add role + tabIndex + onKeyDown if it genuinely must be a div'],

  ['no-zoom', 'error', /user-scalable\s*=\s*["']?no|maximum-scale\s*=\s*["']?1(?![\d.])/,
    'viewport disables zoom — never block pinch-zoom'],

  ['block-paste', 'error', /onPaste=\{[^}]*preventDefault/,
    'onPaste + preventDefault — never block paste'],

  ['img-no-dims', 'error', /<img\b(?![^>]*\bwidth=)[^>]*>/,
    '<img> without explicit width/height — causes layout shift (CLS)'],

  ['animate-layout-prop', 'warn', /transition:[^;]*\b(width|height|top|left|right|bottom|margin)\b/,
    'transitioning a layout property — animate transform/opacity instead'],

  ['keyframes-no-reduced-motion', 'warn', /@keyframes\b/,
    '@keyframes in a file with no prefers-reduced-motion block',
    /prefers-reduced-motion/],

  // alt="" is correct for a decorative image, so this cannot be an error: the
  // linter cannot see whether the picture carries content. It stays quiet when
  // the tag says it is decorative (aria-hidden, role="presentation"/"none").
  ['img-empty-alt', 'warn',
    /<(?:img|Image)\b(?![^>]*\b(?:aria-hidden(?!=\{?\s*["']?false)|role=\{?\s*["'](?:presentation|none)["']))[^>]*\salt=(?:""|''|\{\s*(?:""|''|``)\s*\})/,
    'empty alt on an image not marked decorative — describe the content, or add aria-hidden / role="presentation" if it is decoration'],

  ['decorative-grid-bg', 'warn', /\d{1,3}px[\s_]*,[\s_]*transparent[\s_]+\d{1,3}px|transparent[\s_]+calc\(100%[\s_]*-[\s_]*\d{1,3}px\)/i,
    'hairline grid backdrop (gradient lines tiled by a px cell) — a generated-UI signature; use real structure or a plain surface',
    null, scope => gridBackdrop(scope)],
];

// Every spelling of one colour: #abc, #abcf, #aabbcc, #aabbccff. A 6-digit
// entry that has a short form (#00bbcc) is banned in that form too.
function hexForms(h) {
  const long = h.length === 3 ? [...h].map(c => c + c).join('') : h;
  const forms = [`${long}(?:[0-9a-f]{2})?`];
  if (/^(.)\1(.)\2(.)\3$/.test(long)) forms.push(`${long[0]}${long[2]}${long[4]}[0-9a-f]?`);
  return forms;
}

if (brand.bannedHex?.length) {
  const re = new RegExp(`#(?:${brand.bannedHex.flatMap(hexForms).join('|')})(?![0-9a-f])`, 'i');
  RULES.push(['banned-hex', 'error', re,
    line => `${re.exec(line)[0]} is on this repo's banned colour list (${BRAND_CONFIG}) — use a design token`]);
}

if (brand.gradientText !== 'off') {
  RULES.push(['gradient-text', brand.gradientText ?? 'warn',
    /background-clip\s*:\s*text|(?:^|["'`\s:])bg-clip-text(?:[\s"'`/]|$)|[bB]ackgroundClip\s*:\s*['"]text['"]/,
    'gradient-clipped text — a generated-UI signature; set headings in a solid colour',
    null, scope => /gradient|\bbg-(?:linear|radial|conic)(?:-|\b)/i.test(scope)]);
}

// Rules that match a whole JSX tag rather than a bare pattern. Prettier breaks
// a tag with several props across lines, so testing one physical line at a time
// silently misses the common real-world shape — a false NEGATIVE, and one that
// makes the rule look like more of a guarantee than it is. For these, join
// forward from the line opening the tag to the line closing it and test that.
// The finding still anchors to the opening line, which is what the ratchet checks.
const TAG_SCOPED = new Set(['div-onclick', 'img-no-dims', 'img-empty-alt']);
const TAG_OPEN = /<(?:div|span|img|Image)\b/;
// Stands in for a `>` that does not close a tag, so the rules' `[^>]*` runs to
// the real end of the tag: `className="[&>svg]:…"`, `onClick={() => …}`.
const INNER_GT = '›';

// The line, from the first tag it opens onward, with every `>` inside a quoted
// prop or a {…} prop masked, joined forward until the last tag it opens closes.
function tagText(lines, i) {
  const line = lines[i];
  const m = TAG_OPEN.exec(line);
  if (!m) return line;
  let out = line.slice(0, m.index);
  let inTag = false;
  let q = null;
  let d = 0;
  for (let j = i; j < Math.min(lines.length, i + 30); j++) {
    const s = j === i ? line.slice(m.index) : ' ' + lines[j].trim();
    for (let k = 0; k < s.length; k++) {
      const c = s[k];
      if (!inTag) {
        if (c === '<' && /[A-Za-z]/.test(s[k + 1] || '')) { inTag = true; d = 0; q = null; }
      } else if (q) {
        // Inside a {…} prop the string is JavaScript, so `\'` does not close it.
        // An HTML attribute has no escapes: `title="C:\"` ends at its quote.
        if (c === '\\' && d > 0 && k + 1 < s.length) {
          out += c + (s[k + 1] === '>' ? INNER_GT : s[k + 1]);
          k++;
          continue;
        }
        if (c === q) q = null;
        else if (c === '>') { out += INNER_GT; continue; }
      } else if (c === '"' || c === "'" || c === '`') q = c;
      else if (c === '{') d++;
      else if (c === '}') d = Math.max(0, d - 1);
      else if (c === '>') {
        if (d > 0) { out += INNER_GT; continue; }
        inTag = false;
      }
      out += c;
    }
    if (!inTag) break;
  }
  return out;
}

let errors = 0;
let warns = 0;
const byFile = new Map();

// Ratchet scope: in --changed mode report only lines the diff adds.
const scope = useChanged && !allLines ? addedLines() : null;

for (const file of files) {
  let text;
  try { text = readFileSync(file, 'utf8'); } catch { continue; }
  const lines = text.split('\n');
  const added = scope ? scope.get(file) : null;
  if (scope && (!added || added.size === 0)) continue;
  // Every rule reads code with comments blanked out (same offsets, same line
  // numbers): `{/* was #ab47c7 */}` is not a use of the colour, and a
  // commented-out gradient neither triggers nor supplies a second signal.
  const code = stripComments(text, file).split('\n');

  for (const [id, severity, re, message, guard, near] of RULES) {
    if (guard && guard.test(text)) continue;
    const seen = new Set();
    lines.forEach((line, i) => {
      if (added && !added.has(i + 1)) return;
      // skip obvious comment lines to cut noise
      const t = line.trim();
      if (t.startsWith('//') || t.startsWith('*') || t.startsWith('/*')) return;
      const subject = TAG_SCOPED.has(id) ? tagText(code, i) : code[i];
      if (!re.test(subject)) return;
      if (near) {
        const m = re.exec(code[i]);
        if (!m) return;
        const sc = scopeOf(code, i, m.index, file);
        if (!near(sc.text)) return;
        if (seen.has(sc.key)) return;
        seen.add(sc.key);
      }
      const msg = typeof message === 'function' ? message(subject) : message;
      const entry = { line: i + 1, severity, id, message: msg };
      if (!byFile.has(file)) byFile.set(file, []);
      byFile.get(file).push(entry);
      if (severity === 'error') errors++; else warns++;
    });
  }
}

// ------------------------------------------------------ font-family-budget
// Every family a tracked file loads, by the four ways a site loads one:
// next/font imports, @font-face, a Google Fonts URL, and @fontsource packages.
// font-family *declarations* that only name a family load nothing and are not
// counted. .claude/ is skipped: skills quote font code as examples.
const FONT_SCAN_EXT = /\.(tsx|jsx|ts|js|mjs|cjs|vue|svelte|astro|css|scss|sass|html)$/;
const FONT_SCAN_SKIP = /(^|\/)(node_modules|\.next|dist|build|out|\.claude)\/|\.(test|spec|d)\.(ts|tsx|js|jsx)$|\.min\.(js|css)$/;

// A local font is identified by its file, not by the variable that holds it:
// `const font = localFont({ src: [Alpha.woff2, Beta.woff2] })` is two families,
// Satoshi-Regular.woff2 + Satoshi-Bold.woff2 is one.
// A suffix is a weight only at a word boundary: after a separator
// (Satoshi-Bold, inter_semi-bold) or at a camelCase hump (InterVariable).
// Without the boundary, Highlight-Regular folds to "High" and merges with
// High-Bold, hiding a family from the budget.
const WEIGHTS = ['thin', 'hairline', 'extra-?light', 'ultra-?light', 'light', 'regular', 'book',
  'normal', 'medium', 'semi-?bold', 'demi-?bold', 'bold', 'extra-?bold', 'ultra-?bold', 'black',
  'heavy', 'italic', 'oblique', 'variable', 'var', 'vf', 'wght', '\\d{3}'];
const humped = w => w.replace(/^[a-z]/, c => c.toUpperCase())
  .replace(/-\?([a-z])/g, (_, c) => `-?[${c}${c.toUpperCase()}]`);
const WEIGHT_AFTER_SEP = new RegExp(`[-_ ](?:${WEIGHTS.join('|')})$`, 'i');
// `VF` is an acronym, so it humps as `InterVF`, not `InterVf`; both occur.
const WEIGHT_AFTER_HUMP = new RegExp(`(?<=[a-z0-9])(?:${[...WEIGHTS.map(humped), 'VF'].join('|')})$`);
function localFamilies(args) {
  const names = new Set();
  for (const m of args.matchAll(/['"`]([^'"`]+\.(?:woff2?|ttf|otf|eot))['"`]/gi)) {
    let base = m[1].split(/[\\/]/).pop().replace(/\.(woff2?|ttf|otf|eot)$/i, '');
    let prev;
    do {
      prev = base;
      base = base.replace(WEIGHT_AFTER_SEP, '').replace(WEIGHT_AFTER_HUMP, '');
    } while (base && base !== prev);
    names.add(base || prev);
  }
  return [...names];
}

function fontFamilies(raw, file) {
  const src = stripComments(raw, file);
  const found = [];
  let m;
  const google = /import\s*\{([^}]*)\}\s*from\s*['"]next\/font\/google['"]/g;
  while ((m = google.exec(src))) {
    for (const spec of m[1].split(',')) {
      const name = spec.trim().replace(/^type\s+/, '').split(/\s+as\s+/)[0].trim();
      if (name) found.push(name.replace(/_/g, ' '));
    }
  }
  // The loader is whatever name the file imports next/font/local's default
  // export under; `localFont` is only the convention.
  const loaders = new Set(['localFont']);
  for (const im of src.matchAll(/import\s+([A-Za-z_$][\w$]*)\s*(?:,\s*\{[^}]*\})?\s*from\s*['"]next\/font\/local['"]/g)) {
    loaders.add(im[1]);
  }
  const local = new RegExp(`(?:const|let|var)\\s+([\\w$]+)\\s*=\\s*(?:${[...loaders].map(n => n.replace(/\$/g, '\\$')).join('|')})\\s*\\(`, 'g');
  while ((m = local.exec(src))) {
    let d = 1;
    let p = local.lastIndex;
    while (p < src.length && d) { if (src[p] === '(') d++; else if (src[p] === ')') d--; p++; }
    const fams = localFamilies(src.slice(local.lastIndex, p));
    for (const f of fams.length ? fams : [m[1]]) found.push(`${f} (next/font/local)`);
  }
  const face = /@font-face\s*\{[^}]*?font-family\s*:\s*(['"]?)([^;'"}]+)\1/g;
  while ((m = face.exec(src))) found.push(m[2].trim());
  const gf = /fonts\.googleapis\.com\/css2?\?([^"'`)\s>]+)/g;
  while ((m = gf.exec(src))) {
    for (const part of m[1].replace(/&amp;/g, '&').split('&')) {
      if (!part.startsWith('family=')) continue;
      for (const fam of part.slice(7).split('|')) {
        let name = fam.split(':')[0].replace(/\+/g, ' ');
        try { name = decodeURIComponent(name); } catch { /* keep the raw spelling */ }
        if (name.trim()) found.push(name.trim());
      }
    }
  }
  const fontsource = /['"]@fontsource(?:-variable)?\/([a-z0-9-]+)/g;
  while ((m = fontsource.exec(src))) found.push(m[1].replace(/-/g, ' '));
  return found;
}

function fontBudget() {
  if (brand.maxFontFamilies === undefined) return null;
  let tracked;
  try {
    tracked = git(['ls-files', '-z'], { maxBuffer: 64 * 1024 * 1024 }).split('\0').filter(Boolean);
  } catch {
    console.error('web-guidelines-lint: maxFontFamilies needs a git checkout to list tracked files.');
    process.exit(2);
  }
  const families = new Map(); // normalised name → { name, files: [] }
  for (const f of tracked) {
    if (!FONT_SCAN_EXT.test(f) || FONT_SCAN_SKIP.test(f)) continue;
    if (brand.fontScanIgnore.some(p => f.startsWith(p))) continue;
    let src;
    try {
      if (statSync(f).size > 1024 * 1024) continue;
      src = readFileSync(f, 'utf8');
    } catch { continue; }
    if (!/next\/font|@font-face|fonts\.googleapis|@fontsource/.test(src)) continue;
    for (const name of fontFamilies(src, f)) {
      const key = name.toLowerCase().replace(/\s+/g, ' ');
      if (!families.has(key)) families.set(key, { name, files: [] });
      const entry = families.get(key);
      if (!entry.files.includes(f)) entry.files.push(f);
    }
  }
  return { max: brand.maxFontFamilies, families: [...families.values()] };
}

const budget = fontBudget();
if (budget && budget.families.length > budget.max) errors++;

function printBudget() {
  if (!budget) return;
  const over = budget.families.length > budget.max;
  console.log(`## font-family-budget (whole repo, ${BRAND_CONFIG})`);
  console.log(`${budget.families.length} famil${budget.families.length === 1 ? 'y' : 'ies'} loaded, budget ${budget.max}${over ? ' - [error] over budget' : ''}`);
  for (const { name, files: where } of budget.families) {
    const more = where.length > 3 ? ` +${where.length - 3} more` : '';
    console.log(`  ${name}: ${where.slice(0, 3).join(', ')}${more}`);
  }
  if (over && process.env.GITHUB_ACTIONS) {
    const list = budget.families.map(f => f.name).join(', ');
    console.log(`::error title=web-guidelines/font-family-budget::${budget.families.length} font families loaded, budget ${budget.max}: ${list}`);
  }
  console.log('');
}

if (!files.length) {
  console.log('web-guidelines-lint: no UI files in scope — nothing to check.');
  printBudget();
  process.exit(errors ? 1 : 0);
}

const mode = scope ? 'added lines only (ratchet)' : 'every line';
console.log(`web-guidelines-lint: ${files.length} UI file(s), ${mode}\n`);
printBudget();

for (const [file, findings] of byFile) {
  console.log(`## ${file}`);
  for (const f of findings) {
    console.log(`${file}:${f.line} - [${f.severity}] ${f.message}`);
    // GitHub Actions annotation
    if (process.env.GITHUB_ACTIONS) {
      const kind = f.severity === 'error' ? 'error' : 'warning';
      console.log(`::${kind} file=${file},line=${f.line},title=web-guidelines/${f.id}::${f.message}`);
    }
  }
  console.log('');
}

if (!byFile.size && !errors) console.log('✓ pass — no mechanical guideline violations.\n');

console.log(`${errors} error(s), ${warns} warning(s).`);
if (errors) {
  console.log('\nThis is the mechanical subset only. Run the `web-design-guidelines` skill');
  console.log('for the full audit, and `visual-proof` before calling a UI change done.');
}
process.exit(errors ? 1 : 0);
