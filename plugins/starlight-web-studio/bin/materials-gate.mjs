#!/usr/bin/env node
// Living-materials gate: the rules a page must meet before glass, GPU or GSAP ship.
// Model-free, static, dependency-free. Reads a repo on disk and exits 1 on any error-level
// finding.
//
//   node materials-gate.mjs <repoDir> [--json]
//
// Owned here: design-md, glass-gated, one-gpu-surface, gpu-lifecycle, poster-first,
// motion-scored, raw-colour, coverage. A static scan proves a pattern is absent from shipped
// source; it never proves a page behaves. PASS means every rule held AND every local import
// was resolved AND every file lexed cleanly AND every loading expression was one the scanner
// understands: anything it could not read or follow is the `coverage` error, never a pass.
//
// Not covered, by design: raw WebGL without a library, CDN script tags, refraction behind a
// build-time plugin, whether a gate call prevents renderer creation, and a renderer class
// that reaches `new` through more than two bindings or a function return. Those belong to
// the materials wrapper and the eye pass.

import { readdirSync, readFileSync, statSync, lstatSync, existsSync, realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { builtinModules } from 'node:module';
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
// Tests, fixtures and stories anywhere, and repo tooling at the root, are not shipped pages.
const NON_SHIPPING_RE = /(^|[\\/])(tests?|__tests__|fixtures?|__fixtures__|__mocks__|stories|e2e)[\\/]|^(scripts|tools|bin)[\\/]|\.(test|spec|stories)\.[cm]?[jt]sx?$/;
const JS_EXT = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.astro', '.svelte', '.vue']);
const STYLE_EXT = new Set(['.css', '.scss', '.html']);
const FILTER_EXT = new Set(['.svg']);
const TOKEN_FILE_RE = /(^|[\\/])(tailwind\.config\.[cm]?[jt]s|globals?\.css|tokens?\.[cm]?[jt]s|theme\.[cm]?[jt]s|design\.sidecar\.json|DESIGN\.md|design\.md)$|(^|[\\/])tokens?[\\/]/i;

const GPU_PACKAGES = /^(three|@react-three\/fiber|@react-three\/drei|ogl|@paper-design\/shaders(-react)?|liquidgl)(\/|$)/;
const MOTION_PACKAGES = /^(gsap|@gsap\/react|lenis|motion|framer-motion)(\/|$)/;
const RENDERER_CTORS = ['WebGLRenderer', 'WebGPURenderer', 'Renderer'];
const RENDERER_TAGS = ['Canvas', 'MeshGradient', 'GrainGradient', 'Dithering', 'Warp', 'DotOrbit', 'Waves', 'ShaderMount'];
const RENDERER_CALLS = ['liquidGL'];
const BUILTINS = new Set(builtinModules);

const GLASS_CSS_RE = /backdrop-filter/i;
const GLASS_JS_RE = /<feDisplacementMap\b|<LiquidGlass\w*\b|\bliquidGL\s*\(/;
const GLASS_FILE_RE = /<feDisplacementMap\b/;
const GLASS_GATE_CALL_RE = /\bgpuPlan\s*\(|\buseGlassPlan\s*\(/;
const GLASS_GATE_MODULE_RE = /(^|\/)glass-gate(\.[cm]?[jt]s)?$|^@starlight\/materials(\/|$)/;
const LIFECYCLE_RE = /\bIntersectionObserver\b|\bdocument\.hidden\b|\bonvisibilitychange\b/;
const POSTER_RE = /\bposter\b|<noscript\b|\bfallback\b/i;
const COLOUR_RE = /#(?:[0-9a-f]{3}){1,2}\b|\b(?:rgb|hsl|oklch|oklab)a?\([^)]*\)/gi;
const RAW_COLOUR_WARN_AT = 20;
const LIST_CAP = 8;
const IMPORT_DEPTH = 12;
const CASE_INSENSITIVE = process.platform === 'win32' || process.platform === 'darwin';

export const norm = (p) => (CASE_INSENSITIVE ? p.toLowerCase() : p);
const IDENT = /[A-Za-z0-9_$]/;

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
// One recursive scanner over the source. Comments become a single space; string, template and
// regex literals become empty placeholders; every string literal is kept beside its offset in
// the emitted code so import specifiers can be read back. Template substitutions are scanned
// by the same loop, so a regex brace or a comment inside `${}` cannot end the substitution.
//
// Two ambiguities a lexer cannot settle from syntax alone are settled by rules:
// - a quote immediately after an identifier character (`Don't`) is an apostrophe, because
//   JavaScript never lets a string literal follow an identifier; a quote with no closing
//   quote on its line is an apostrophe for the same reason;
// - a slash is a regex start when the previous significant token cannot end an expression:
//   an operator, an opening bracket, a keyword that is not a property name, or a `)` that
//   closed an `if`, `while`, `for` or `with` condition. After `<` it is a JSX closing tag.
const REGEX_PREV_CHARS = new Set(['(', ',', '=', ':', '[', '!', '&', '|', '?', '{', '}', ';', '+', '-', '*', '%', '>', '~', '^']);
const REGEX_PREV_WORDS = new Set(['return', 'typeof', 'case', 'do', 'else', 'in', 'of', 'instanceof', 'new', 'delete', 'void', 'throw', 'yield', 'await']);
const CONTROL_WORDS = /\b(?:if|while|for|with)\s*$/;

export function lex(text) {
  const strings = [];
  const issues = [];
  const parens = [];
  let lastCloseWasControl = false;
  let code = '';
  const n = text.length;

  function regexCanStart() {
    const t = code.replace(/\s+$/, '');
    if (!t) return true;
    const last = t[t.length - 1];
    if (last === ')') return lastCloseWasControl;
    if (last === '<') return false;
    if (t.endsWith('++') || t.endsWith('--')) return false;
    if (REGEX_PREV_CHARS.has(last)) return true;
    const word = t.match(/([A-Za-z_$][\w$]*)$/);
    if (!word || !REGEX_PREV_WORDS.has(word[1])) return false;
    return !t.slice(0, -word[1].length).endsWith('.');
  }

  function quoted(start, quote) {
    let j = start + 1;
    let value = '';
    while (j < n) {
      const ch = text[j];
      if (ch === '\\') { value += text[j + 1] ?? ''; j += 2; continue; }
      if (ch === quote) return { end: j + 1, value, closed: true };
      if (ch === '\n' || ch === '\r') break;
      value += ch;
      j += 1;
    }
    return { end: start + 1, value: '', closed: false };
  }

  function regexLiteral(start) {
    let j = start + 1;
    let inClass = false;
    while (j < n) {
      const ch = text[j];
      if (ch === '\\') { j += 2; continue; }
      if (ch === '\n') return null;
      if (inClass) { if (ch === ']') inClass = false; j += 1; continue; }
      if (ch === '[') { inClass = true; j += 1; continue; }
      if (ch === '/') {
        j += 1;
        while (j < n && /[a-z]/i.test(text[j])) j += 1;
        return j;
      }
      j += 1;
    }
    return null;
  }

  // Scans from i. In a substitution it returns at the `}` that closes it; otherwise at the end.
  function scan(i, inSub) {
    let depth = 0;
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
        if (end === -1) issues.push('unterminated block comment');
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
      if (c === '/' && regexCanStart()) {
        const end = regexLiteral(i);
        if (end !== null) { code += ' /re/ '; i = end; continue; }
      }
      if (c === '"' || c === "'") {
        const prev = code[code.length - 1];
        const s = prev && IDENT.test(prev) ? { closed: false } : quoted(i, c);
        if (s.closed) {
          strings.push({ at: code.length, value: s.value, template: false });
          code += c + c;
          i = s.end;
        } else {
          code += c;
          i += 1;
        }
        continue;
      }
      if (c === '`') {
        i = templateLiteral(i);
        continue;
      }
      if (inSub) {
        if (c === '{') depth += 1;
        else if (c === '}') {
          if (depth === 0) return i + 1;
          depth -= 1;
        }
      }
      if (c === '(') parens.push(CONTROL_WORDS.test(code));
      else if (c === ')') lastCloseWasControl = parens.pop() ?? false;
      code += c;
      i += 1;
    }
    if (inSub) issues.push('unterminated template substitution');
    return n;
  }

  function templateLiteral(start) {
    const at = code.length;
    code += '``';
    let j = start + 1;
    let value = '';
    let pure = true;
    while (j < n) {
      const ch = text[j];
      if (ch === '\\') { value += text[j + 1] ?? ''; j += 2; continue; }
      if (ch === '`') {
        strings.push({ at, value, template: true, pure });
        return j + 1;
      }
      if (ch === '$' && text[j + 1] === '{') {
        pure = false;
        value += '${}';
        code += ' ${';
        j = scan(j + 2, true);
        code += '} ';
        continue;
      }
      value += ch;
      j += 1;
    }
    issues.push('unterminated template literal');
    strings.push({ at, value, template: true, pure: false });
    return n;
  }

  scan(0, false);
  return { code, strings, issues };
}

const lexCache = new Map();
function lexed(file) {
  if (!lexCache.has(file)) {
    const ext = extname(file);
    lexCache.set(file, JS_EXT.has(ext) ? lex(read(file)) : { code: stripStyleComments(read(file)), strings: [], issues: [] });
  }
  return lexCache.get(file);
}
function stripStyleComments(text) {
  return text.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/<!--[\s\S]*?-->/g, ' ');
}
const code = (file) => lexed(file).code;

// Import and re-export specifiers: `import … from "x"`, `export … from "x"`, `import "x"`,
// `import("x")`, `require("x")`. A pure template specifier counts; any other loading
// expression (`import(name)`, `require(require.resolve(…))`) is reported as dynamic so
// coverage fails closed. Type-only forms ship nothing and are dropped; a default or namespace
// binding beside type names keeps the import.
export function importsOf(file) {
  const { code: src, strings } = lexed(file);
  const out = [];
  let dynamic = 0;
  for (const s of strings) {
    const before = src.slice(Math.max(0, s.at - 400), s.at);
    let kind = null;
    if (/\bfrom\s*$/.test(before)) kind = 'from';
    else if (/\bimport\s*$/.test(before)) kind = 'side-effect';
    else if (/\b(?:import|require)\s*\(\s*$/.test(before)) kind = 'call';
    if (!kind) continue;
    if (s.template) {
      if (s.pure) out.push(s.value);
      else dynamic += 1;
      continue;
    }
    if (kind === 'from') {
      const start = Math.max(before.lastIndexOf('import'), before.lastIndexOf('export'));
      const stmt = before.slice(start);
      if (/^import\s+type\b/.test(stmt) || /^export\s+type\b/.test(stmt)) continue;
      if (/^import\b/.test(stmt)) {
        const hasDefaultOrNamespace = /^import\s+(?:[A-Za-z_$][\w$]*\s*,|\*\s+as\b|[A-Za-z_$][\w$]*\s+from)/.test(stmt);
        const names = stmt.match(/\{([^}]*)\}/);
        if (!hasDefaultOrNamespace && names) {
          const specs = names[1].split(',').map((x) => x.trim()).filter(Boolean);
          if (specs.length && specs.every((x) => /^type\s/.test(x))) continue;
        }
      }
    }
    out.push(s.value);
  }
  // A loading call whose argument is not a literal: `import(name)`, `require(require.resolve(x))`.
  for (const m of src.matchAll(/\b(?:import|require)\s*\(\s*([^\s'"`)])/g)) if (m[1]) dynamic += 1;
  return Object.assign(out, { dynamic });
}

// Renderer detection follows import aliases and up to two variable bindings:
// `import { WebGLRenderer as GL }`, `const C = THREE.WebGLRenderer`, `const { Renderer: R } = ogl`.
export function isRenderer(file) {
  const { code: src, strings } = lexed(file);
  const ctors = new Set(RENDERER_CTORS);
  const tags = new Set(RENDERER_TAGS);
  const calls = new Set(RENDERER_CALLS);
  for (const s of strings) {
    if (!GPU_PACKAGES.test(s.value)) continue;
    const before = src.slice(Math.max(0, s.at - 400), s.at);
    const stmt = before.slice(before.lastIndexOf('import'));
    const names = stmt.match(/\{([^}]*)\}/);
    if (!names) continue;
    for (const spec of names[1].split(',')) {
      const m = spec.trim().match(/^(?:type\s+)?([A-Za-z_$][\w$]*)\s+as\s+([A-Za-z_$][\w$]*)$/);
      if (!m) continue;
      if (ctors.has(m[1])) ctors.add(m[2]);
      if (tags.has(m[1])) tags.add(m[2]);
      if (calls.has(m[1])) calls.add(m[2]);
    }
  }
  const alt = (set) => [...set].join('|');
  for (let pass = 0; pass < 2; pass += 1) {
    for (const m of src.matchAll(new RegExp(`\\b([A-Za-z_$][\\w$]*)\\s*=\\s*(?:[A-Za-z_$][\\w$]*\\.)?(${alt(ctors)})\\b(?!\\s*\\()`, 'g'))) ctors.add(m[1]);
    for (const m of src.matchAll(new RegExp(`\\b(${alt(ctors)})\\s*:\\s*([A-Za-z_$][\\w$]*)\\s*[,}]`, 'g'))) ctors.add(m[2]);
  }
  return new RegExp(`new\\s+(?:[A-Za-z_$][\\w$]*\\.)?(?:${alt(ctors)})\\b|<(?:${alt(tags)})\\b|\\b(?:${alt(calls)})\\s*\\(`).test(src);
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
  const { code: src, strings } = lexed(file);
  if (GLASS_GATE_CALL_RE.test(src)) return true;
  if (strings.some((s) => /prefers-reduced-transparency/.test(s.value) && /\bmatchMedia\s*\(\s*$/.test(src.slice(Math.max(0, s.at - 40), s.at)))) return true;
  return importsOf(file).some((spec) => GLASS_GATE_MODULE_RE.test(spec));
}

function referencesAsset(value, name) {
  const clean = value.split(/[?#]/)[0];
  return clean === name || clean.endsWith('/' + name);
}

export function checkGlass(root, files) {
  const offenders = [];
  const orphanSvgs = [];
  let cssBlur = 0;
  let refracting = 0;
  const jsFiles = files.filter(isJs);
  const styleFiles = files.filter(isStyle);
  for (const f of files) {
    const src = code(f);
    if ((isJs(f) || isStyle(f)) && GLASS_CSS_RE.test(src)) cssBlur += 1;
    if (isJs(f) || isStyle(f)) {
      if (!GLASS_JS_RE.test(src)) continue;
      refracting += 1;
      if (isStyle(f) || !isGated(f)) offenders.push(relative(root, f));
    } else if (FILTER_EXT.has(extname(f)) && GLASS_FILE_RE.test(src)) {
      refracting += 1;
      const name = basename(f);
      const jsConsumers = jsFiles.filter((j) => lexed(j).strings.some((s) => referencesAsset(s.value, name)));
      const cssConsumers = styleFiles.filter((c) => [...code(c).matchAll(/url\(\s*['"]?([^'")]+)['"]?\s*\)|(?:src|href)=['"]([^'"]+)['"]/g)].some((m) => referencesAsset(m[1] ?? m[2] ?? '', name)));
      const ungated = [...cssConsumers, ...jsConsumers.filter((j) => !isGated(j))];
      if (!jsConsumers.length && !cssConsumers.length) orphanSvgs.push(relative(root, f));
      else if (ungated.length) offenders.push(`${relative(root, f)} via ${ungated.map((j) => relative(root, j)).join(', ')}`);
    }
  }
  if (offenders.length) {
    return { id: 'glass-gated', level: 'error', ok: false, detail: `refracting glass with no gate call or gate import in the code that ships it (CSS applies a filter unconditionally): ${listed(offenders)}` };
  }
  const orphan = orphanSvgs.length ? `; ${orphanSvgs.length} displacement SVG(s) referenced by no source or stylesheet: ${listed(orphanSvgs)}` : '';
  return { id: 'glass-gated', level: orphanSvgs.length ? 'warn' : 'info', ok: !orphanSvgs.length, detail: `${cssBlur} CSS blur file(s) (baseline tier, no gate needed), ${refracting} refracting glass file(s)${refracting ? ', each gated in code' : ''}${orphan}` };
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

export function stripJsonc(text) {
  let out = '';
  let i = 0;
  while (i < text.length) {
    const c = text[i];
    if (c === '"') {
      let j = i + 1;
      while (j < text.length && text[j] !== '"') j += text[j] === '\\' ? 2 : 1;
      out += text.slice(i, j + 1);
      i = j + 1;
      continue;
    }
    if (c === '/' && text[i + 1] === '/') { while (i < text.length && text[i] !== '\n') i += 1; continue; }
    if (c === '/' && text[i + 1] === '*') { const e = text.indexOf('*/', i + 2); i = e === -1 ? text.length : e + 2; continue; }
    out += c;
    i += 1;
  }
  return out.replace(/,(\s*[}\]])/g, '$1');
}

function readJsonc(file) {
  try { return JSON.parse(stripJsonc(read(file))); } catch { return null; }
}

// compilerOptions with `extends` merged (child wins). A missing, cyclic, outside-root or
// package-based parent is reported, never silently dropped.
function compilerOptions(root, file, seen = new Set()) {
  const rel = relative(root, file);
  if (seen.has(norm(file))) return { opts: {}, dropped: [`${rel} extends itself in a cycle`] };
  if (!existsSync(file)) return { opts: {}, dropped: [`${rel} does not exist`] };
  if (file !== root && !insideRoot(root, file)) return { opts: {}, dropped: [`${rel} is outside the scanned root`] };
  seen.add(norm(file));
  const json = readJsonc(file);
  if (!json) return { opts: {}, dropped: [`${rel} is not valid JSON`] };
  let base = { opts: {}, dropped: [] };
  if (typeof json.extends === 'string' && json.extends.startsWith('.')) {
    let target = resolve(dirname(file), json.extends);
    if (!/\.json$/.test(target)) target += '.json';
    base = compilerOptions(root, target, seen);
  } else if (json.extends) {
    base.dropped.push(`${rel} extends a package config (${json.extends}), not followed`);
  }
  const own = json.compilerOptions ?? {};
  const opts = { ...base.opts, ...own };
  if (own.baseUrl !== undefined) opts.baseUrlDir = resolve(dirname(file), own.baseUrl);
  else if (base.opts.baseUrlDir) opts.baseUrlDir = base.opts.baseUrlDir;
  if (own.paths !== undefined) opts.pathsDir = opts.baseUrlDir ?? dirname(file);
  else if (base.opts.pathsDir) opts.pathsDir = base.opts.pathsDir;
  return { opts, dropped: base.dropped };
}

export function readAliases(root) {
  const aliases = [];
  const dropped = [];
  let baseUrlDir = null;
  for (const name of ['tsconfig.json', 'jsconfig.json']) {
    const p = join(root, name);
    if (!existsSync(p)) continue;
    const { opts, dropped: d } = compilerOptions(root, p);
    dropped.push(...d);
    if (opts.baseUrlDir && (opts.baseUrlDir === root || insideRoot(root, opts.baseUrlDir))) baseUrlDir = baseUrlDir ?? opts.baseUrlDir;
    const pathsDir = opts.pathsDir ?? root;
    for (const [key, targets] of Object.entries(opts.paths ?? {})) {
      if (!Array.isArray(targets)) continue;
      const wildcard = key.endsWith('/*');
      const dirs = [];
      for (const t of targets) {
        const dir = resolve(pathsDir, String(t).replace(/\/?\*$/, ''));
        if (dir === root || insideRoot(root, dir)) dirs.push(dir);
        else dropped.push(`alias ${key} target ${t} is outside the scanned root`);
      }
      if (dirs.length) aliases.push({ key: wildcard ? key.slice(0, -1) : key, wildcard, dirs });
    }
  }
  if (!aliases.some((a) => a.key === '@/')) aliases.push({ key: '@/', wildcard: true, dirs: [join(root, 'src'), root] });
  aliases.sort((a, b) => b.key.length - a.key.length);
  return Object.assign(aliases, { baseUrlDir, dropped });
}

function resolveModule(root, base) {
  if (!insideRoot(root, base) || pathHasLink(root, base)) return null;
  for (const ext of ['', '.tsx', '.ts', '.jsx', '.js', '.mjs', '/index.tsx', '/index.ts', '/index.js']) {
    const candidate = resolve(base + ext);
    if (ext.startsWith('/') && pathHasLink(root, candidate)) continue;
    let st;
    try { st = lstatSync(candidate); } catch { continue; }
    if (st.isFile()) return candidate;
  }
  return null;
}

function packageName(spec) {
  const parts = spec.split('/');
  return spec.startsWith('@') ? parts.slice(0, 2).join('/') : parts[0];
}
// `server-only` and `client-only` are compiler directives the framework provides, not installs.
const FRAMEWORK_VIRTUAL = new Set(['server-only', 'client-only']);
const isBuiltin = (spec) => spec.startsWith('node:') || BUILTINS.has(packageName(spec)) || FRAMEWORK_VIRTUAL.has(spec);

// Installed packages: a top-level node_modules entry, or pnpm's content store under
// node_modules/.pnpm where `@scope/name@1.2.3` is stored as `@scope+name@1.2.3`.
function packageStore(root) {
  const nm = join(root, 'node_modules');
  if (!existsSync(nm)) return null;
  let pnpm = [];
  try { pnpm = readdirSync(join(nm, '.pnpm')); } catch { pnpm = []; }
  return {
    has(name) {
      if (existsSync(join(nm, name))) return true;
      const key = name.replace('/', '+') + '@';
      return pnpm.some((e) => e.startsWith(key));
    },
  };
}

function localImports(root, file, aliases, state) {
  const out = [];
  const specs = importsOf(file);
  if (specs.dynamic) state.dynamic.set(relative(root, file), specs.dynamic);
  for (const spec of specs) {
    const clean = spec.split(/[?#]/)[0];
    let candidates = [];
    if (clean.startsWith('.')) candidates = [resolve(dirname(file), clean)];
    else if (isAbsolute(clean)) { state.unresolved.add(spec); continue; }
    else {
      const alias = aliases.find((a) => (a.wildcard ? clean.startsWith(a.key) : clean === a.key));
      if (alias) candidates = alias.dirs.map((d) => (alias.wildcard ? join(d, clean.slice(alias.key.length)) : d));
      else if (/^[~#]/.test(clean)) { state.unresolved.add(spec); continue; }
      else {
        if (isBuiltin(clean)) continue;
        if (aliases.baseUrlDir) candidates = [join(aliases.baseUrlDir, clean)];
        const hitBase = candidates.map((c) => resolveModule(root, c)).find(Boolean);
        if (hitBase) { out.push(hitBase); continue; }
        const name = packageName(clean);
        if (state.store === undefined) state.store = packageStore(root);
        if (state.store === null) state.unverified.add(name);
        else if (!state.store.has(name)) state.unresolved.add(spec);
        continue;
      }
    }
    const hit = candidates.map((c) => resolveModule(root, c)).find(Boolean);
    if (hit) out.push(hit);
    else state.unresolved.add(spec);
  }
  return out;
}

function reachable(root, entry, aliases, state) {
  const seen = new Map([[norm(entry), entry]]);
  let frontier = [entry];
  let depth = 0;
  while (frontier.length) {
    if (depth === IMPORT_DEPTH) { state.depthCut += frontier.length; break; }
    const next = [];
    for (const f of frontier) {
      for (const dep of localImports(root, f, aliases, state)) {
        if (!seen.has(norm(dep))) { seen.set(norm(dep), dep); next.push(dep); }
      }
    }
    frontier = next;
    depth += 1;
  }
  return seen;
}

// Next.js app-router conventions. A route key is the URL-shaped path of a route file: route
// groups `(name)` add no segment; everything inside an `@slot`, including an intercepting
// `(.)segment`, renders beside the slot's parent and takes the parent's key. Entries for a
// route are its own page/layout/template/default files, the layouts and templates of every
// physical ancestor, and every route file inside a slot of any ancestor, because those render
// at the same time.
const ROUTE_FILE_RE = /(^|[\\/])(page|layout|template|default)\.(tsx|jsx|ts|js)$/;
export function routeKey(root, file) {
  const segs = relative(root, dirname(file)).split(/[\\/]/).filter(Boolean);
  const out = [];
  for (const s of segs) {
    if (s.startsWith('@')) break;
    if (/^\(.*\)$/.test(s)) continue;
    out.push(s.replace(/^\(\.{1,3}\)/, ''));
  }
  return out.join('/');
}

function ancestorEntries(root, member, routeFiles) {
  const out = [];
  let dir = dirname(member);
  while (insideRoot(root, dir) || dir === root) {
    for (const f of routeFiles) {
      if (f === member) continue;
      const fdir = dirname(f);
      if (fdir === dir && /(^|[\\/])(layout|template)\./.test(f)) out.push(f);
      else if (fdir.startsWith(dir + sep + '@')) out.push(f);
    }
    if (dir === root) break;
    dir = dirname(dir);
  }
  return out;
}

export function checkGpuSurfaces(root, files) {
  const gpuModules = new Map();
  for (const f of files) if (isJs(f) && importsOf(f).some((s) => GPU_PACKAGES.test(s))) gpuModules.set(norm(f), f);
  const renderers = new Map([...gpuModules].filter(([, f]) => isRenderer(f)));
  const aliases = readAliases(root);
  const state = { unresolved: new Set(), unverified: new Set(), dynamic: new Map(), depthCut: 0, store: undefined };
  const noLifecycle = [];
  const noPoster = [];
  for (const f of renderers.values()) {
    const { code: src, strings } = lexed(f);
    const listens = strings.some((s) => s.value === 'visibilitychange' && /\baddEventListener\s*\(\s*$/.test(src.slice(Math.max(0, s.at - 40), s.at)));
    if (!LIFECYCLE_RE.test(src) && !listens) noLifecycle.push(relative(root, f));
    if (!POSTER_RE.test(src)) noPoster.push(relative(root, f));
  }
  const routeFiles = files.filter((f) => ROUTE_FILE_RE.test(f));
  const pages = routeFiles.filter((f) => /(^|[\\/])page\./.test(f));
  const groups = new Map();
  for (const f of routeFiles) {
    const key = routeKey(root, f);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(f);
  }
  const offenders = [];
  let routes = 0;
  for (const [key, members] of groups) {
    if (!members.some((f) => /(^|[\\/])page\./.test(f))) continue;
    routes += 1;
    const entries = new Map();
    for (const m of members) {
      entries.set(norm(m), m);
      for (const a of ancestorEntries(root, m, routeFiles)) entries.set(norm(a), a);
    }
    const modules = new Map();
    for (const e of entries.values()) for (const [k, m] of reachable(root, e, aliases, state)) modules.set(k, m);
    const count = [...modules.keys()].filter((k) => renderers.has(k)).length;
    if (count > 1) offenders.push(`/${key} (${count} renderer modules via ${entries.size} route file(s))`);
  }
  // Every shipped file, not only route files, is checked for loading expressions the scanner
  // cannot follow, so a dynamic import anywhere in the product is a coverage gap.
  for (const f of files) if (isJs(f)) { const d = importsOf(f).dynamic; if (d) state.dynamic.set(relative(root, f), d); }
  const results = [];
  results.push(offenders.length
    ? { id: 'one-gpu-surface', level: 'error', ok: false, detail: `a route reaches more than one renderer module (static count; the runtime budget is the wrapper's job): ${listed(offenders)}` }
    : { id: 'one-gpu-surface', level: 'info', ok: true, detail: `${renderers.size} renderer module(s) among ${gpuModules.size} GPU-importing module(s); no route reaches two (static count over ${pages.length} page(s), ${routes} route(s), ${routeFiles.length - pages.length} layout/template/default file(s))` });
  results.push(noLifecycle.length
    ? { id: 'gpu-lifecycle', level: 'error', ok: false, detail: `renderer modules with no IntersectionObserver or visibilitychange listener in code (word-level check; that it pauses is verified by eye): ${listed(noLifecycle)}` }
    : { id: 'gpu-lifecycle', level: 'info', ok: true, detail: 'every renderer module references visibility handling in code, or there are none; that it pauses is verified by eye' });
  results.push(noPoster.length
    ? { id: 'poster-first', level: 'warn', ok: false, detail: `renderer modules with no poster, fallback or noscript reference; the no-script still must be checked by eye: ${listed(noPoster)}` }
    : { id: 'poster-first', level: 'info', ok: true, detail: 'every renderer module names a poster or fallback; whether it paints first is checked by eye, not here' });
  const lexIssues = files.filter((f) => isJs(f) && lexed(f).issues.length).map((f) => relative(root, f));
  const gaps = [];
  if (state.unresolved.size) gaps.push(`${state.unresolved.size} import specifier(s) unresolved (a local path, alias or package that is not where it should be): ${listed([...state.unresolved])}`);
  if (state.dynamic.size) gaps.push(`${state.dynamic.size} file(s) load a module through an expression the scanner cannot follow (import(name), require(require.resolve(…)), a substituted template): ${listed([...state.dynamic.keys()])}`);
  if (state.depthCut) gaps.push(`${state.depthCut} module(s) beyond the ${IMPORT_DEPTH}-edge traversal limit`);
  if (aliases.dropped.length) gaps.push(`tsconfig: ${listed(aliases.dropped)}`);
  if (lexIssues.length) gaps.push(`${lexIssues.length} file(s) the lexer could not read to the end: ${listed(lexIssues)}`);
  const soft = state.unverified.size ? `${state.unverified.size} bare specifier(s) assumed to be packages because no node_modules exists: ${listed([...state.unverified])}` : '';
  results.push(gaps.length
    ? { id: 'coverage', level: 'error', ok: false, detail: `the route graph is incomplete, so the surface count above is not a pass: ${gaps.join('; ')}${soft ? '; ' + soft : ''}` }
    : soft
      ? { id: 'coverage', level: 'warn', ok: false, detail: `every local import resolved inside the scanned root; ${soft}` }
      : { id: 'coverage', level: 'info', ok: true, detail: 'every local import on every route resolved inside the scanned root and every package was found in node_modules' });
  return results;
}

export function validMotionScore(text) {
  const lines = text.split(/\r?\n/).filter((l) => /^\s*\|/.test(l));
  const cells = (l) => l.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim());
  const isSep = (row) => row.length > 0 && row.every((c) => /^:?-{3,}:?$/.test(c));
  const headerIdx = lines.findIndex((l) => cells(l).some((c) => /reduced[\s-]*motion/i.test(c)));
  if (headerIdx === -1 || !lines[headerIdx + 1] || !isSep(cells(lines[headerIdx + 1]))) return false;
  const col = cells(lines[headerIdx]).findIndex((c) => /reduced[\s-]*motion/i.test(c));
  return lines.slice(headerIdx + 2).some((l) => {
    const row = cells(l);
    if (isSep(row)) return false;
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
  const why = scores.length ? `${scores.length} motion-score.md found but none has a reduced-motion column, a separator row and a filled beat row` : 'no motion-score.md exists';
  return { id: 'motion-scored', level: 'error', ok: false, detail: `${motionFiles.length} file(s) import a motion library; ${why} (cinematic-motion skill, step 1)` };
}

export function checkRawColour(root, files) {
  const seen = new Map();
  for (const f of files) {
    const rel = relative(root, f);
    if (!['.tsx', '.jsx'].includes(extname(f)) || TOKEN_FILE_RE.test(rel)) continue;
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
