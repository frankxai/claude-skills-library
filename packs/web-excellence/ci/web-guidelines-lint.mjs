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

import { execSync } from 'node:child_process';
import { readFileSync, statSync } from 'node:fs';

const UI_EXT = /\.(tsx|jsx|vue|svelte|astro|css|scss|sass)$/;
const NOT_UI = /(^|\/)(api|__tests__)\/|\.(test|spec|d)\.(ts|tsx|js|jsx)$|(^|\/)route\.(ts|js)$/;

const args = process.argv.slice(2);
const useChanged = args.includes('--changed');
const allLines = args.includes('--all-lines');
const baseIdx = args.indexOf('--base');
const base = baseIdx !== -1 ? args[baseIdx + 1] : 'origin/main';

function requireBase() {
  try {
    execSync(`git rev-parse --verify ${base}`, { stdio: 'ignore' });
  } catch {
    console.error(`web-guidelines-lint: base ref '${base}' not found — fetch it first, or pass files explicitly.`);
    process.exit(2);
  }
}

function changedFiles() {
  requireBase();
  const out = execSync(`git diff --name-only --diff-filter=d ${base}...HEAD`, { encoding: 'utf8' });
  return out.split('\n').filter(Boolean);
}

// Map of file → Set of line numbers this diff ADDS. Parsed from -U0 hunks.
function addedLines() {
  requireBase();
  const diff = execSync(`git diff -U0 --diff-filter=d ${base}...HEAD`, {
    encoding: 'utf8',
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

// [id, severity, regex, message, fileGuard?]
// fileGuard: if it matches the whole file, the rule is suppressed for that file.
const RULES = [
  ['transition-all', 'error', /transition:\s*all\b|(?:^|["'\s:])transition-all(?:[\s"'/]|$)/,
    'transition: all — list the properties explicitly (it animates layout props too)'],

  ['outline-none', 'error', /outline:\s*none|(?:^|["'\s:])outline-none(?:[\s"'/]|$)/,
    'outline removed with no :focus-visible replacement anywhere in this file',
    /focus-visible|focusVisible/],

  ['div-onclick', 'error', /<(?:div|span)\b[^>]*\sonClick=/,
    '<div>/<span> with onClick — use <button> for actions, <a>/<Link> for navigation'],

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
];

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

  for (const [id, severity, re, message, guard] of RULES) {
    if (guard && guard.test(text)) continue;
    lines.forEach((line, i) => {
      if (added && !added.has(i + 1)) return;
      // skip obvious comment lines to cut noise
      const t = line.trim();
      if (t.startsWith('//') || t.startsWith('*') || t.startsWith('/*')) return;
      if (!re.test(line)) return;
      const entry = { line: i + 1, severity, id, message };
      if (!byFile.has(file)) byFile.set(file, []);
      byFile.get(file).push(entry);
      if (severity === 'error') errors++; else warns++;
    });
  }
}

if (!files.length) {
  console.log('web-guidelines-lint: no UI files in scope — nothing to check.');
  process.exit(0);
}

const mode = scope ? 'added lines only (ratchet)' : 'every line';
console.log(`web-guidelines-lint: ${files.length} UI file(s), ${mode}\n`);

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

if (!byFile.size) console.log('✓ pass — no mechanical guideline violations.\n');

console.log(`${errors} error(s), ${warns} warning(s).`);
if (errors) {
  console.log('\nThis is the mechanical subset only. Run the `web-design-guidelines` skill');
  console.log('for the full audit, and `visual-proof` before calling a UI change done.');
}
process.exit(errors ? 1 : 0);
