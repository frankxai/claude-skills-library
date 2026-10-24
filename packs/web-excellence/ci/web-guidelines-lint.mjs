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
function loadBrandConfig() {
  if (!existsSync(BRAND_CONFIG)) return {};
  const fail = why => {
    console.error(`web-guidelines-lint: ${BRAND_CONFIG}: ${why}`);
    process.exit(2);
  };
  let cfg;
  try { cfg = JSON.parse(readFileSync(BRAND_CONFIG, 'utf8')); } catch (e) { fail(`not valid JSON (${e.message})`); }
  if (!cfg || typeof cfg !== 'object' || Array.isArray(cfg)) fail('must be a JSON object');
  const hex = cfg.bannedHex ?? [];
  if (!Array.isArray(hex) || hex.some(h => typeof h !== 'string' || !/^#?(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(h))) {
    fail('bannedHex must be an array of 3- or 6-digit hex colours, e.g. ["#ab47c7"]');
  }
  if (cfg.gradientText !== undefined && !['warn', 'error', 'off'].includes(cfg.gradientText)) {
    fail('gradientText must be "warn", "error" or "off"');
  }
  if (cfg.maxFontFamilies !== undefined && !(Number.isInteger(cfg.maxFontFamilies) && cfg.maxFontFamilies >= 1)) {
    fail('maxFontFamilies must be a positive integer');
  }
  const ignore = cfg.fontScanIgnore ?? [];
  if (!Array.isArray(ignore) || ignore.some(p => typeof p !== 'string')) fail('fontScanIgnore must be an array of path prefixes');
  return {
    bannedHex: hex.map(h => h.replace(/^#/, '').toLowerCase()),
    gradientText: cfg.gradientText ?? 'warn',
    maxFontFamilies: cfg.maxFontFamilies,
    fontScanIgnore: ignore,
  };
}
const brand = loadBrandConfig();

const CSS_EXT = /\.(css|scss|sass)$/;

// The text a two-signal rule needs to see beyond its trigger line. In a
// stylesheet that is the declaration block, so two unrelated rules never add up;
// in markup it is a short window, because a className is often split across
// lines by clsx/cn and Prettier. Returns [text, key]; the key de-duplicates a
// block that carries the trigger twice (-webkit-background-clip + background-clip).
function context(lines, i, file) {
  if (CSS_EXT.test(file)) {
    let s = i;
    while (s > 0 && i - s < 40 && !lines[s].includes('{')) {
      if (s !== i && lines[s].includes('}')) { s++; break; }
      s--;
    }
    let e = i;
    while (e < lines.length - 1 && e - i < 40 && !lines[e].includes('}')) e++;
    return [lines.slice(s, e + 1).join('\n'), `b${s}`];
  }
  return [lines.slice(Math.max(0, i - 4), i + 5).join('\n'), `w${i}`];
}

// Tailwind arbitrary values spell spaces as underscores: bg-[size:24px_24px].
const tw = s => s.replace(/_/g, ' ');
const HAIRLINE = /\d{1,3}px\s*,\s*transparent\s+\d{1,3}px|transparent\s+calc\(100%\s*-\s*\d{1,3}px\)/gi;
const PX_CELL = /(?:background-size\s*:|backgroundSize\s*:\s*['"`]|bg-\[size:|bg-size-\[)\s*\d{1,3}px\b/i;
const PX_PAIR = /(?:background-size\s*:|backgroundSize\s*:\s*['"`]|bg-\[size:|bg-size-\[)\s*\d{1,3}px\s+\d{1,3}px/i;

// Two hairline layers tiled by a pixel cell is the generated-UI grid backdrop
// (impeccable's codex-grid-background). One hairline layer with a two-axis
// pixel cell is the same thing drawn as a line field.
function gridBackdrop(text) {
  const t = tw(text);
  const hairlines = (t.match(HAIRLINE) || []).length;
  if (PX_PAIR.test(t)) return hairlines >= 1;
  return hairlines >= 2 && (PX_CELL.test(t) || /repeating-linear-gradient/i.test(t));
}

// [id, severity, regex, message, fileGuard?, near?]
// fileGuard: if it matches the whole file, the rule is suppressed for that file.
// near: (text around the line) → true when the second signal is present.
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
    /<(?:img|Image)\b(?![^>]*\b(?:aria-hidden(?!=\{?\s*["']?false)|role=["'](?:presentation|none)["']))[^>]*\salt=(?:""|''|\{\s*(?:""|''|``)\s*\})/,
    'empty alt on an image not marked decorative — describe the content, or add aria-hidden / role="presentation" if it is decoration'],

  ['decorative-grid-bg', 'warn', /\d{1,3}px[\s_]*,[\s_]*transparent[\s_]+\d{1,3}px|transparent[\s_]+calc\(100%[\s_]*-[\s_]*\d{1,3}px\)/i,
    'hairline grid backdrop (gradient lines tiled by a px cell) — a generated-UI signature; use real structure or a plain surface',
    null, (lines, i, file) => gridBackdrop(context(lines, i, file)[0])],
];

if (brand.bannedHex?.length) {
  const re = new RegExp(`#(?:${brand.bannedHex.join('|')})(?:[0-9a-f]{2})?(?![0-9a-f])`, 'i');
  RULES.push(['banned-hex', 'error', re,
    line => `${re.exec(line)[0]} is on this repo's banned colour list (${BRAND_CONFIG}) — use a design token`]);
}

if (brand.gradientText !== 'off') {
  RULES.push(['gradient-text', brand.gradientText ?? 'warn',
    /background-clip\s*:\s*text|(?:^|["'`\s:])bg-clip-text(?:[\s"'`/]|$)|[bB]ackgroundClip\s*:\s*['"]text['"]/,
    'gradient-clipped text — a generated-UI signature; set headings in a solid colour',
    null, (lines, i, file) => /gradient/i.test(context(lines, i, file)[0])]);
}

// Rules that match a whole JSX tag rather than a bare pattern. Prettier breaks
// a tag with several props across lines, so testing one physical line at a time
// silently misses the common real-world shape — a false NEGATIVE, and one that
// makes the rule look like more of a guarantee than it is. For these, join
// forward from the line opening the tag to the line closing it and test that.
// The finding still anchors to the opening line, which is what the ratchet checks.
const TAG_SCOPED = new Set(['div-onclick', 'img-no-dims', 'img-empty-alt']);
const TAG_OPEN = /<(?:div|span|img|Image)\b/;

function tagText(lines, i) {
  const line = lines[i];
  const m = TAG_OPEN.exec(line);
  if (!m || line.slice(m.index).includes('>')) return line;
  let out = line;
  for (let j = i + 1; j < Math.min(lines.length, i + 30); j++) {
    out += ' ' + lines[j].trim();
    if (lines[j].includes('>')) break;
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

  for (const [id, severity, re, message, guard, near] of RULES) {
    if (guard && guard.test(text)) continue;
    const seen = new Set();
    lines.forEach((line, i) => {
      if (added && !added.has(i + 1)) return;
      // skip obvious comment lines to cut noise
      const t = line.trim();
      if (t.startsWith('//') || t.startsWith('*') || t.startsWith('/*')) return;
      const subject = TAG_SCOPED.has(id) ? tagText(lines, i) : line;
      if (!re.test(subject)) return;
      if (near) {
        if (!near(lines, i, file)) return;
        const key = context(lines, i, file)[1];
        if (seen.has(key)) return;
        seen.add(key);
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

function fontFamilies(src) {
  const found = [];
  let m;
  const google = /import\s*\{([^}]*)\}\s*from\s*['"]next\/font\/google['"]/g;
  while ((m = google.exec(src))) {
    for (const spec of m[1].split(',')) {
      const name = spec.trim().replace(/^type\s+/, '').split(/\s+as\s+/)[0].trim();
      if (name) found.push(name.replace(/_/g, ' '));
    }
  }
  const local = /(?:const|let|var)\s+(\w+)\s*=\s*localFont\s*\(/g;
  while ((m = local.exec(src))) found.push(`${m[1]} (next/font/local)`);
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
    for (const name of fontFamilies(src)) {
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
