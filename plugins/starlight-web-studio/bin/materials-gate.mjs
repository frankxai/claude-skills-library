#!/usr/bin/env node
// Living-materials gate: the rules a page must meet before glass, GPU or GSAP ship.
// Model-free, static. Reads a repo on disk and exits 1 on any error-level finding.
//
//   node materials-gate.mjs <repoDir> [--json]
//
// Owned here: design-md, glass-gated, gpu-lifecycle, one-gpu-surface, poster-first,
// motion-scored, raw-colour. A static scan proves absence of a pattern, never runtime
// behaviour: the one-surface budget and the gate's effect on renderer creation are enforced
// in the materials wrapper, and this file says so in its own output.
//
// Not covered, by design: raw WebGL written without a library, CDN script tags, and
// refraction behind a build-time plugin. Declare those in DESIGN.md Do's and Don'ts.

import { readdirSync, readFileSync, statSync, lstatSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, relative, dirname, resolve, extname, basename, sep, isAbsolute } from 'node:path';

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

const SKIP_DIRS = new Set(['node_modules', '.next', 'dist', 'build', '.git', '.turbo', 'coverage', '.worktrees', 'out']);
// Studio evidence holds prototypes and scores: scores count, prototypes are never judged as product code.
const EVIDENCE_RE = /[\\/]\.studio[\\/]/;
// Tests, fixtures and stories are not shipped; a string in a test must not fail the product.
const NON_SHIPPING_RE = /[\\/](tests?|__tests__|fixtures?|__fixtures__|__mocks__|stories|e2e)[\\/]|\.(test|spec|stories)\.[cm]?[jt]sx?$/;
const SOURCE_EXT = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.css', '.scss', '.html', '.astro', '.svelte', '.vue']);
const FILTER_EXT = new Set(['.svg']);
const TOKEN_FILE_RE = /(^|[\\/])(tailwind\.config\.[cm]?[jt]s|globals?\.css|tokens?\.[cm]?[jt]s|theme\.[cm]?[jt]s|design\.sidecar\.json|DESIGN\.md|design\.md)$|[\\/]tokens?[\\/]/i;

// Import forms a bundler honours: static, dynamic and CommonJS. Type-only imports ship nothing.
function importRe(packages) {
  return new RegExp(`(?:from\\s+|import\\(\\s*|require\\(\\s*)['"](?:${packages})(?:\\/[^'"]*)?['"]`);
}
const GPU_PACKAGES = 'three|@react-three\\/fiber|@react-three\\/drei|ogl|@paper-design\\/shaders(?:-react)?|liquidgl';
const MOTION_PACKAGES = 'gsap|@gsap\\/react|lenis|motion|framer-motion';
const GPU_IMPORT_RE = importRe(GPU_PACKAGES);
const MOTION_IMPORT_RE = importRe(MOTION_PACKAGES);
const TYPE_IMPORT_RE = /^\s*import\s+type\s.*$/gm;

