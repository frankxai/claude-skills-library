#!/usr/bin/env node
// Living-materials gate: the rules a page must meet before glass, GPU or GSAP ship.
// Model-free. Reads a repo on disk and exits 1 on any error-level finding.
//
//   node materials-gate.mjs <repoDir> [--json]
//
// Owned here: design-md, glass-gated, one-gpu-surface, motion-scored, poster-first, raw-colour.
// Viewport, dvh, hover gating and zoom stay with the web-excellence linter; this gate does not repeat them.

import { readdirSync, readFileSync, statSync, lstatSync, existsSync } from 'node:fs';
import { join, relative, dirname, resolve, extname, basename } from 'node:path';

export const SECTION_ORDER = [
  'Overview',
  'Colors',
  'Typography',
  'Layout',
  'Elevation & Depth',
  'Shapes',
  'Components',
  "Do's and Don'ts",
];
const SECTION_ALIASES = {
  'Brand & Style': 'Overview',
  'Layout & Spacing': 'Layout',
  Elevation: 'Elevation & Depth',
  'Dos and Donts': "Do's and Don'ts",
  "Do's & Don'ts": "Do's and Don'ts",
};

const SKIP_DIRS = new Set(['node_modules', '.next', 'dist', 'build', '.git', '.turbo', 'coverage', '.worktrees']);
// Studio evidence holds prototypes and scores: scores count, prototypes are never judged as product code.
const EVIDENCE_RE = /[\\/]\.studio[\\/]/;
const SOURCE_EXT = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.css', '.scss', '.html', '.astro', '.svelte', '.vue']);
const TOKEN_FILES = /(tailwind\.config|globals?\.css|tokens|theme|design\.sidecar|DESIGN\.md|design\.md|palette)/i;

