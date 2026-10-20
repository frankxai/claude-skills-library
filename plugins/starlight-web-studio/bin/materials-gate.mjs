#!/usr/bin/env node
// Living-materials gate: the rules a page must meet before glass, GPU or GSAP ship.
// Model-free, static. Reads a repo on disk and exits 1 on any error-level finding.
//
//   node materials-gate.mjs <repoDir> [--json]
//
// Owned here: design-md, glass-gated, one-gpu-surface, gpu-lifecycle, poster-first,
// motion-scored, raw-colour, coverage. A static scan proves a pattern is absent from shipped
// source; it never proves a page behaves. PASS means every rule held AND every local import
// was resolved: incomplete coverage is a failure, never a pass.
//
// Not covered, by design: raw WebGL written without a library, CDN script tags, refraction
// behind a build-time plugin, and whether a gate call actually prevents renderer creation.
// Those belong to the materials wrapper and the eye pass.

import { readdirSync, readFileSync, statSync, lstatSync, existsSync, realpathSync } from 'node:fs';
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
const EVIDENCE_RE = /[\\/]\.studio[\\/]/;
// Tests, fixtures and stories are not shipped; the pattern anchors at the root or a separator.
const NON_SHIPPING_RE = /(^|[\\/])(tests?|__tests__|fixtures?|__fixtures__|__mocks__|stories|e2e)[\\/]|\.(test|spec|stories)\.[cm]?[jt]sx?$/;
const JS_EXT = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.astro', '.svelte', '.vue']);
const STYLE_EXT = new Set(['.css', '.scss', '.html']);
const FILTER_EXT = new Set(['.svg']);
const TOKEN_FILE_RE = /(^|[\\/])(tailwind\.config\.[cm]?[jt]s|globals?\.css|tokens?\.[cm]?[jt]s|theme\.[cm]?[jt]s|design\.sidecar\.json|DESIGN\.md|design\.md)$|(^|[\\/])tokens?[\\/]/i;

