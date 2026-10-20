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
// Documented heuristic limits, accepted because they are rare in shipped pages: a slash after
// an object literal or after a keyword-named method call may be read as a regex start; a
// renderer class that reaches `new` through a function return or more than two bindings is
// not followed; a `<Tag>` immediately after an identifier is read as a comparison.

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
// Not shipped unless a shipped file imports it: tests, fixtures, stories, root tooling.
const NON_SHIPPING_RE = /(^|[\\/])(tests?|__tests__|fixtures?|__fixtures__|__mocks__|stories|e2e)[\\/]|^(scripts|tools|bin)[\\/]|\.(test|spec|stories)\.[cm]?[jt]sx?$/;
const JS_EXT = new Set(['.ts', '.tsx', '.mts', '.cts', '.js', '.jsx', '.mjs', '.cjs', '.astro', '.svelte', '.vue']);
// JSX is lexed wherever Next.js accepts it. `.ts` is excluded: it has no JSX and `<T>x` casts.
const JSX_EXT = new Set(['.tsx', '.jsx', '.js', '.mjs', '.cjs']);
const STYLE_EXT = new Set(['.css', '.scss', '.html']);
const FILTER_EXT = new Set(['.svg']);
const TOKEN_FILE_RE = /(^|[\\/])(tailwind\.config\.[cm]?[jt]s|globals?\.css|tokens?\.[cm]?[jt]s|theme\.[cm]?[jt]s|design\.sidecar\.json|DESIGN\.md|design\.md)$|(^|[\\/])tokens?[\\/]/i;

const GPU_PACKAGES = /^(three|@react-three\/fiber|@react-three\/drei|ogl|@paper-design\/shaders(-react)?|liquidgl)(\/|$)/;
const MOTION_PACKAGES = /^(gsap|@gsap\/react|lenis|motion|framer-motion)(\/|$)/;
const RENDERER_CTORS = ['WebGLRenderer', 'WebGPURenderer', 'Renderer'];
const RENDERER_TAGS = ['Canvas', 'MeshGradient', 'GrainGradient', 'Dithering', 'Warp', 'DotOrbit', 'Waves', 'ShaderMount'];
const RENDERER_CALLS = ['liquidGL'];
const BUILTINS = new Set(builtinModules);
const FRAMEWORK_VIRTUAL = new Set(['server-only', 'client-only']);