// CSS blur is the ladder's baseline tier and needs no gate. Refraction (SVG displacement, a
// liquid-glass module, WebGL glass) moves pixels and must be gated on device and preference.
const GLASS_CSS_RE = /backdrop-filter/i;
const GLASS_RE = /feDisplacementMap|liquid-?glass|LiquidGlass/;
const GLASS_GATE_RE = /reduced-transparency|glass-gate|gpuPlan\(/;
const LIST_CAP = 8;

function listed(items) {
  return items.length > LIST_CAP ? `${items.slice(0, LIST_CAP).join(', ')} (+${items.length - LIST_CAP} more)` : items.join(', ');
}
const GPU_LIB_RE = /from\s+['"](three|@react-three\/fiber|@react-three\/drei|ogl|@paper-design\/shaders(?:-react)?|liquidgl)['"]/;
const MOTION_LIB_RE = /from\s+['"](gsap|gsap\/[^'"]+|@gsap\/react|lenis|motion|framer-motion)['"]/;
const POSTER_RE = /poster|IntersectionObserver|visibilitychange/;
const HEX_RE = /#(?:[0-9a-f]{3}){1,2}\b/gi;
const RAW_COLOUR_WARN_AT = 20;

export function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    // Dot folders hold other worktrees, browser profiles and tool caches; only studio evidence counts.
    if (name.startsWith('.') && name !== '.studio') continue;
    const full = join(dir, name);
    let st;
    try { st = lstatSync(full); } catch { continue; }
    // Junctions and symlinks can point at another repo or loop; a gate judges one tree.
    if (st.isSymbolicLink()) continue;
    if (st.isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

// Each check re-visits the same files; read each one once per run.
const readCache = new Map();
function read(file) {
  if (readCache.has(file)) return readCache.get(file);
  let text = '';
  try { text = readFileSync(file, 'utf8'); } catch { text = ''; }
  readCache.set(file, text);
  return text;
}

function isSource(file) {
  return SOURCE_EXT.has(extname(file));
}

function findDesignMd(root) {
  for (const name of ['DESIGN.md', 'design.md']) {
    const p = join(root, name);
    if (existsSync(p)) return p;
  }
  return null;
}

export function checkDesignMd(root) {
  const file = findDesignMd(root);
  if (!file) {
    return { id: 'design-md', level: 'error', ok: false, detail: 'no DESIGN.md or design.md at the repo root (spec: github.com/google-labs-code/design.md)' };
  }
  const text = read(file);
  const headings = [...text.matchAll(/^##\s+(.+?)\s*$/gm)].map((m) => m[1].trim());
  const canonical = headings.map((h) => SECTION_ALIASES[h] ?? h).filter((h) => SECTION_ORDER.includes(h));
  let last = -1;
  const outOfOrder = [];
  for (const h of canonical) {
    const i = SECTION_ORDER.indexOf(h);
    if (i < last) outOfOrder.push(h);
    last = Math.max(last, i);
  }
  const hasTokens = /^---\s*$/m.test(text.slice(0, 4)) || /```ya?ml/.test(text);
  if (outOfOrder.length) {
    return { id: 'design-md', level: 'error', ok: false, detail: `sections out of spec order: ${outOfOrder.join(', ')} (${relative(root, file)})` };
  }
  if (!hasTokens) {
    return { id: 'design-md', level: 'warn', ok: false, detail: `${relative(root, file)} has prose but no YAML tokens (front matter or a yaml block); run: npx @google/design.md lint ${basename(file)}` };
  }
  return { id: 'design-md', level: 'info', ok: true, detail: `${relative(root, file)}: ${canonical.length} spec sections, tokens present` };
}

export function checkGlass(root, files) {
  const offenders = [];
  let cssBlur = 0;
  let refracting = 0;
  for (const f of files) {
    if (!SOURCE_EXT.has(extname(f))) continue;
    const text = read(f);
    if (GLASS_CSS_RE.test(text)) cssBlur += 1;
    if (!GLASS_RE.test(text)) continue;
    refracting += 1;
    if (GLASS_GATE_RE.test(text)) continue;
    const siblingGate = readdirSync(dirname(f)).some((n) => /glass-gate|materials-gate/.test(n));
    if (!siblingGate) offenders.push(relative(root, f));
  }
  return offenders.length
    ? { id: 'glass-gated', level: 'error', ok: false, detail: `refracting glass without a reduced-transparency or glass-gate check: ${listed(offenders)}` }
    : { id: 'glass-gated', level: 'info', ok: true, detail: `${cssBlur} CSS blur file(s) (baseline tier, no gate needed), ${refracting} refracting glass file(s), all gated` };
}

function localImports(file, text) {
  const out = [];
  for (const m of text.matchAll(/from\s+['"](\.{1,2}\/[^'"]+)['"]/g)) {
    const base = resolve(dirname(file), m[1]);
    for (const ext of ['', '.tsx', '.ts', '.jsx', '.js', '.mjs', '/index.tsx', '/index.ts']) {
      const candidate = base + ext;
      if (existsSync(candidate) && statSync(candidate).isFile()) { out.push(candidate); break; }
    }
  }
  return out;
}

export function checkGpuSurfaces(root, files) {
  const gpuFiles = new Set(files.filter((f) => SOURCE_EXT.has(extname(f)) && GPU_LIB_RE.test(read(f))));
  const offenders = [];
  const unposted = [];
  for (const f of gpuFiles) {
    if (!POSTER_RE.test(read(f))) unposted.push(relative(root, f));
  }
  const pages = files.filter((f) => /(^|[\\/])page\.(tsx|jsx|ts|js)$/.test(f));
  for (const page of pages) {
    const text = read(page);
    let count = gpuFiles.has(page) ? 1 : 0;
    for (const dep of localImports(page, text)) if (gpuFiles.has(dep)) count += 1;
    if (count > 1) offenders.push(`${relative(root, page)} (${count})`);
  }
  const results = [];
  results.push(offenders.length
    ? { id: 'one-gpu-surface', level: 'error', ok: false, detail: `more than one GPU surface on a page: ${listed(offenders)}` }
    : { id: 'one-gpu-surface', level: 'info', ok: true, detail: `${gpuFiles.size} GPU file(s), no page carries two` });
  results.push(unposted.length
    ? { id: 'poster-first', level: 'warn', ok: false, detail: `GPU files with no poster or visibility handling: ${listed(unposted)}` }
    : { id: 'poster-first', level: 'info', ok: true, detail: 'GPU files paint a poster and watch visibility, or there are none' });
  return results;
}

export function checkMotionScore(root, product, allFiles = product) {
  const motionFiles = product.filter((f) => SOURCE_EXT.has(extname(f)) && MOTION_LIB_RE.test(read(f)));
  if (!motionFiles.length) return { id: 'motion-scored', level: 'info', ok: true, detail: 'no motion library in use' };
  const score = allFiles.find((f) => /motion-score\.md$/i.test(f));
  return score
    ? { id: 'motion-scored', level: 'info', ok: true, detail: `${motionFiles.length} motion file(s), score at ${relative(root, score)}` }
    : { id: 'motion-scored', level: 'error', ok: false, detail: `${motionFiles.length} file(s) import a motion library but no motion-score.md exists (cinematic-motion skill, step 1)` };
}

export function checkRawColour(root, files) {
  const seen = new Map();
  for (const f of files) {
    if (!['.tsx', '.jsx'].includes(extname(f)) || TOKEN_FILES.test(f)) continue;
    for (const m of read(f).matchAll(HEX_RE)) {
      const hex = m[0].toLowerCase();
      if (!seen.has(hex)) seen.set(hex, relative(root, f));
    }
  }
  return seen.size > RAW_COLOUR_WARN_AT
    ? { id: 'raw-colour', level: 'warn', ok: false, detail: `${seen.size} distinct hex colours in components outside token files; move them into DESIGN.md tokens` }
    : { id: 'raw-colour', level: 'info', ok: true, detail: `${seen.size} distinct raw hex colours in components (limit ${RAW_COLOUR_WARN_AT})` };
}

export function runGate(root) {
  readCache.clear();
  const abs = resolve(root);
  const files = walk(abs).filter((f) => isSource(f) || /\.md$/i.test(f));
  const product = files.filter((f) => !EVIDENCE_RE.test(f));
  const checks = [
    checkDesignMd(abs),
    checkGlass(abs, product),
    ...checkGpuSurfaces(abs, product),
    checkMotionScore(abs, product, files),
    checkRawColour(abs, product),
  ];
  const errors = checks.filter((c) => c.level === 'error' && !c.ok).length;
  const warns = checks.filter((c) => c.level === 'warn' && !c.ok).length;
  return { root: abs, checks, errors, warns, pass: errors === 0 };
}

export function renderMarkdown(result) {
  const lines = [`# Materials gate: ${result.pass ? 'PASS' : 'FAIL'}`, '', `Root: ${result.root}`, ''];
  lines.push('| Check | Level | Result | Detail |', '|---|---|---|---|');
  for (const c of result.checks) {
    lines.push(`| ${c.id} | ${c.level} | ${c.ok ? 'ok' : 'FAIL'} | ${c.detail.replace(/\|/g, '\\|')} |`);
  }
  lines.push('', `${result.errors} error(s), ${result.warns} warning(s).`);
  return lines.join('\n');
}

const invokedDirectly = process.argv[1] && resolve(process.argv[1]) === resolve(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
if (invokedDirectly) {
  const args = process.argv.slice(2);
  const json = args.includes('--json');
  const root = args.find((a) => !a.startsWith('--')) ?? process.cwd();
  if (!existsSync(root) || !statSync(root).isDirectory()) {
    process.stderr.write(`materials-gate: ${root} is not a directory\n`);
    process.exit(2);
  }
  const result = runGate(root);
  process.stdout.write(json ? JSON.stringify(result, null, 2) : renderMarkdown(result));
  process.stdout.write('\n');
  process.exit(result.pass ? 0 : 1);
}