const GPU_PACKAGES = /^(three|@react-three\/fiber|@react-three\/drei|ogl|@paper-design\/shaders(-react)?|liquidgl)(\/|$)/;
const MOTION_PACKAGES = /^(gsap|@gsap\/react|lenis|motion|framer-motion)(\/|$)/;
// A renderer module creates a drawing surface. A helper that imports three for maths is not one.
const RENDERER_RE = /new\s+(?:THREE\.)?(?:WebGLRenderer|WebGPURenderer|Renderer)\b|<Canvas\b|<(?:MeshGradient|GrainGradient|Dithering|Warp|DotOrbit|Waves|ShaderMount)\b|liquidGL\s*\(/;

// CSS blur is the ladder's baseline tier and needs no gate. Refraction moves pixels and must
// be gated on device and preference: an SVG displacement filter, a LiquidGlass component or
// the liquidGL library.
const GLASS_CSS_RE = /backdrop-filter/i;
const GLASS_JS_RE = /<feDisplacementMap\b|<LiquidGlass\w*\b|liquidGL\s*\(/;
const GLASS_FILE_RE = /<feDisplacementMap\b/;
const GLASS_GATE_CALL_RE = /\bgpuPlan\s*\(|\buseGlassPlan\s*\(/;
const GLASS_GATE_MEDIA_RE = /prefers-reduced-transparency/;
const GLASS_GATE_MODULE_RE = /(^|\/)glass-gate(\.[cm]?[jt]s)?$|^@starlight\/materials(\/|$)/;
const LIFECYCLE_RE = /\bIntersectionObserver\b|document\.hidden|\bonvisibilitychange\b/;
const POSTER_RE = /\bposter\b|<noscript|\bfallback\b/i;
const COLOUR_RE = /#(?:[0-9a-f]{3}){1,2}\b|\b(?:rgb|hsl|oklch|oklab)a?\([^)]*\)/gi;
const RAW_COLOUR_WARN_AT = 20;
const LIST_CAP = 8;
const IMPORT_DEPTH = 12;

function listed(items) {
  return items.length > LIST_CAP ? `${items.slice(0, LIST_CAP).join(', ')} (+${items.length - LIST_CAP} more)` : items.join(', ');
}

export function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    if (name.startsWith('.') && name !== '.studio') continue;
    const full = join(dir, name);
    let st;
    try { st = lstatSync(full); } catch { continue; }
    if (st.isSymbolicLink()) continue;
    if (st.isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

const readCache = new Map();
function read(file) {
  if (readCache.has(file)) return readCache.get(file);
  let text = '';
  try { text = readFileSync(file, 'utf8'); } catch { text = ''; }
  readCache.set(file, text);
  return text;
}

// --- lexer ---------------------------------------------------------------------------------
// Walks the source once. Comments become a single space (so tokens never merge), string and
// template literals become empty quotes (so a string can never impersonate a call), and every
// string literal is kept beside its offset so import specifiers can still be read.
export function lex(text) {
  let code = '';
  const strings = [];
  const n = text.length;
  let i = 0;
  while (i < n) {
    const c = text[i];
    const d = text[i + 1];
    if (c === '/' && d === '/') {
      while (i < n && text[i] !== '\n') i += 1;
      code += ' ';
      continue;
    }
    if (c === '/' && d === '*') {
      const end = text.indexOf('*/', i + 2);
      i = end === -1 ? n : end + 2;
      code += ' ';
      continue;
    }
    if (c === '<' && text.startsWith('<!--', i)) {
      const end = text.indexOf('-->', i + 4);
      i = end === -1 ? n : end + 3;
      code += ' ';
      continue;
    }
    if (c === '"' || c === "'" || c === '`') {
      const quote = c;
      let j = i + 1;
      let value = '';
      let depth = 0;
      while (j < n) {
        const ch = text[j];
        if (ch === '\\') { value += text[j + 1] ?? ''; j += 2; continue; }
        if (quote === '`' && ch === '$' && text[j + 1] === '{') { depth += 1; j += 2; continue; }
        if (quote === '`' && depth > 0 && ch === '}') { depth -= 1; j += 1; continue; }
        if (ch === quote && depth === 0) break;
        if (quote !== '`' && ch === '\n') break;
        if (depth === 0) value += ch;
        j += 1;
      }
      strings.push({ at: code.length, value, template: quote === '`' });
      code += quote + quote;
      i = j + 1;
      continue;
    }
    code += c;
    i += 1;
  }
  return { code, strings };
}

const lexCache = new Map();
function lexed(file) {
  if (!lexCache.has(file)) {
    const ext = extname(file);
    lexCache.set(file, JS_EXT.has(ext) ? lex(read(file)) : { code: stripStyleComments(read(file)), strings: [] });
  }
  return lexCache.get(file);
}
function stripStyleComments(text) {
  return text.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/<!--[\s\S]*?-->/g, ' ');
}
const code = (file) => lexed(file).code;

// Import specifiers: `from "x"`, `import "x"`, `import("x")`, `require("x")`, with the
// specifier read back from the lexer. Type-only imports (`import type …` and `import { type A,
// type B }`) are dropped because they ship nothing.
export function importsOf(file) {
  const { code: src, strings } = lexed(file);
  const out = [];
  for (const s of strings) {
    if (s.template) continue;
    const before = src.slice(Math.max(0, s.at - 400), s.at);
    let kind = null;
    if (/\bfrom\s*$/.test(before)) kind = 'from';
    else if (/\bimport\s*$/.test(before)) kind = 'side-effect';
    else if (/\b(?:import|require)\s*\(\s*$/.test(before)) kind = 'call';
    if (!kind) continue;
    if (kind === 'from') {
      const stmt = before.slice(before.lastIndexOf('import'));
      if (/^import\s+type\b/.test(stmt)) continue;
      const names = stmt.match(/\{([^}]*)\}/);
      if (names) {
        const specs = names[1].split(',').map((x) => x.trim()).filter(Boolean);
        if (specs.length && specs.every((x) => /^type\s/.test(x))) continue;
      }
    }
    out.push(s.value);
  }
  return out;
}

const isJs = (f) => JS_EXT.has(extname(f));
const isStyle = (f) => STYLE_EXT.has(extname(f));

function findDesignMd(root) {
  for (const name of ['DESIGN.md', 'design.md']) {
    const p = join(root, name);
    if (existsSync(p)) return p;
  }
  return null;
}

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

function isGated(file) {
  const src = code(file);
  if (GLASS_GATE_CALL_RE.test(src)) return true;
  if (lexed(file).strings.some((s) => GLASS_GATE_MEDIA_RE.test(s.value)) && /\bmatchMedia\s*\(/.test(src)) return true;
  return importsOf(file).some((spec) => GLASS_GATE_MODULE_RE.test(spec));
}

export function checkGlass(root, files) {
  const offenders = [];
  const orphanSvgs = [];
  let cssBlur = 0;
  let refracting = 0;
  const jsFiles = files.filter(isJs);
  for (const f of files) {
    const src = code(f);
    if ((isJs(f) || isStyle(f)) && GLASS_CSS_RE.test(src)) cssBlur += 1;
    if (isJs(f) || isStyle(f)) {
      if (!GLASS_JS_RE.test(src)) continue;
      refracting += 1;
      if (!isGated(f)) offenders.push(relative(root, f));
    } else if (FILTER_EXT.has(extname(f)) && GLASS_FILE_RE.test(src)) {
      // An external filter inherits the gate of the code that references it.
      refracting += 1;
      const name = basename(f);
      const consumers = jsFiles.filter((j) => lexed(j).strings.some((s) => s.value.includes(name)));
      if (!consumers.length) orphanSvgs.push(relative(root, f));
      else if (!consumers.every(isGated)) offenders.push(`${relative(root, f)} via ${consumers.filter((j) => !isGated(j)).map((j) => relative(root, j)).join(', ')}`);
    }
  }
  if (offenders.length) {
    return { id: 'glass-gated', level: 'error', ok: false, detail: `refracting glass with no gate call or gate import in the code that ships it: ${listed(offenders)}` };
  }
  const orphan = orphanSvgs.length ? `; ${orphanSvgs.length} displacement SVG(s) referenced by no source file, check CSS url() use by eye: ${listed(orphanSvgs)}` : '';
  return { id: 'glass-gated', level: orphanSvgs.length ? 'warn' : 'info', ok: !orphanSvgs.length, detail: `${cssBlur} CSS blur file(s) (baseline tier, no gate needed), ${refracting} refracting glass file(s)${offenders.length ? '' : ', each gated in code'}${orphan}` };
}

// --- module graph --------------------------------------------------------------------------

export function insideRoot(root, candidate) {
  if (/^(\\\\|\/\/)/.test(candidate)) return false;
  const rel = relative(root, candidate);
  return rel !== '' && !rel.startsWith('..') && !isAbsolute(rel);
}

const linkCache = new Map();
export function pathHasLink(root, candidate) {
  const parts = relative(root, candidate).split(/[\\/]/).filter(Boolean);
  let dir = root;
  for (const part of parts.slice(0, -1)) {
    dir = join(dir, part);
    if (!linkCache.has(dir)) {
      let isLink = false;
      try { isLink = lstatSync(dir).isSymbolicLink(); } catch { isLink = true; }
      linkCache.set(dir, isLink);
    }
    if (linkCache.get(dir)) return true;
  }
  return false;
}

// tsconfig `paths` as TypeScript defines them: targets resolve against `baseUrl` when set, else
// the config's directory; exact keys and `prefix/*` keys both count; longest key wins.
export function readAliases(root) {
  const aliases = [];
  for (const name of ['tsconfig.json', 'jsconfig.json']) {
    const p = join(root, name);
    if (!existsSync(p)) continue;
    const text = read(p).replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/,\s*([}\]])/g, '$1');
    let opts;
    try { opts = JSON.parse(text).compilerOptions ?? {}; } catch { opts = {}; }
    const base = opts.baseUrl ? resolve(root, opts.baseUrl) : root;
    for (const [key, targets] of Object.entries(opts.paths ?? {})) {
      if (!Array.isArray(targets)) continue;
      const wildcard = key.endsWith('/*');
      const dirs = targets
        .map((t) => resolve(base, String(t).replace(/\/?\*$/, '')))
        .filter((d) => d === root || insideRoot(root, d));
      if (dirs.length) aliases.push({ key: wildcard ? key.slice(0, -1) : key, wildcard, dirs });
    }
  }
  if (!aliases.some((a) => a.key === '@/')) aliases.push({ key: '@/', wildcard: true, dirs: [join(root, 'src'), root] });
  return aliases.sort((a, b) => b.key.length - a.key.length);
}

function resolveModule(root, base) {
  if (!insideRoot(root, base) || pathHasLink(root, base)) return null;
  for (const ext of ['', '.tsx', '.ts', '.jsx', '.js', '.mjs', '/index.tsx', '/index.ts', '/index.js']) {
    // Normalised, so the path is byte-identical to the one walk() produced and set lookups hold.
    const candidate = resolve(base + ext);
    if (ext.startsWith('/') && pathHasLink(root, candidate)) continue;
    let st;
    try { st = lstatSync(candidate); } catch { continue; }
    if (st.isFile()) return candidate;
  }
  return null;
}

function localImports(root, file, aliases, unresolved) {
  const out = [];
  for (const spec of importsOf(file)) {
    let candidates = [];
    if (spec.startsWith('.')) candidates = [resolve(dirname(file), spec)];
    else {
      const alias = aliases.find((a) => (a.wildcard ? spec.startsWith(a.key) : spec === a.key));
      if (!alias) {
        if (/^[~#]/.test(spec)) unresolved.add(spec);
        continue;
      }
      candidates = alias.dirs.map((d) => (alias.wildcard ? join(d, spec.slice(alias.key.length)) : d));
    }
    const hit = candidates.map((c) => resolveModule(root, c)).find(Boolean);
    if (hit) out.push(hit);
    else unresolved.add(spec);
  }
  return out;
}

function reachable(root, entry, aliases, unresolved, state) {
  const seen = new Set([entry]);
  let frontier = [entry];
  let depth = 0;
  while (frontier.length) {
    if (depth === IMPORT_DEPTH) { state.depthCut += frontier.length; break; }
    const next = [];
    for (const f of frontier) {
      for (const dep of localImports(root, f, aliases, unresolved)) {
        if (!seen.has(dep)) { seen.add(dep); next.push(dep); }
      }
    }
    frontier = next;
    depth += 1;
  }
  return seen;
}

// Next.js parallel routes: pages whose paths differ only by `@slot` segments render together.
function routeKey(root, page) {
  return relative(root, dirname(page)).split(/[\\/]/).filter((s) => !s.startsWith('@')).join('/');
}

export function checkGpuSurfaces(root, files) {
  const gpuModules = new Set(files.filter((f) => isJs(f) && importsOf(f).some((s) => GPU_PACKAGES.test(s))));
  const renderers = new Set([...gpuModules].filter((f) => RENDERER_RE.test(code(f))));
  const aliases = readAliases(root);
  const unresolved = new Set();
  const state = { depthCut: 0 };
  const noLifecycle = [];
  const noPoster = [];
  for (const f of renderers) {
    const src = code(f);
    // `addEventListener('visibilitychange', …)` carries the event name as a string argument.
    const listens = /\baddEventListener\s*\(\s*''/.test(src) && lexed(f).strings.some((s) => s.value === 'visibilitychange');
    if (!LIFECYCLE_RE.test(src) && !listens) noLifecycle.push(relative(root, f));
    if (!POSTER_RE.test(src)) noPoster.push(relative(root, f));
  }
  const pages = files.filter((f) => /(^|[\\/])page\.(tsx|jsx|ts|js)$/.test(f));
  const layouts = files.filter((f) => /(^|[\\/])layout\.(tsx|jsx|ts|js)$/.test(f));
  const groups = new Map();
  for (const page of pages) {
    const key = routeKey(root, page);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(page);
  }
  const offenders = [];
  for (const [key, groupPages] of groups) {
    const modules = new Set();
    for (const page of groupPages) {
      const entries = [page, ...layouts.filter((l) => page.startsWith(dirname(l) + sep))];
      for (const e of entries) for (const m of reachable(root, e, aliases, unresolved, state)) modules.add(m);
    }
    const count = [...modules].filter((m) => renderers.has(m)).length;
    if (count > 1) offenders.push(`${key || '/'} (${count} renderer modules via ${groupPages.length} page(s) and layouts)`);
  }
  const results = [];
  results.push(offenders.length
    ? { id: 'one-gpu-surface', level: 'error', ok: false, detail: `a route reaches more than one renderer module (static count; the runtime budget is the wrapper's job): ${listed(offenders)}` }
    : { id: 'one-gpu-surface', level: 'info', ok: true, detail: `${renderers.size} renderer module(s) among ${gpuModules.size} GPU-importing module(s); no route reaches two (static count over ${pages.length} page(s), ${groups.size} route(s), ${layouts.length} layout(s))` });
  results.push(noLifecycle.length
    ? { id: 'gpu-lifecycle', level: 'error', ok: false, detail: `renderer modules with no IntersectionObserver or visibilitychange in code (word-level check; that it pauses is verified by eye): ${listed(noLifecycle)}` }
    : { id: 'gpu-lifecycle', level: 'info', ok: true, detail: 'every renderer module references visibility handling in code, or there are none; that it pauses is verified by eye' });
  results.push(noPoster.length
    ? { id: 'poster-first', level: 'warn', ok: false, detail: `renderer modules with no poster, fallback or noscript reference; the no-script still must be checked by eye: ${listed(noPoster)}` }
    : { id: 'poster-first', level: 'info', ok: true, detail: 'every renderer module names a poster or fallback; whether it paints first is checked by eye, not here' });
  const gaps = [];
  if (unresolved.size) gaps.push(`${unresolved.size} import specifier(s) unresolved: ${listed([...unresolved])}`);
  if (state.depthCut) gaps.push(`${state.depthCut} module(s) beyond the ${IMPORT_DEPTH}-edge traversal limit`);
  results.push(gaps.length
    ? { id: 'coverage', level: 'error', ok: false, detail: `the route graph is incomplete, so the surface count above is not a pass: ${gaps.join('; ')}` }
    : { id: 'coverage', level: 'info', ok: true, detail: 'every local import on every route resolved inside the scanned root' });
  return results;
}

// A score is a markdown table whose header names a reduced-motion column and which carries at
// least one beat row with that cell filled in.
export function validMotionScore(text) {
  const lines = text.split(/\r?\n/).filter((l) => /^\s*\|/.test(l));
  const cells = (l) => l.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim());
  const headerIdx = lines.findIndex((l) => cells(l).some((c) => /reduced/i.test(c)));
  if (headerIdx === -1) return false;
  const col = cells(lines[headerIdx]).findIndex((c) => /reduced/i.test(c));
  return lines.slice(headerIdx + 1).some((l) => {
    const row = cells(l);
    if (row.every((c) => /^:?-{3,}:?$/.test(c) || c === '')) return false;
    return Boolean(row[col]) && row.some((c, i) => i !== col && c);
  });
}

export function checkMotionScore(root, product, allFiles = product) {
  const motionFiles = product.filter((f) => isJs(f) && importsOf(f).some((s) => MOTION_PACKAGES.test(s)));
  if (!motionFiles.length) return { id: 'motion-scored', level: 'info', ok: true, detail: 'no motion library in use' };
  const scores = allFiles.filter((f) => basename(f).toLowerCase() === 'motion-score.md');
  const valid = scores.filter((f) => validMotionScore(read(f)));
  if (valid.length) {
    return { id: 'motion-scored', level: 'info', ok: true, detail: `${motionFiles.length} motion file(s), score at ${relative(root, valid[0])}; which beats a route ships is checked by the critic, not here` };
  }
  const why = scores.length ? `${scores.length} motion-score.md found but none has a reduced-motion column with a filled beat row` : 'no motion-score.md exists';
  return { id: 'motion-scored', level: 'error', ok: false, detail: `${motionFiles.length} file(s) import a motion library; ${why} (cinematic-motion skill, step 1)` };
}

export function checkRawColour(root, files) {
  const seen = new Map();
  for (const f of files) {
    const rel = relative(root, f);
    if (!['.tsx', '.jsx'].includes(extname(f)) || TOKEN_FILE_RE.test(rel)) continue;
    // Colour literals live in strings and in style objects; scan the raw text here on purpose.
    for (const m of read(f).matchAll(COLOUR_RE)) {
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
  lexCache.clear();
  linkCache.clear();
  let abs = resolve(root);
  try { abs = realpathSync(abs); } catch { /* an unresolvable root fails in walk() */ }
  const files = walk(abs).filter((f) => isJs(f) || isStyle(f) || FILTER_EXT.has(extname(f)) || /\.md$/i.test(f));
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
  lines.push('', `${result.errors} error(s), ${result.warns} warning(s). Static scan over lexed source: it proves a pattern is absent and the import graph complete, never that a page behaves.`);
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