const GLASS_CSS_RE = /backdrop-filter/i;
const GLASS_JS_RE = /<(?:[A-Za-z_$][\w$]*\.)?feDisplacementMap\b|<(?:[A-Za-z_$][\w$]*\.)?LiquidGlass\w*\b|\bliquidGL\s*\(/;
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
// One recursive scanner over the source. Comments become a single space; string, template
// and regex literals become empty placeholders; every string literal is kept beside its
// offset in the emitted code so import specifiers can be read back. Template substitutions
// and JSX `{}` expressions are scanned by the same loop with the same rules.
//
// In JSX files the scanner tracks tags: a `<Tag` that follows a token which cannot end an
// expression opens a tag; attributes are lexed as code; between an opening tag and its
// closing tag the content is text, where quotes, slashes and comment markers mean nothing
// and nothing is emitted, so copy can neither hide an element nor fake a call. Tags are
// emitted as `<Name` so renderer and glass tags stay visible.
//
// Two ambiguities a lexer cannot settle from syntax alone are settled by rules: a quote right
// after an identifier character (`Don't`) or with no closing quote on its line is an
// apostrophe; a slash is a regex start when the previous significant token cannot end an
// expression (an operator, an opening bracket, a keyword that is not a property, or a `)`
// that closed an `if`, `while`, `for` or `with` condition).
const REGEX_PREV_CHARS = new Set(['(', ',', '=', ':', '[', '!', '&', '|', '?', '{', '}', ';', '+', '-', '*', '%', '>', '~', '^']);
const REGEX_PREV_WORDS = new Set(['return', 'typeof', 'case', 'do', 'else', 'in', 'of', 'instanceof', 'new', 'delete', 'void', 'throw', 'yield', 'await']);
const CONTROL_WORDS = /(?<![\w$])(?:if|while|for|with)\s*$/;
const PROPERTY_BEFORE_RE = /\.\s*(?:if|while|for|with)\s*$/;
const TAG_PREV_CHARS = new Set(['(', ',', '=', ':', '[', '!', '&', '|', '?', '{', '}', ';', '>', '+', '-', '*', '%', '~', '^']);
const TAG_PREV_WORDS = new Set(['return', 'case', 'do', 'else', 'yield', 'await', 'in', 'of']);
// The identifier is matched whole (no backtracking into a shorter name) before the generic check.
const TAG_START_RE = /^<(?:>|\/|[A-Za-z_$][\w$.:-]*(?![\w$.:-])(?!\s*(?:,|extends\b)))/;

export function lex(text, { jsx = false } = {}) {
  const strings = [];
  const issues = [];
  const parens = [];
  let lastCloseWasControl = false;
  let code = '';
  const n = text.length;

  function lastToken() {
    return code.replace(/\s+$/, '');
  }

  function regexCanStart() {
    const t = lastToken();
    if (!t) return true;
    const last = t[t.length - 1];
    if (last === ')') return lastCloseWasControl;
    if (last === '<') return false;
    if (t.endsWith('++') || t.endsWith('--')) return false;
    if (REGEX_PREV_CHARS.has(last)) return true;
    const word = t.match(/([A-Za-z_$][\w$]*)$/);
    if (!word || !REGEX_PREV_WORDS.has(word[1])) return false;
    return !/\.\s*$/.test(t.slice(0, -word[1].length));
  }

  function tagCanStart(i) {
    if (!jsx || !TAG_START_RE.test(text.slice(i, i + 64))) return false;
    const t = lastToken();
    if (!t) return true;
    const last = t[t.length - 1];
    if (TAG_PREV_CHARS.has(last)) return true;
    const word = t.match(/([A-Za-z_$][\w$]*)$/);
    return Boolean(word && TAG_PREV_WORDS.has(word[1]));
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

  // JSX element starting at `<`. Attributes are code; children are text until the matching
  // close. Returns the index after the element.
  function element(i) {
    const m = text.slice(i, i + 200).match(/^<(\/?)([A-Za-z_$][\w$.:-]*)?/);
    const closing = m[1] === '/';
    const name = m[2] ?? '';
    code += closing ? '</' + name : '<' + name;
    let j = i + m[0].length;
    let selfClosing = false;
    // attributes
    while (j < n) {
      const ch = text[j];
      if (ch === '/' && text[j + 1] === '>') { selfClosing = true; j += 2; code += ' />'; break; }
      if (ch === '>') { j += 1; code += '>'; break; }
      if (ch === '"' || ch === "'") {
        const s = quoted(j, ch);
        if (s.closed) { strings.push({ at: code.length, value: s.value, template: false }); code += ch + ch; j = s.end; continue; }
      }
      if (ch === '{') { code += '{'; j = scan(j + 1, 'brace'); code += '}'; continue; }
      if (ch === '/' && text[j + 1] === '/') { while (j < n && text[j] !== '\n') j += 1; continue; }
      if (ch === '/' && text[j + 1] === '*') { const e = text.indexOf('*/', j + 2); j = e === -1 ? n : e + 2; continue; }
      code += ch;
      j += 1;
    }
    if (closing || selfClosing) return j;
    // children: text, nested elements, expressions
    while (j < n) {
      const ch = text[j];
      if (ch === '{') { code += ' {'; j = scan(j + 1, 'brace'); code += '} '; continue; }
      if (ch === '<') {
        if (text[j + 1] === '/') {
          const close = text.slice(j, j + 200).match(/^<\/([A-Za-z_$][\w$.:-]*)?\s*>/);
          if (close) { code += '</' + (close[1] ?? '') + '>'; return j + close[0].length; }
        }
        if (text.startsWith('<!--', j)) { const e = text.indexOf('-->', j + 4); j = e === -1 ? n : e + 3; continue; }
        j = element(j);
        continue;
      }
      j += 1;
    }
    issues.push(`unterminated JSX element <${name}>`);
    return n;
  }

  // Scans from i. Mode 'brace' returns after the `}` that closes the expression it started
  // in; mode 'top' returns at the end.
  function scan(i, mode) {
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
      if (c === '<' && tagCanStart(i)) {
        i = element(i);
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
      if (mode === 'brace') {
        if (c === '{') depth += 1;
        else if (c === '}') {
          if (depth === 0) return i + 1;
          depth -= 1;
        }
      }
      if (c === '(') parens.push(CONTROL_WORDS.test(code) && !PROPERTY_BEFORE_RE.test(code));
      else if (c === ')') lastCloseWasControl = parens.pop() ?? false;
      code += c;
      i += 1;
    }
    if (mode === 'brace') issues.push('unterminated expression');
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
        j = scan(j + 2, 'brace');
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

  scan(0, 'top');
  return { code, strings, issues };
}

const lexCache = new Map();
function lexed(file) {
  if (!lexCache.has(file)) {
    const ext = extname(file);
    lexCache.set(file, JS_EXT.has(ext) ? lex(read(file), { jsx: JSX_EXT.has(ext) }) : { code: stripStyleComments(read(file)), strings: [], issues: [] });
  }
  return lexCache.get(file);
}
function stripStyleComments(text) {
  return text.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/<!--[\s\S]*?-->/g, ' ');
}
const code = (file) => lexed(file).code;

// Import and re-export specifiers. A pure template specifier counts; any other loading
// expression (`import(name)`, `import('../x/' + name)`, `require(require.resolve(…))`) is
// reported as dynamic so coverage fails closed. Type-only forms are dropped; a default or
// namespace binding beside type names keeps the import.
// The last `n` non-whitespace characters before `at` (whitespace runs collapsed to one space),
// and the first `n` after, so no amount of spacing changes how a clause reads.
function tokensBefore(src, at, n) {
  let out = '';
  let count = 0;
  let j = at;
  while (j > 0 && count < n) {
    j -= 1;
    const ch = src[j];
    if (/\s/.test(ch)) { if (!out.startsWith(' ')) out = ' ' + out; continue; }
    out = ch + out;
    count += 1;
  }
  return out.replace(/^ /, '').replace(/ $/, '');
}
function tokensAfter(src, at, n) {
  let out = '';
  let count = 0;
  let j = at;
  while (j < src.length && count < n) {
    const ch = src[j];
    j += 1;
    if (/\s/.test(ch)) { if (!out.endsWith(' ')) out += ' '; continue; }
    out += ch;
    count += 1;
  }
  return out.replace(/^ /, '');
}

export function importsOf(file) {
  const { code: src, strings } = lexed(file);
  const out = [];
  let dynamic = 0;
  for (const s of strings) {
    const before = tokensBefore(src, s.at, 64);
    let kind = null;
    if (/\bfrom$/.test(before)) kind = 'from';
    else if (/(?<![\w$.])import$/.test(before)) kind = 'side-effect';
    else if (/(?<![\w$.])(?:import|require) ?\($/.test(before)) kind = 'call';
    if (!kind) continue;
    if (kind === 'call' && !/^[,)]/.test(tokensAfter(src, s.at + 2, 4))) { dynamic += 1; continue; }
    if (s.template) {
      if (s.pure) out.push(s.value);
      else dynamic += 1;
      continue;
    }
    if (kind === 'from') {
      const start = statementStart(file, s.at);
      const stmt = start === -1 ? '' : src.slice(start, s.at);
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
  for (const m of src.matchAll(/\b(?:import|require)\s*\(\s*([^\s'"`)])/g)) if (m[1]) dynamic += 1;
  return Object.assign(out, { dynamic });
}

// --- renderer bindings ----------------------------------------------------------------------
// For one module: which local names denote a renderer constructor, tag or call, and which of
// its exports do. Bindings come from GPU-package imports (named, aliased, namespace), from
// local modules through `resolveLocal` (named, default, namespace, re-exports, `export *`,
// separate import-then-export, `export default X`), and from up to two variable bindings.
// Propagation is bounded; hitting the bound is reported through `state` as a coverage gap,
// never a silent pass.
const RENDERER_KINDS = { ctor: new Set(RENDERER_CTORS), tag: new Set(RENDERER_TAGS), call: new Set(RENDERER_CALLS) };
const bindingCache = new Map();

// Positions of the `import` and `export` keywords as whole tokens, never substrings of an
// identifier such as `ReexportedScene`. Shared by every clause reader.
const keywordCache = new Map();
function keywordPositions(file) {
  if (!keywordCache.has(file)) {
    keywordCache.set(file, [...code(file).matchAll(/(?<![\w$.])(?:import|export)(?![\w$])/g)].map((m) => m.index));
  }
  return keywordCache.get(file);
}
function statementStart(file, at) {
  const positions = keywordPositions(file);
  let lo = 0;
  let hi = positions.length - 1;
  let found = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (positions[mid] < at) { found = positions[mid]; lo = mid + 1; } else hi = mid - 1;
  }
  return found;
}

// Every `import … from`, `export … from` statement of a module, read whole: the statement
// starts at the nearest `import` or `export` token before the specifier, however long the
// clause is. Combined default-plus-namespace (`import Scene, * as NS from`) is one statement.
function importStatements(file) {
  const { code: src, strings } = lexed(file);
  const out = [];
  for (const s of strings) {
    if (s.template) continue;
    const before = src.slice(0, s.at);
    if (!/\bfrom\s*$/.test(before)) continue;
    const start = statementStart(file, s.at);
    if (start === -1) continue;
    const stmt = before.slice(start).replace(/\s+/g, ' ');
    if (/^(?:import|export) type\b/.test(stmt)) continue;
    const kind = stmt.startsWith('export') ? 'export' : 'import';
    const star = stmt.match(/(?:^(?:import|export)\s*|,\s*)\*\s*(?:as\s+([A-Za-z_$][\w$]*))?\s*from/);
    const def = stmt.match(/^import\s+([A-Za-z_$][\w$]*)\s*(?:,|from)/);
    const named = stmt.match(/\{([^}]*)\}/);
    const pairs = [];
    if (named) {
      for (const spec of named[1].split(',')) {
        const m = spec.trim().match(/^(?:type\s+)?([A-Za-z_$][\w$]*)(?:\s+as\s+([A-Za-z_$][\w$]*|default))?$/);
        if (m) pairs.push([m[1], m[2] ?? m[1]]);
      }
    }
    out.push({ kind, spec: s.value, star: Boolean(star), ns: star ? star[1] ?? null : null, def: def ? def[1] : null, pairs });
  }
  return out;
}

const kindOf = (name) => { for (const [k, set] of Object.entries(RENDERER_KINDS)) if (set.has(name)) return k; return null; };

// An assignment that binds a whole expression, declared (`const R = GL;`, `export const R =
// GL;`) or a class field (`R = GL;`), never a prefix of a longer expression
// (`NS.Scene.displayName || 'div'`).
const BINDING_RE = /(?:^|[;{}\n])\s*(?:export\s+)?(?:(?:const|let|var|readonly|static|private|public|protected)\s+)*([A-Za-z_$][\w$]*)\s*(?::\s*[\w$.<>\[\]|&, ]+)?\s*(?<![=!<>])=(?!=)\s*([A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*)\s*(?=;|\r?\n|$|\})/gm;
const DESTRUCTURE_RE = /\{([^}]*)\}\s*=\s*([A-Za-z_$][\w$]*)\s*(?=;|\r?\n|$)/gm;

// One module's bindings given a lookup for its dependencies' exports. Pure in the lookup, so
// the solver below can call it repeatedly until the component is stable.
function computeBindings(file, deps, lookup) {
  const local = new Map();
  const exports = new Map();
  const { code: src, strings } = lexed(file);
  const resolved = importStatements(file).map((st) => {
    const gpu = GPU_PACKAGES.test(st.spec);
    const target = gpu ? null : deps.get(st.spec) ?? null;
    const inner = target ? lookup(target) : null;
    return { st, gpu, inner };
  });
  const originKind = (gpu, inner, name) => (gpu ? kindOf(name) : inner ? inner.exports.get(name) ?? null : null);
  // Imports first, so later re-exports and bindings can see them.
  for (const { st, gpu, inner } of resolved) {
    if (st.kind !== 'import') continue;
    if (st.star && st.ns) {
      if (gpu) for (const [k, set] of Object.entries(RENDERER_KINDS)) for (const n of set) local.set(`${st.ns}.${n}`, k);
      else if (inner) for (const [e, k] of inner.exports) local.set(`${st.ns}.${e}`, k);
    }
    if (st.def) { const k = originKind(gpu, inner, 'default'); if (k) local.set(st.def, k); }
    for (const [origin, bound] of st.pairs) { const k = originKind(gpu, inner, origin); if (k) local.set(bound, k); }
  }
  // `const Scene = dynamic(() => import('pkg').then(m => m.Canvas))` and React.lazy: the
  // loaded member (or the default export) binds the declared name. Supported callbacks:
  // none (default export), `m => m.Member`, `({ Member }) => Member`, `({ Member: X }) => X`.
  // Any other `.then` shape is recorded as unsupported, which the solver reports as a gap.
  const unsupported = new Set();
  for (const s of strings) {
    if (s.template) continue;
    const before = tokensBefore(src, s.at, 200);
    if (!/(?<![\w$.])import ?\($/.test(before)) continue;
    const decl = before.match(/([A-Za-z_$][\w$]*) ?= ?(?:[A-Za-z_$][\w$]* ?\. ?)?(?:dynamic|lazy) ?\( ?(?:async ?)?\(? ?\)? ?=> ?import ?\($/);
    if (!decl) continue;
    const after = tokensAfter(src, s.at + 2, 200);
    let member = 'default';
    if (/^\) ?\. ?then ?\(/.test(after)) {
      const plain = after.match(/^\) ?\. ?then ?\( ?(?:async ?)?\(? ?([A-Za-z_$][\w$]*) ?\)? ?=> ?\(? ?\1 ?\. ?([A-Za-z_$][\w$]*)/);
      const destructured = after.match(/^\) ?\. ?then ?\( ?(?:async ?)?\( ?\{ ?([^}]*)\} ?\) ?=> ?\(? ?([A-Za-z_$][\w$]*)/);
      if (plain) member = plain[2];
      else if (destructured) {
        const picked = destructured[1].split(',').map((x) => x.trim()).map((x) => x.match(/^([A-Za-z_$][\w$]*)(?: ?: ?([A-Za-z_$][\w$]*))?$/)).find((m) => m && (m[2] ?? m[1]) === destructured[2]);
        if (picked) member = picked[1];
        else { unsupported.add(decl[1]); continue; }
      } else { unsupported.add(decl[1]); continue; }
    }
    const gpu = GPU_PACKAGES.test(s.value);
    const target = gpu ? null : deps.get(s.value) ?? null;
    const k = originKind(gpu, target ? lookup(target) : null, member);
    if (k) local.set(decl[1], k);
  }
  // Variable, class-field and destructuring bindings, two passes for one extra hop.
  for (let pass = 0; pass < 2; pass += 1) {
    for (const m of src.matchAll(BINDING_RE)) {
      const k = local.get(m[2]) ?? (m[2].includes('.') ? null : kindOf(m[2]));
      if (k && !local.has(m[1])) local.set(m[1], k);
    }
    for (const m of src.matchAll(DESTRUCTURE_RE)) {
      for (const spec of m[1].split(',')) {
        const p = spec.trim().match(/^([A-Za-z_$][\w$]*)(?:\s*:\s*([A-Za-z_$][\w$]*))?$/);
        if (!p) continue;
        const k = local.get(`${m[2]}.${p[1]}`);
        if (k) local.set(p[2] ?? p[1], k);
      }
    }
  }
  // Exports last, so they can name anything bound above. Star exports go in first; an
  // explicit export of the same name wins, as the language rules. Two stars that disagree on
  // a name make it ambiguous in the language and a conflict here.
  const conflicts = new Set();
  for (const { st, gpu, inner } of resolved) {
    if (st.kind !== 'export' || !st.star || st.ns) continue;
    const entries = gpu ? [...Object.entries(RENDERER_KINDS)].flatMap(([k, set]) => [...set].map((n) => [n, k])) : inner ? [...inner.exports] : [];
    for (const [e, k] of entries) {
      if (exports.has(e) && exports.get(e) !== k) conflicts.add(e);
      else exports.set(e, k);
    }
  }
  for (const { st, gpu, inner } of resolved) {
    if (st.kind !== 'export') continue;
    if (st.star && st.ns) {
      if (gpu) for (const [k, set] of Object.entries(RENDERER_KINDS)) for (const n of set) exports.set(`${st.ns}.${n}`, k);
      else if (inner) for (const [e, k] of inner.exports) exports.set(`${st.ns}.${e}`, k);
    }
    for (const [origin, bound] of st.pairs) { const k = originKind(gpu, inner, origin); if (k) { exports.set(bound, k); conflicts.delete(bound); } }
  }
  for (const m of src.matchAll(/\bexport\s*\{([^}]*)\}\s*(?!from)/g)) {
    for (const spec of m[1].split(',')) {
      const p = spec.trim().match(/^([A-Za-z_$][\w$]*)(?:\s+as\s+([A-Za-z_$][\w$]*|default))?$/);
      if (p && local.has(p[1])) { exports.set(p[2] ?? p[1], local.get(p[1])); conflicts.delete(p[2] ?? p[1]); }
    }
  }
  for (const m of src.matchAll(/\bexport\s+(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=/g)) {
    if (local.has(m[1])) { exports.set(m[1], local.get(m[1])); conflicts.delete(m[1]); }
  }
  const dm = src.match(/\bexport\s+default\s+([A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*)\s*;?/);
  if (dm && local.has(dm[1])) exports.set('default', local.get(dm[1]));
  for (const e of conflicts) exports.delete(e);
  for (const u of unsupported) conflicts.add(`dynamic:${u}`);
  return { local, exports, conflicts };
}

// Bindings of one module, solved per dependency component. The component is every module
// reachable from `file` through local import and re-export edges that is not yet cached,
// bounded in size; it is solved by a worklist fixpoint that compares binding entries, so
// cycles converge to the same answer whichever module is asked first, and each module is
// computed at most once per iteration. A component that does not converge, or exceeds the
// bound, is a coverage gap for every module in it.
const COMPONENT_LIMIT = 2000;
const FIXPOINT_ITERATIONS = 16;
const EMPTY = { local: new Map(), exports: new Map() };
const depsCache = new Map();
function depsOf(file, resolveLocal) {
  const key = norm(file);
  if (!depsCache.has(key)) {
    // Static statements and literal dynamic imports alike are binding edges.
    const map = new Map();
    for (const spec of [...importStatements(file).map((st) => st.spec), ...importsOf(file)]) {
      if (GPU_PACKAGES.test(spec) || map.has(spec)) continue;
      const target = resolveLocal ? resolveLocal(spec, file) : null;
      if (target) map.set(spec, target);
    }
    depsCache.set(key, map);
  }
  return depsCache.get(key);
}

function sameBindings(a, b) {
  const ac = a.conflicts ?? new Set();
  const bc = b.conflicts ?? new Set();
  if (a.local.size !== b.local.size || a.exports.size !== b.exports.size || ac.size !== bc.size) return false;
  for (const [k, v] of a.local) if (b.local.get(k) !== v) return false;
  for (const [k, v] of a.exports) if (b.exports.get(k) !== v) return false;
  for (const c of ac) if (!bc.has(c)) return false;
  return true;
}

export function rendererBindings(file, resolveLocal, state) {
  const key = norm(file);
  if (bindingCache.has(key)) return bindingCache.get(key);
  const component = new Map([[key, file]]);
  const queue = [file];
  let overflow = false;
  while (queue.length) {
    const f = queue.shift();
    for (const target of depsOf(f, resolveLocal).values()) {
      const tk = norm(target);
      if (bindingCache.has(tk) || component.has(tk)) continue;
      if (component.size >= COMPONENT_LIMIT) { overflow = true; break; }
      component.set(tk, target);
      queue.push(target);
    }
    if (overflow) break;
  }
  const current = new Map([...component.keys()].map((k) => [k, EMPTY]));
  const lookup = (target) => bindingCache.get(norm(target)) ?? current.get(norm(target)) ?? EMPTY;
  let converged = false;
  if (!overflow) {
    for (let i = 0; i < FIXPOINT_ITERATIONS && !converged; i += 1) {
      converged = true;
      for (const [k, f] of component) {
        const next = computeBindings(f, depsOf(f, resolveLocal), lookup);
        if (!sameBindings(next, current.get(k))) { converged = false; current.set(k, next); }
      }
    }
  }
  const conflicted = [...component].filter(([k]) => current.get(k).conflicts?.size);
  if (!converged || conflicted.length) {
    const flagged = converged ? conflicted.map(([, f]) => f) : [...component.values()];
    for (const f of flagged) state?.propagationCut?.add(relative(state.root ?? '', f));
    if (converged) for (const [k, v] of current) if (!v.conflicts?.size) bindingCache.set(k, v);
    return current.get(key);
  }
  for (const [k, v] of current) bindingCache.set(k, v);
  return bindingCache.get(key);
}

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// A renderer expression in one module: `new X()`, `<X>` or `X()` where X is a bound renderer
// name, with or without a namespace prefix, including package names used directly.
export function hasRendererExpression(file, resolveLocal = null, state = null) {
  const { code: src } = lexed(file);
  const { local } = rendererBindings(file, resolveLocal, state);
  const names = { ctor: new Set(RENDERER_CTORS), tag: new Set(RENDERER_TAGS), call: new Set(RENDERER_CALLS) };
  for (const [name, kind] of local) names[kind].add(name);
  const alt = (set) => [...set].map(escapeRe).join('|');
  const tag = `(?:[A-Za-z_$][\\w$]*\\.)?(?:${alt(names.tag)})\\b`;
  // A tag mounts through JSX or through element creation: createElement, jsx, jsxs, jsxDEV, h.
  return new RegExp(`new\\s+(?:[A-Za-z_$][\\w$]*\\.)?(?:${alt(names.ctor)})\\b|<${tag}|(?<![\\w$.])(?:[A-Za-z_$][\\w$]*\\.)?(?:createElement|jsxs?|jsxDEV|h)\\s*\\(\\s*${tag}|(?<![\\w$.])(?:${alt(names.call)})\\s*\\(`).test(src);
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

// TypeScript ESM writes `./x.js` for a `./x.ts` source; both spellings are tried.
const TS_REMAP = { '.js': ['.ts', '.tsx'], '.jsx': ['.tsx'], '.mjs': ['.mts'], '.cjs': ['.cts'] };
function resolveModule(root, base) {
  if (!insideRoot(root, base) || pathHasLink(root, base)) return null;
  const ext = extname(base);
  const remapped = (TS_REMAP[ext] ?? []).map((e) => base.slice(0, -ext.length) + e);
  for (const candidate of remapped.map((c) => resolve(c))) {
    let st;
    try { st = lstatSync(candidate); } catch { continue; }
    if (st.isFile()) return candidate;
  }
  for (const ext of ['', '.tsx', '.ts', '.jsx', '.js', '.mjs', '.mts', '.cjs', '.cts', '/index.tsx', '/index.ts', '/index.js']) {
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
const isBuiltin = (spec) => spec.startsWith('node:') || BUILTINS.has(packageName(spec)) || FRAMEWORK_VIRTUAL.has(spec);

// Package lookup the way Node does it: the nearest node_modules walking up from the importing
// file to the root, each checked for a top-level entry or a pnpm store entry. Returns
// 'found', 'missing' (an install exists but lacks the package) or 'no-install'.
const storeCache = new Map();
function packageStoreAt(nm) {
  if (!storeCache.has(nm)) {
    if (!existsSync(nm)) storeCache.set(nm, null);
    else {
      let pnpm = [];
      try { pnpm = readdirSync(join(nm, '.pnpm')); } catch { pnpm = []; }
      storeCache.set(nm, { has: (name) => existsSync(join(nm, name)) || pnpm.some((e) => e.startsWith(name.replace('/', '+') + '@')) });
    }
  }
  return storeCache.get(nm);
}
function packageStatus(root, fromFile, name) {
  let dir = dirname(fromFile);
  let sawInstall = false;
  for (;;) {
    const store = packageStoreAt(join(dir, 'node_modules'));
    if (store) { sawInstall = true; if (store.has(name)) return 'found'; }
    // A nested project with its own package.json and no node_modules was never installed;
    // its packages cannot be judged missing from the root's install.
    else if (dir !== root && existsSync(join(dir, 'package.json'))) return 'no-install';
    if (dir === root || !insideRoot(root, dir)) break;
    dir = dirname(dir);
  }
  return sawInstall ? 'missing' : 'no-install';
}

// With `onlySpec`, resolves one specifier for renderer-name propagation and records no gaps:
// only the route graph decides what counts as missing.
function localImports(root, file, aliases, state, onlySpec = null) {
  const out = [];
  const specs = onlySpec === null ? importsOf(file) : [onlySpec];
  if (onlySpec !== null) state = { unresolved: new Set(), unverified: new Set(), dynamic: new Map(), depthCut: 0 };
  if (onlySpec === null && specs.dynamic) state.dynamic.set(relative(root, file), specs.dynamic);
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
        const status = packageStatus(root, file, name);
        if (status === 'no-install') state.unverified.add(name);
        else if (status === 'missing') state.unresolved.add(spec);
        continue;
      }
    }
    const hit = candidates.map((c) => resolveModule(root, c)).find(Boolean);
    if (hit) out.push(hit);
    else state.unresolved.add(spec);
  }
  return out;
}

// Transitive closure of local imports from a set of entries. Every reachable file counts,
// whether or not its directory name looked like test or fixture code.
function closure(root, entries, aliases, state) {
  const seen = new Map();
  let frontier = [];
  for (const e of entries) if (!seen.has(norm(e))) { seen.set(norm(e), e); frontier.push(e); }
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

// Next.js conventions. App Router: page, layout, template and default files; `(group)` adds no
// segment; a slot subtree (including an intercepting `(.)seg`) takes its parent's key. Pages
// Router: every file under pages/ except _app, _document and api/, with _app as the layout.
const APP_ROUTE_FILE_RE = /(^|[\\/])(page|layout|template|default)\.(tsx|jsx|ts|js)$/;
const PAGES_DIR_RE = /^(?:src[\\/])?pages[\\/]/;
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

// Pages Router: every page plus `_error`, `404` and `500` (they ship), each composed with
// `_app`; `_document` renders no components of its own.
function pagesRouterRoutes(root, files) {
  const pageFiles = files.filter((f) => isJs(f) && PAGES_DIR_RE.test(relative(root, f)) && !/[\\/]api[\\/]/.test(relative(root, f)));
  const app = pageFiles.filter((f) => /[\\/]_app\.[cm]?[jt]sx?$/.test(f));
  const pages = pageFiles.filter((f) => !/[\\/]_(app|document)\.[cm]?[jt]sx?$/.test(f));
  return pages.map((p) => ({ key: relative(root, p).replace(/\\/g, '/').replace(/\.[cm]?[jt]sx?$/, ''), entries: [p, ...app], alternatives: [] }));
}

// A route's render set: its own files, every ancestor layout and template, and for every
// slot of every ancestor the slot's always-on files (layouts, templates) plus one of its
// alternatives (a page or, when none matched, the default), choosing the alternative that
// reaches the most renderers so a false pass is never the result of picking the quiet one.
function appRouterRoutes(root, files) {
  const routeFiles = files.filter((f) => APP_ROUTE_FILE_RE.test(f));
  const groups = new Map();
  for (const f of routeFiles) {
    const key = routeKey(root, f);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(f);
  }
  const routes = [];
  for (const [key, members] of groups) {
    const base = members.filter((f) => !/[\\/]@[^\\/]+[\\/]/.test(relative(root, f)));
    if (!base.some((f) => /(^|[\\/])page\./.test(f))) continue;
    const entries = new Set(base);
    const slots = new Map();
    for (const m of base) {
      let dir = dirname(m);
      for (;;) {
        for (const f of routeFiles) {
          if (f === m) continue;
          const fdir = dirname(f);
          if (fdir === dir && /(^|[\\/])(layout|template)\./.test(f)) entries.add(f);
          else if (fdir.startsWith(dir + sep + '@')) {
            const slotRoot = fdir.slice(0, fdir.indexOf(sep, dir.length + 1) === -1 ? fdir.length : fdir.indexOf(sep, dir.length + 1));
            if (!slots.has(slotRoot)) slots.set(slotRoot, { always: new Set(), pages: [], defaults: [] });
            const slot = slots.get(slotRoot);
            if (/(^|[\\/])(layout|template)\./.test(f)) slot.always.add(f);
            else if (/(^|[\\/])page\./.test(f)) slot.pages.push(f);
            else slot.defaults.push(f);
          }
        }
        if (dir === root || !insideRoot(root, dir)) break;
        dir = dirname(dir);
      }
    }
    const alternatives = [];
    for (const slot of slots.values()) {
      for (const f of slot.always) entries.add(f);
      const options = slot.pages.length ? [...slot.pages.map((p) => [p]), slot.defaults] : [slot.defaults];
      alternatives.push(options.filter((o) => o.length));
    }
    routes.push({ key: '/' + key, entries: [...entries], alternatives });
  }
  return routes;
}

export function checkGpuSurfaces(root, files) {
  const aliases = readAliases(root);
  const state = { unresolved: new Set(), unverified: new Set(), dynamic: new Map(), depthCut: 0, comboCut: new Set() };
  bindingCache.clear();
  depsCache.clear();
  keywordCache.clear();
  // A renderer module has a renderer expression and reaches a GPU package directly or through
  // a local barrel. Evaluated for every file the route graph reaches, product or not.
  const gpuCache = new Map();
  const isGpuDirect = (f) => {
    const k = norm(f);
    if (!gpuCache.has(k)) gpuCache.set(k, isJs(f) && importsOf(f).some((s) => GPU_PACKAGES.test(s)));
    return gpuCache.get(k);
  };
  const gpuDirect = new Map();
  for (const f of files) if (isGpuDirect(f)) gpuDirect.set(norm(f), f);
  // Local resolution for renderer-name propagation through barrels; it shares the gap state so
  // an unresolved barrel is a coverage error like any other import.
  const resolveLocal = (spec, from) => {
    const hits = localImports(root, from, aliases, state, spec);
    return hits[0] ?? null;
  };
  state.propagationCut = new Set();
  state.root = root;
  const rendererCache = new Map();
  const isRendererModule = (f) => {
    const k = norm(f);
    if (rendererCache.has(k)) return rendererCache.get(k);
    let result = false;
    if (isJs(f) && hasRendererExpression(f, resolveLocal, state)) {
      result = isGpuDirect(f) || [...closure(root, [f], aliases, state).values()].some(isGpuDirect);
    }
    rendererCache.set(k, result);
    return result;
  };
  const routes = [...appRouterRoutes(root, files), ...pagesRouterRoutes(root, files)];
  const offenders = [];
  const reachedRenderers = new Map();
  const reached = new Map();
  const COMBO_LIMIT = 256;
  for (const route of routes) {
    const base = closure(root, route.entries, aliases, state);
    // Every alternative ships (a full reload renders a slot's default), so all of them join
    // the shipped set. The surface count takes the worst combination across slots.
    const optionClosures = route.alternatives.map((options) => options.map((option) => closure(root, option, aliases, state)));
    for (const options of optionClosures) for (const mods of options) for (const [k, m] of mods) reached.set(k, m);
    for (const [k, m] of base) reached.set(k, m);
    const combos = optionClosures.reduce((n, options) => n * Math.max(1, options.length), 1);
    let worst = { n: -1, mods: base };
    if (combos > COMBO_LIMIT) {
      state.comboCut.add(`${route.key} (${combos} slot combinations)`);
    } else {
      const walkCombos = (i, acc) => {
        if (i === optionClosures.length) {
          const n = [...acc.values()].filter(isRendererModule).length;
          if (n > worst.n) worst = { n, mods: acc };
          return;
        }
        const options = optionClosures[i].length ? optionClosures[i] : [new Map()];
        for (const mods of options) {
          const next = new Map(acc);
          for (const [k, m] of mods) next.set(k, m);
          walkCombos(i + 1, next);
        }
      };
      walkCombos(0, new Map(base));
    }
    const renderers = [...worst.mods.values()].filter(isRendererModule);
    for (const r of renderers) reachedRenderers.set(norm(r), r);
    if (renderers.length > 1) offenders.push(`${route.key} (${renderers.length} renderer modules: ${renderers.map((r) => relative(root, r)).join(', ')})`);
  }
  // Every renderer that ships owes lifecycle and poster: those in any route's alternatives,
  // and those in product files no route reaches (a library repo, a component package).
  const allRenderers = new Map(reachedRenderers);
  for (const f of [...reached.values(), ...files]) if (isJs(f) && isRendererModule(f)) allRenderers.set(norm(f), f);
  const noLifecycle = [];
  const noPoster = [];
  for (const f of allRenderers.values()) {
    const { code: src, strings } = lexed(f);
    const listens = strings.some((s) => s.value === 'visibilitychange' && /\baddEventListener\s*\(\s*$/.test(src.slice(Math.max(0, s.at - 40), s.at)));
    if (!LIFECYCLE_RE.test(src) && !listens) noLifecycle.push(relative(root, f));
    if (!POSTER_RE.test(src)) noPoster.push(relative(root, f));
  }
  for (const f of [...files, ...reached.values()]) if (isJs(f)) { const d = importsOf(f).dynamic; if (d) state.dynamic.set(relative(root, f), d); }
  const results = [];
  results.push(offenders.length
    ? { id: 'one-gpu-surface', level: 'error', ok: false, detail: `a route reaches more than one renderer module (static count; the runtime budget is the wrapper's job): ${listed(offenders)}` }
    : { id: 'one-gpu-surface', level: 'info', ok: true, detail: `${allRenderers.size} renderer module(s) among ${gpuDirect.size} GPU-importing module(s); no route reaches two (static count over ${routes.length} route(s))` });
  results.push(noLifecycle.length
    ? { id: 'gpu-lifecycle', level: 'error', ok: false, detail: `renderer modules with no IntersectionObserver or visibilitychange listener in code (word-level check; that it pauses is verified by eye): ${listed(noLifecycle)}` }
    : { id: 'gpu-lifecycle', level: 'info', ok: true, detail: 'every renderer module references visibility handling in code, or there are none; that it pauses is verified by eye' });
  results.push(noPoster.length
    ? { id: 'poster-first', level: 'warn', ok: false, detail: `renderer modules with no poster, fallback or noscript reference; the no-script still must be checked by eye: ${listed(noPoster)}` }
    : { id: 'poster-first', level: 'info', ok: true, detail: 'every renderer module names a poster or fallback; whether it paints first is checked by eye, not here' });
  const shipped = new Map(files.map((f) => [norm(f), f]));
  for (const [k, m] of reached) shipped.set(k, m);
  const lexIssues = [...shipped.values()].filter((f) => isJs(f) && lexed(f).issues.length).map((f) => `${relative(root, f)} (${lexed(f).issues[0]})`);
  const gaps = [];
  if (state.unresolved.size) gaps.push(`${state.unresolved.size} import specifier(s) unresolved (a local path, alias or package that is not where it should be): ${listed([...state.unresolved])}`);
  if (state.dynamic.size) gaps.push(`${state.dynamic.size} file(s) load a module through an expression the scanner cannot follow (import(name), import('../x/' + name), require(require.resolve(…)), a substituted template): ${listed([...state.dynamic.keys()])}`);
  if (state.depthCut) gaps.push(`${state.depthCut} module(s) beyond the ${IMPORT_DEPTH}-edge traversal limit`);
  if (state.propagationCut.size) gaps.push(`${state.propagationCut.size} module(s) whose bindings could not be followed (a component that did not converge within ${FIXPOINT_ITERATIONS} iterations, exceeded ${COMPONENT_LIMIT} modules, two star exports naming the same renderer differently, or a dynamic() / lazy() callback shape the scanner does not read): ${listed([...state.propagationCut])}`);
  if (state.comboCut.size) gaps.push(`route(s) with more than ${COMBO_LIMIT} slot combinations, not enumerated: ${listed([...state.comboCut])}`);
  if (aliases.dropped.length) gaps.push(`tsconfig: ${listed(aliases.dropped)}`);
  if (lexIssues.length) gaps.push(`${lexIssues.length} file(s) the lexer could not read to the end: ${listed(lexIssues)}`);
  const soft = state.unverified.size ? `${state.unverified.size} bare specifier(s) assumed to be packages because no node_modules exists: ${listed([...state.unverified])}` : '';
  results.push(gaps.length
    ? { id: 'coverage', level: 'error', ok: false, detail: `the route graph is incomplete, so the surface count above is not a pass: ${gaps.join('; ')}${soft ? '; ' + soft : ''}` }
    : soft
      ? { id: 'coverage', level: 'warn', ok: false, detail: `every local import resolved inside the scanned root; ${soft}` }
      : { id: 'coverage', level: 'info', ok: true, detail: 'every local import on every route resolved inside the scanned root and every package was found in node_modules' });
  return Object.assign(results, { shipped: [...shipped.values()] });
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
  storeCache.clear();
  let abs = resolve(root);
  try { abs = realpathSync(abs); } catch { /* an unresolvable root fails in walk() */ }
  const files = walk(abs).filter((f) => isJs(f) || isStyle(f) || FILTER_EXT.has(extname(f)) || /\.md$/i.test(f));
  const product = files.filter((f) => !EVIDENCE_RE.test(f) && !NON_SHIPPING_RE.test(relative(abs, f)));
  // The route graph decides what ships: a fixture a page imports is judged like any component.
  const gpu = checkGpuSurfaces(abs, product);
  const shipped = gpu.shipped;
  const checks = [
    checkDesignMd(abs),
    checkGlass(abs, shipped),
    ...gpu,
    checkMotionScore(abs, shipped, files),
    checkRawColour(abs, shipped),
  ];
  const errors = checks.filter((c) => c.level === 'error' && !c.ok).length;
  const warns = checks.filter((c) => c.level === 'warn' && !c.ok).length;
  return { root: abs, scanned: product.length, checks, errors, warns, pass: errors === 0 };
}

export function renderMarkdown(result) {
  const lines = [`# Materials gate: ${result.pass ? 'PASS' : 'FAIL'}`, '', `Root: ${result.root} (${result.scanned} shipping files scanned; tests, fixtures and .studio prototypes excluded unless a shipped file imports them)`, ''];
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
