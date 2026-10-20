#!/usr/bin/env node
// peer-check.mjs — unmet peer dependencies and version drift for a web repo's
// front-end packages, read from the lockfile and checked against the npm registry.
//
//   node peer-check.mjs [--root .] [--watch a,b,c] [--all] [--json]
//
// --root     the package directory (for a monorepo app: apps/web). The lockfile
//            is found by walking up from it.
// --watch    comma list of packages whose peers and drift are checked. Defaults
//            to the front-end set below. --all checks every direct dependency.
//
// No dependencies and no install step. It reads package.json plus
// pnpm-lock.yaml, package-lock.json, or node_modules, then asks
// registry.npmjs.org for each watched package's peers at the resolved version
// and for its latest version.
//
// Exit 0 = no unmet peers, 1 = unmet peers found, 2 = usage or read error,
// 3 = registry unreachable (nothing was checked; report that, never a pass).

import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

export const DEFAULT_WATCH = [
  'react', 'react-dom', 'next', '@types/react',
  'three', '@types/three', '@react-three/fiber', '@react-three/drei',
  '@react-three/postprocessing', 'postprocessing',
  '@paper-design/shaders-react', '@shadergradient/react',
  'gsap', '@gsap/react', 'lenis', 'framer-motion', 'motion', 'tailwindcss',
];

// ------------------------------------------------------------------ semver
// The subset npm peer ranges use: ^ ~ >= > <= < =, x-ranges, hyphen ranges, ||.

export function parseVersion(v) {
  const m = String(v).trim().replace(/^v/, '').match(/^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?/);
  return m ? { t: [+m[1], +m[2], +m[3]], pre: m[4] || null } : null;
}

function cmp(a, b) {
  for (let i = 0; i < 3; i++) if (a.t[i] !== b.t[i]) return a.t[i] - b.t[i];
  if (a.pre && !b.pre) return -1;
  if (!a.pre && b.pre) return 1;
  return 0;
}

const isWild = (p) => p === undefined || p === 'x' || p === 'X' || p === '*';

// A partial like "19", "19.4", "1.x" → its parts, with nulls for wildcards.
function partial(s) {
  const [core] = s.split('-');
  const parts = core.split('.');
  const nums = [0, 1, 2].map((i) => (isWild(parts[i]) ? null : Number(parts[i])));
  if (nums.some((n) => n !== null && Number.isNaN(n))) return null;
  for (let i = 1; i < 3; i++) if (nums[i - 1] === null) nums[i] = null;
  return { nums, pre: s.includes('-') ? s.slice(s.indexOf('-') + 1) : null };
}

const V = (a, b, c, pre = null) => ({ t: [a, b, c], pre });

// One comparator → list of [op, version] bounds (all must hold).
function bounds(comp) {
  if (comp === '' || comp === '*' || comp === 'x' || comp === 'X') return [];
  const m = comp.match(/^(\^|~|>=|<=|>|<|=)?(.+)$/);
  if (!m) return null;
  const op = m[1] || '';
  const p = partial(m[2]);
  if (!p) return null;
  const [M, mi, pa] = p.nums;
  if (M === null) return op === '<' || op === '>' ? [['<', V(0, 0, 0)]] : [];
  const lo = V(M, mi ?? 0, pa ?? 0, p.pre);
  if (op === '^') {
    if (M > 0 || mi === null) return [['>=', lo], ['<', V(M + 1, 0, 0)]];
    if (mi > 0 || pa === null) return [['>=', lo], ['<', V(0, mi + 1, 0)]];
    return [['>=', lo], ['<', V(0, 0, pa + 1)]];
  }
  if (op === '~') return mi === null ? [['>=', lo], ['<', V(M + 1, 0, 0)]] : [['>=', lo], ['<', V(M, mi + 1, 0)]];
  // Next value above a partial: "19" → 20.0.0, "19.4" → 19.5.0.
  const next = mi === null ? V(M + 1, 0, 0) : pa === null ? V(M, mi + 1, 0) : null;
  if (op === '>=') return [['>=', lo]];
  if (op === '<') return [['<', lo]];
  if (op === '>') return next ? [['>=', next]] : [['>', lo]];
  if (op === '<=') return next ? [['<', next]] : [['<=', lo]];
  // "=" or bare: a full version is exact, a partial is an x-range.
  return next ? [['>=', lo], ['<', next]] : [['=', lo]];
}

function holds(v, [op, b]) {
  const c = cmp(v, b);
  return op === '>=' ? c >= 0 : op === '>' ? c > 0 : op === '<' ? c < 0 : op === '<=' ? c <= 0 : c === 0;
}