// CSS blur is the ladder's baseline tier and needs no gate. Refraction (SVG displacement, a
// liquid-glass module, liquidGL) moves pixels and must be gated on device and preference.
const GLASS_CSS_RE = /backdrop-filter/i;
const GLASS_RE = /feDisplacementMap|liquid-?glass|liquidgl/i;
// A gate is a call or an import, never a word in a comment.
const GLASS_GATE_RE = /matchMedia\([^)]*reduced-transparency|gpuPlan\(|useGlassPlan\(|(?:from\s+|import\(\s*|require\(\s*)['"][^'"]*(?:glass-gate|@starlight\/materials)[^'"]*['"]/;
const LIFECYCLE_RE = /IntersectionObserver|visibilitychange|document\.hidden/;
const POSTER_RE = /poster|<noscript|fallback/i;
const COLOUR_RE = /#(?:[0-9a-f]{3}){1,2}\b|\b(?:rgb|hsl|oklch|oklab)a?\([^)]*\)/gi;
const RAW_COLOUR_WARN_AT = 20;
const LIST_CAP = 8;
const IMPORT_DEPTH = 6;

function listed(items) {
  return items.length > LIST_CAP ? `${items.slice(0, LIST_CAP).join(', ')} (+${items.length - LIST_CAP} more)` : items.join(', ');
}

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

// Pattern checks run on code, not on comments: a `// reduced-transparency` note gates nothing.
const codeCache = new Map();
export function stripComments(text) {
  return text
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:\\])\/\/[^\n]*/g, '$1')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(TYPE_IMPORT_RE, '');
}
function code(file) {
  if (!codeCache.has(file)) codeCache.set(file, stripComments(read(file)));
  return codeCache.get(file);
}

const isSource = (f) => SOURCE_EXT.has(extname(f));

function findDesignMd(root) {
  for (const name of ['DESIGN.md', 'design.md']) {
    const p = join(root, name);
    if (existsSync(p)) return p;
  }
  return null;
}

// Tokens are YAML with at least one `key: value` line, in front matter or a yaml block.
export function hasYamlTokens(text) {
  const front = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  const blocks = [...text.matchAll(/```ya?ml\r?\n([\s\S]*?)```/g)].map((m) => m[1]);
  const bodies = [front ? front[1] : '', ...blocks];
  return bodies.some((b) => /^\s*[\w-]+\s*:\s*\S/m.test(b));
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
  const duplicates = [];
  const seen = new Set();
  for (const h of canonical) {
    const i = SECTION_ORDER.indexOf(h);
    if (i < last) outOfOrder.push(h);
    if (seen.has(h)) duplicates.push(h);
    seen.add(h);
    last = Math.max(last, i);
  }
  const rel = relative(root, file);
  if (outOfOrder.length || duplicates.length) {
    const parts = [];
    if (outOfOrder.length) parts.push(`sections out of spec order: ${outOfOrder.join(', ')}`);
    if (duplicates.length) parts.push(`duplicate sections: ${duplicates.join(', ')}`);
    return { id: 'design-md', level: 'error', ok: false, detail: `${parts.join('; ')} (${rel})` };
  }
  if (!hasYamlTokens(text)) {
    return { id: 'design-md', level: 'warn', ok: false, detail: `${rel} has prose but no YAML tokens (a key: value line in front matter or a yaml block); run: npx @google/design.md lint ${basename(file)}` };
  }
  return { id: 'design-md', level: 'info', ok: true, detail: `${rel}: ${canonical.length} spec sections, YAML tokens present; structure only, run npx @google/design.md lint for the schema` };
}

export function checkGlass(root, files) {
  const offenders = [];
  let cssBlur = 0;
  let refracting = 0;
  for (const f of files) {
    if (!isSource(f) && !FILTER_EXT.has(extname(f))) continue;
    const text = code(f);
    if (GLASS_CSS_RE.test(text)) cssBlur += 1;
    if (!GLASS_RE.test(text)) continue;
    refracting += 1;
    if (!GLASS_GATE_RE.test(text)) offenders.push(relative(root, f));
  }
  return offenders.length
    ? { id: 'glass-gated', level: 'error', ok: false, detail: `refracting glass with no gate call or gate import in code: ${listed(offenders)}` }
    : { id: 'glass-gated', level: 'info', ok: true, detail: `${cssBlur} CSS blur file(s) (baseline tier, no gate needed), ${refracting} refracting glass file(s), each imports or calls a gate` };
}

function readAliases(root) {
  const aliases = [];
  for (const name of ['tsconfig.json', 'jsconfig.json']) {
    const p = join(root, name);
    if (!existsSync(p)) continue;
    const text = read(p).replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/,\s*([}\]])/g, '$1');
    let paths;
    try { paths = JSON.parse(text).compilerOptions?.paths ?? {}; } catch { paths = {}; }
    for (const [key, targets] of Object.entries(paths)) {
      if (!key.endsWith('/*') || !Array.isArray(targets)) continue;
      const dirs = targets
        .map((t) => resolve(root, String(t).replace(/\/?\*$/, '')))
        .filter((d) => d === root || insideRoot(root, d));
      if (dirs.length) aliases.push({ prefix: key.slice(0, -1), dirs });
    }
  }
  if (!aliases.some((a) => a.prefix === '@/')) aliases.push({ prefix: '@/', dirs: [join(root, 'src'), root] });
  return aliases;
}

// The resolver follows walk()'s one-tree rule: a tsconfig alias or a ../ chain that leaves the
// scanned root is never touched, so a hostile config cannot make the gate open a UNC share.
export function insideRoot(root, candidate) {
  if (/^(\\\\|\/\/)/.test(candidate)) return false;
  const rel = relative(root, candidate);
  return rel !== '' && !rel.startsWith('..') && !isAbsolute(rel);
}

function resolveModule(root, base) {
  if (!insideRoot(root, base)) return null;
  for (const ext of ['', '.tsx', '.ts', '.jsx', '.js', '.mjs', '/index.tsx', '/index.ts', '/index.js']) {
    const candidate = base + ext;
    let st;
    try { st = lstatSync(candidate); } catch { continue; }
    if (st.isFile()) return candidate;
  }
  return null;
}