// true / false, or null when the range is not one this parser understands.
export function satisfies(version, range) {
  const v = parseVersion(version);
  if (!v) return null;
  const sets = String(range).split('||');
  let understood = false;
  for (let set of sets) {
    set = set.trim().replace(/(>=|<=|>|<|=|\^|~)\s+/g, '$1');
    const hy = set.match(/^(\S+)\s+-\s+(\S+)$/);
    const comps = hy ? [`>=${hy[1]}`, `<=${hy[2]}`] : set.split(/\s+/).filter(Boolean);
    const all = [];
    let ok = true;
    for (const c of comps.length ? comps : ['*']) {
      const b = bounds(c);
      if (b === null) { ok = false; break; }
      all.push(...b);
    }
    if (!ok) continue;
    understood = true;
    // A prerelease only matches a range that names the same major.minor.patch with a prerelease.
    if (v.pre && !all.some(([, b]) => b.pre && b.t.join('.') === v.t.join('.'))) continue;
    if (all.every((b) => holds(v, b))) return true;
  }
  return understood ? false : null;
}

export function classifyDrift(resolved, latest) {
  const a = parseVersion(resolved);
  const b = parseVersion(latest);
  if (!a || !b) return 'unknown';
  const c = cmp(a, b);
  if (c === 0) return 'current';
  if (c > 0) return 'ahead';
  if (a.t[0] !== b.t[0]) return 'major';
  if (a.t[0] === 0 && a.t[1] !== b.t[1]) return '0.x minor (breaking)';
  if (a.t[0] === 0 && a.t[1] === 0) return '0.0.x (breaking)';
  if (a.t[1] !== b.t[1]) return 'minor';
  return 'patch';
}

// --------------------------------------------------------------- lockfiles

// pnpm-lock.yaml v6–v9: importers → <importer> → dependencies/devDependencies/optionalDependencies.
export function readPnpmImporter(text, importer) {
  const lines = text.split(/\r?\n/);
  const out = {};
  const start = lines.indexOf('importers:');
  if (start === -1) return out;
  const want = importer === '.' ? ['.', "'.'"] : [importer, `'${importer}'`];
  let inImporter = false;
  let inDeps = false;
  let name = null;
  for (let i = start + 1; i < lines.length; i++) {
    const line = lines[i];
    if (/^\S/.test(line)) break; // next top-level key
    let m;
    if ((m = line.match(/^ {2}(\S.*):$/))) {
      inImporter = want.includes(m[1]);
      inDeps = false;
      continue;
    }
    if (!inImporter) continue;
    if ((m = line.match(/^ {4}(\w+):$/))) {
      inDeps = /^(dependencies|devDependencies|optionalDependencies)$/.test(m[1]);
      continue;
    }
    if (!inDeps) continue;
    if ((m = line.match(/^ {6}(\S.*):$/))) {
      name = m[1].replace(/^'|'$/g, '');
      continue;
    }
    if (name && (m = line.match(/^ {8}version: (.+)$/))) {
      const raw = m[1].trim().replace(/^'|'$/g, '');
      if (!/^(link|file|workspace):/.test(raw)) out[name] = raw.split('(')[0];
      name = null;
    }
  }
  return out;
}

function findUp(dir, file) {
  let d = resolve(dir);
  for (;;) {
    if (existsSync(join(d, file))) return d;
    const up = dirname(d);
    if (up === d) return null;
    d = up;
  }
}

export function resolveDirect(root) {
  const pkgPath = join(root, 'package.json');
  if (!existsSync(pkgPath)) throw new Error(`no package.json in ${root}`);
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
  const declared = { ...pkg.optionalDependencies, ...pkg.devDependencies, ...pkg.dependencies };
  const resolved = {};
  let source = 'declared ranges only';

  const pnpmDir = findUp(root, 'pnpm-lock.yaml');
  const npmDir = findUp(root, 'package-lock.json');
  if (pnpmDir) {
    const importer = relative(pnpmDir, resolve(root)).split(sep).join('/') || '.';
    Object.assign(resolved, readPnpmImporter(readFileSync(join(pnpmDir, 'pnpm-lock.yaml'), 'utf8'), importer));
    source = `pnpm-lock.yaml (importer ${importer})`;
  } else if (npmDir) {
    const lock = JSON.parse(readFileSync(join(npmDir, 'package-lock.json'), 'utf8'));
    const prefix = relative(npmDir, resolve(root)).split(sep).join('/');
    for (const name of Object.keys(declared)) {
      const entry = lock.packages?.[`${prefix ? prefix + '/' : ''}node_modules/${name}`] || lock.packages?.[`node_modules/${name}`];
      if (entry?.version) resolved[name] = entry.version;
    }
    source = 'package-lock.json';
  }
  for (const name of Object.keys(declared)) {
    if (resolved[name]) continue;
    const nm = join(root, 'node_modules', name, 'package.json');
    if (existsSync(nm)) resolved[name] = JSON.parse(readFileSync(nm, 'utf8')).version;
  }
  return { declared, resolved, source };
}

// ---------------------------------------------------------------- registry

const REGISTRY = 'https://registry.npmjs.org';

async function manifest(name, tag) {
  const res = await fetch(`${REGISTRY}/${name.replace('/', '%2f')}/${encodeURIComponent(tag)}`, {
    headers: { accept: 'application/json' },
    signal: AbortSignal.timeout(20_000),
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`registry answered ${res.status} for ${name}@${tag}`);
  return res.json();
}

async function pool(items, limit, fn) {
  const out = new Array(items.length);
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const i = next++;
      out[i] = await fn(items[i]);
    }
  }));
  return out;
}

export async function check(root, watch) {
  const { declared, resolved, source } = resolveDirect(root);
  const targets = watch.filter((n) => declared[n]);
  const rows = await pool(targets, 6, async (name) => {
    const version = resolved[name] || null;
    const [at, latest] = await Promise.all([
      version ? manifest(name, version) : null,
      manifest(name, 'latest'),
    ]);
    const peers = [];
    const meta = at?.peerDependenciesMeta || {};
    for (const [peer, range] of Object.entries(at?.peerDependencies || {})) {
      const have = resolved[peer];
      const optional = Boolean(meta[peer]?.optional);
      if (!have) {
        if (!optional) peers.push({ peer, range, have: null, ok: null, note: 'not a direct dependency' });
        continue;
      }
      peers.push({ peer, range, have, ok: satisfies(have, range), note: optional ? 'optional, installed' : '' });
    }
    return {
      name,
      declared: declared[name],
      resolved: version,
      latest: latest?.version || null,
      drift: version && latest?.version ? classifyDrift(version, latest.version) : 'unknown',
      peers,
    };
  });
  return { root: resolve(root), source, rows };
}

// -------------------------------------------------------------------- main

function arg(name, fallback = null) {
  const i = process.argv.indexOf(`--${name}`);
  if (i === -1) return fallback;
  const next = process.argv[i + 1];
  return next && !next.startsWith('--') ? next : true;
}

function render({ root, source, rows }) {
  const unmet = rows.flatMap((r) => r.peers.filter((p) => p.ok === false).map((p) => ({ ...p, of: `${r.name}@${r.resolved}` })));
  const unknown = rows.flatMap((r) => r.peers.filter((p) => p.ok === null).map((p) => ({ ...p, of: `${r.name}@${r.resolved}` })));
  const out = [`Root:   ${root}`, `Source: ${source}`, ''];
  out.push(`Unmet peers: ${unmet.length}`);
  for (const p of unmet) out.push(`  ✗ ${p.of} needs ${p.peer} ${p.range} — has ${p.have}`);
  for (const p of unknown) out.push(`  ? ${p.of} peer ${p.peer} ${p.range} — ${p.have ? `has ${p.have}, range not parsed` : p.note}`);
  out.push('', '| Package | Declared | Resolved | Latest | Drift |', '|---|---|---|---|---|');
  for (const r of rows) out.push(`| \`${r.name}\` | ${r.declared} | ${r.resolved ?? 'not resolved'} | ${r.latest ?? '?'} | ${r.drift} |`);
  return { text: out.join('\n'), unmet: unmet.length };
}

async function main() {
  const root = String(arg('root', '.'));
  const watchArg = arg('watch');
  let watch = typeof watchArg === 'string' ? watchArg.split(',').map((s) => s.trim()).filter(Boolean) : DEFAULT_WATCH;
  let result;
  try {
    if (arg('all')) watch = Object.keys(resolveDirect(root).declared);
    result = await check(root, watch);
  } catch (err) {
    const network = /fetch failed|ENOTFOUND|ECONN|timeout|aborted|registry answered/i.test(String(err?.message) + String(err?.cause?.code));
    console.error(network
      ? `Cannot check: the npm registry was unreachable (${err.message}). Nothing was verified. Behind a proxy on Node 22+, retry with NODE_USE_ENV_PROXY=1.`
      : `Cannot check: ${err.message}`);
    process.exit(network ? 3 : 2);
  }
  if (arg('json')) {
    console.log(JSON.stringify(result, null, 2));
    process.exit(result.rows.some((r) => r.peers.some((p) => p.ok === false)) ? 1 : 0);
  }
  const { text, unmet } = render(result);
  console.log(text);
  process.exit(unmet ? 1 : 0);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) main();