// Local imports: relative, plus tsconfig path aliases. Unresolved ones are reported, not ignored.
function localImports(root, file, text, aliases, unresolved) {
  const out = [];
  for (const m of text.matchAll(/(?:from\s+|import\(\s*|require\(\s*)['"]([^'"]+)['"]/g)) {
    const spec = m[1];
    let candidates = [];
    if (spec.startsWith('.')) candidates = [resolve(dirname(file), spec)];
    else {
      const alias = aliases.find((a) => spec.startsWith(a.prefix));
      if (!alias) {
        // `~/x` and `#x` are project-local by convention; a bare name is a package and is not ours to resolve.
        if (/^[~#]/.test(spec)) unresolved.add(spec);
        continue;
      }
      candidates = alias.dirs.map((d) => join(d, spec.slice(alias.prefix.length)));
    }
    const hit = candidates.map((c) => resolveModule(root, c)).find(Boolean);
    if (hit) out.push(hit);
    else unresolved.add(spec);
  }
  return out;
}

// Transitive closure of local imports, depth-bounded, so a surface behind a barrel still counts.
function reachable(root, entry, aliases, unresolved) {
  const seen = new Set([entry]);
  let frontier = [entry];
  for (let depth = 0; depth < IMPORT_DEPTH && frontier.length; depth += 1) {
    const next = [];
    for (const f of frontier) {
      for (const dep of localImports(root, f, code(f), aliases, unresolved)) {
        if (!seen.has(dep)) { seen.add(dep); next.push(dep); }
      }
    }
    frontier = next;
  }
  return seen;
}

export function checkGpuSurfaces(root, files) {
  const gpuFiles = new Set(files.filter((f) => isSource(f) && GPU_IMPORT_RE.test(code(f))));
  const aliases = readAliases(root);
  const unresolved = new Set();
  const noLifecycle = [];
  const noPoster = [];
  for (const f of gpuFiles) {
    const text = code(f);
    if (!LIFECYCLE_RE.test(text)) noLifecycle.push(relative(root, f));
    if (!POSTER_RE.test(text)) noPoster.push(relative(root, f));
  }
  // A route's surfaces are its page plus every layout above it, and everything they reach.
  const pages = files.filter((f) => /(^|[\\/])page\.(tsx|jsx|ts|js)$/.test(f));
  const layouts = files.filter((f) => /(^|[\\/])layout\.(tsx|jsx|ts|js)$/.test(f));
  const offenders = [];
  for (const page of pages) {
    const entries = [page, ...layouts.filter((l) => page.startsWith(dirname(l) + sep))];
    const modules = new Set();
    for (const e of entries) for (const m of reachable(root, e, aliases, unresolved)) modules.add(m);
    const count = [...modules].filter((m) => gpuFiles.has(m)).length;
    if (count > 1) offenders.push(`${relative(root, page)} (${count} GPU modules via page and layouts)`);
  }
  const coverage = unresolved.size ? `; ${unresolved.size} import specifier(s) unresolved, coverage incomplete: ${listed([...unresolved])}` : '';
  const results = [];
  results.push(offenders.length
    ? { id: 'one-gpu-surface', level: 'error', ok: false, detail: `a route reaches more than one GPU module (static count; the runtime budget lives in the materials wrapper): ${listed(offenders)}${coverage}` }
    : { id: 'one-gpu-surface', level: 'info', ok: true, detail: `${gpuFiles.size} GPU module(s); no route reaches two (static count over ${pages.length} page(s) and ${layouts.length} layout(s)${coverage})` });
  results.push(noLifecycle.length
    ? { id: 'gpu-lifecycle', level: 'error', ok: false, detail: `GPU modules that never pause off-screen or on a hidden tab (no IntersectionObserver or visibilitychange in code): ${listed(noLifecycle)}` }
    : { id: 'gpu-lifecycle', level: 'info', ok: true, detail: 'every GPU module watches visibility, or there are none' });
  results.push(noPoster.length
    ? { id: 'poster-first', level: 'warn', ok: false, detail: `GPU modules with no poster, fallback or noscript reference in code; the no-script still must be checked by eye: ${listed(noPoster)}` }
    : { id: 'poster-first', level: 'info', ok: true, detail: 'every GPU module names a poster or fallback; whether it paints first is checked by eye, not here' });
  return results;
}

// A score is a table with a beat per row and a reduced-motion column, not a file name.
export function validMotionScore(text) {
  const headerLine = text.split(/\r?\n/).find((l) => /^\s*\|/.test(l) && /reduced/i.test(l));
  if (!headerLine) return false;
  const rows = text.split(/\r?\n/).filter((l) => /^\s*\|/.test(l) && !/^\s*\|\s*-/.test(l));
  return rows.length >= 2;
}

export function checkMotionScore(root, product, allFiles = product) {
  const motionFiles = product.filter((f) => isSource(f) && MOTION_IMPORT_RE.test(code(f)));
  if (!motionFiles.length) return { id: 'motion-scored', level: 'info', ok: true, detail: 'no motion library in use' };
  const scores = allFiles.filter((f) => basename(f).toLowerCase() === 'motion-score.md');
  const valid = scores.filter((f) => validMotionScore(read(f)));
  if (valid.length) {
    return { id: 'motion-scored', level: 'info', ok: true, detail: `${motionFiles.length} motion file(s), score at ${relative(root, valid[0])}; which beats a route ships is checked by the critic, not here` };
  }
  const why = scores.length ? `${scores.length} motion-score.md found but none has a header with a reduced-motion column and at least one beat row` : 'no motion-score.md exists';
  return { id: 'motion-scored', level: 'error', ok: false, detail: `${motionFiles.length} file(s) import a motion library; ${why} (cinematic-motion skill, step 1)` };
}

export function checkRawColour(root, files) {
  const seen = new Map();
  for (const f of files) {
    const rel = relative(root, f);
    if (!['.tsx', '.jsx'].includes(extname(f)) || TOKEN_FILE_RE.test(rel)) continue;
    for (const m of code(f).matchAll(COLOUR_RE)) {
      const key = m[0].toLowerCase();
      if (!seen.has(key)) seen.set(key, rel);
    }
  }
  return seen.size > RAW_COLOUR_WARN_AT
    ? { id: 'raw-colour', level: 'warn', ok: false, detail: `${seen.size} distinct colour literals (hex, rgb, hsl, oklch) in components outside token files; move them into DESIGN.md tokens` }
    : { id: 'raw-colour', level: 'info', ok: true, detail: `${seen.size} distinct colour literals in components (advisory limit ${RAW_COLOUR_WARN_AT})` };
}

export function runGate(root) {
  readCache.clear();
  codeCache.clear();
  const abs = resolve(root);
  const files = walk(abs).filter((f) => isSource(f) || FILTER_EXT.has(extname(f)) || /\.md$/i.test(f));
  const product = files.filter((f) => !EVIDENCE_RE.test(f) && !NON_SHIPPING_RE.test(relative(abs, f)));
  const checks = [
    checkDesignMd(abs),
    checkGlass(abs, product),
    ...checkGpuSurfaces(abs, product),
    checkMotionScore(abs, product, files),
    checkRawColour(abs, product),
  ];
  const errors = checks.filter((c) => c.level === 'error' && !c.ok).length;
  const warns = checks.filter((c) => c.level === 'warn' && !c.ok).length;
  return { root: abs, scanned: product.length, checks, errors, warns, pass: errors === 0 };
}

export function renderMarkdown(result) {
  const lines = [`# Materials gate: ${result.pass ? 'PASS' : 'FAIL'}`, '', `Root: ${result.root} (${result.scanned} shipping files scanned; tests, fixtures and .studio prototypes excluded)`, ''];
  lines.push('| Check | Level | Result | Detail |', '|---|---|---|---|');
  for (const c of result.checks) {
    lines.push(`| ${c.id} | ${c.level} | ${c.ok ? 'ok' : 'FAIL'} | ${c.detail.replace(/\|/g, '\\|')} |`);
  }
  lines.push('', `${result.errors} error(s), ${result.warns} warning(s). Static scan: it proves a pattern is absent, never that a page behaves.`);
  return lines.join('\n');
}

export function main(argv) {
  const json = argv.includes('--json');
  const root = argv.find((a) => !a.startsWith('--')) ?? process.cwd();
  if (!existsSync(root) || !statSync(root).isDirectory()) {
    process.stderr.write(`materials-gate: ${root} is not a directory\n`);
    return 2;
  }
  const result = runGate(root);
  process.stdout.write(json ? JSON.stringify(result, null, 2) : renderMarkdown(result));
  process.stdout.write('\n');
  return result.pass ? 0 : 1;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exit(main(process.argv.slice(2)));
}
