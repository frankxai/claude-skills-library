#!/usr/bin/env node
// risk-classify.mjs — manifest-driven risk classifier for PR readiness gating.
//
// Classifies a set of changed files against the risk classes in ../classes.json
// (plus an optional per-repo overrides file) and returns a fail-closed verdict:
//   clear  -> every file matched at least one class, none of them gating
//   gated  -> a gating class was touched, a secret pattern was found, a file
//             could not be safely scanned, or a file matched no class (unknown
//             fails closed)
//
// Usage:
//   node risk-classify.mjs --root <repo> --files a.md lib/x.ts ...
//   node risk-classify.mjs --root <repo> --base origin/main
//   [--manifest path/to/classes.json] [--overrides path/to/overrides.json]
//
// Exit codes: 0 clear · 1 gated · 2 error or missing input (treat as gated).
// Security posture: --root is resolved to the git top-level; every candidate
// path must be relative, traversal-free, and resolve inside that root; symlinks
// are never followed (lstat) and gate the verdict. No dependencies; node >= 18.

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const CHUNK_BYTES = 1024 * 1024;      // streaming scan window
const OVERLAP_BYTES = 4096;           // carried across chunks so a secret spanning a boundary is still seen
const MAX_SCAN_BYTES = 64 * 1024 * 1024; // beyond this the file is gated as unscanned, never silently cleared
const DEFAULT_OVERRIDES_REL = '.claude/ci/risk-classifier/overrides.json';

function globToRegex(glob) {
  let re = '';
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i];
    if (c === '*') {
      if (glob[i + 1] === '*') {
        if (glob[i + 2] === '/') { re += '(?:.*/)?'; i += 2; }
        else { re += '.*'; i += 1; }
      } else re += '[^/]*';
    } else if (c === '?') {
      re += '[^/]';
    } else if ('.+^${}()|[]\\'.includes(c)) {
      re += '\\' + c;
    } else {
      re += c;
    }
  }
  return new RegExp('^' + re + '$');
}

function matchesPath(relPath, pattern) {
  if (globToRegex(pattern).test(relPath)) return true;
  // A pattern without '/' also matches by basename (e.g. "*.config.js", "CLAUDE.md").
  if (!pattern.includes('/')) return globToRegex(pattern).test(path.posix.basename(relPath));
  return false;
}

function compileContentPattern(p) {
  let flags = '';
  if (p.startsWith('(?i)')) { p = p.slice(4); flags = 'i'; }
  return new RegExp(p, flags);
}

function parseArgs(argv) {
  const args = { files: [], filesGiven: false, root: process.cwd(), base: null, manifest: null, overrides: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--root') args.root = argv[++i];
    else if (a === '--base') args.base = argv[++i];
    else if (a === '--manifest') args.manifest = argv[++i];
    else if (a === '--overrides') args.overrides = argv[++i];
    else if (a === '--files') {
      args.filesGiven = true;
      while (argv[i + 1] && !argv[i + 1].startsWith('--')) args.files.push(argv[++i]);
    }
    else throw new Error(`unknown argument: ${a}`);
  }
  return args;
}

// The verified root is the git top-level of --root, realpath-resolved. A --root that is
// not inside a git checkout is an error (exit 2): the classifier only reasons about repos.
export function resolveRoot(root) {
  const top = execFileSync('git', ['-C', root, 'rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim();
  return fs.realpathSync(top);
}

function changedFiles(root, base) {
  const out = execFileSync('git', ['-C', root, 'diff', '--name-only', `${base}...HEAD`], { encoding: 'utf8' });
  return out.split('\n').map(s => s.trim()).filter(Boolean);
}

// Returns { rel } when the candidate is a safe relative path inside root, else { reject }.
// Every ancestor is lstat'ed so a symlinked directory cannot smuggle a read outside root.
function safeCandidate(root, input) {
  const norm = String(input).split(path.sep).join('/');
  if (!norm || norm.startsWith('/') || /^[A-Za-z]:[\\/]/.test(norm) || norm.startsWith('\\\\')) {
    return { reject: 'absolute path rejected' };
  }
  const segments = norm.split('/');
  if (segments.some(s => s === '' || s === '.' || s === '..')) {
    return { reject: 'traversal or empty segment rejected' };
  }
  const abs = path.resolve(root, ...segments);
  if (abs !== root && !abs.startsWith(root + path.sep)) {
    return { reject: 'resolves outside root' };
  }
  let cursor = root;
  for (const seg of segments) {
    cursor = path.join(cursor, seg);
    let st;
    try { st = fs.lstatSync(cursor); } catch { return { rel: norm, missing: true }; }
    if (st.isSymbolicLink()) return { reject: `symlink at ${path.relative(root, cursor)}` };
  }
  return { rel: norm, abs };
}

// Streams the file through the secret regexes with chunk overlap. Returns
// 'hit' | 'clean' | 'binary' | 'unscanned'.
function scanForSecrets(abs, size, regexes) {
  if (size > MAX_SCAN_BYTES) return 'unscanned';
  const fd = fs.openSync(abs, 'r');
  try {
    const buf = Buffer.alloc(CHUNK_BYTES);
    let carry = '';
    let offset = 0;
    let first = true;
    while (offset < size) {
      const n = fs.readSync(fd, buf, 0, CHUNK_BYTES, offset);
      if (n <= 0) break;
      const slice = buf.subarray(0, n);
      if (first) { if (slice.includes(0)) return 'binary'; first = false; }
      const text = carry + slice.toString('utf8');
      for (const rx of regexes) if (rx.test(text)) return 'hit';
      carry = text.slice(-OVERLAP_BYTES);
      offset += n;
    }
    return 'clean';
  } finally {
    fs.closeSync(fd);
  }
}

export function loadOverrides(root, explicitPath) {
  const p = explicitPath ? path.resolve(explicitPath) : path.join(root, DEFAULT_OVERRIDES_REL);
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

// Overrides may only widen non-gating classes and only with path patterns; they can never
// disable a gating class or add extensions. That keeps a repo override a bounded allowlist.
export function applyOverrides(manifest, overrides) {
  if (!overrides) return manifest;
  const merged = JSON.parse(JSON.stringify(manifest));
  for (const [name, extra] of Object.entries(overrides.classes || {})) {
    const target = merged.classes[name];
    if (!target || target.gating !== false) {
      throw new Error(`override for "${name}" rejected: only non-gating classes may be widened`);
    }
    if (extra.extensions || extra.content_patterns || 'gating' in extra) {
      throw new Error(`override for "${name}" rejected: only "paths" may be added`);
    }
    target.paths = [...(target.paths || []), ...(extra.paths || [])];
  }
  return merged;
}

export function classify({ root, files, manifest }) {
  const result = { version: '1.1.0', manifestVersion: manifest.version, root, files: [], classesTouched: {}, reasons: [], verdict: 'clear' };
  const secretRegexes = (manifest.classes.secrets?.content_patterns || []).map(compileContentPattern);

  for (const input of files) {
    const cand = safeCandidate(root, input);
    if (cand.reject) {
      const shown = String(input);
      result.files.push({ path: shown, classes: ['unsafe_path'] });
      (result.classesTouched.unsafe_path ||= []).push(shown);
      result.reasons.push(`${shown}: ${cand.reject}`);
      continue;
    }
    const norm = cand.rel;
    const hit = new Set();

    for (const [name, def] of Object.entries(manifest.classes)) {
      const byPath = (def.paths || []).some(p => matchesPath(norm, p));
      const byExt = (def.extensions || []).includes(path.posix.extname(norm).toLowerCase());
      if (byPath || byExt) hit.add(name);
    }

    if (!cand.missing && secretRegexes.length) {
      const st = fs.lstatSync(cand.abs);
      if (st.isFile()) {
        const outcome = scanForSecrets(cand.abs, st.size, secretRegexes);
        if (outcome === 'hit') { hit.add('secrets'); result.reasons.push(`secret-shaped content in ${norm}`); }
        else if (outcome === 'unscanned') { hit.add('unscanned'); result.reasons.push(`${norm} exceeds scan limit (${st.size} bytes) — unscanned fails closed`); }
      } else {
        hit.add('unsafe_path');
        result.reasons.push(`${norm}: not a regular file`);
      }
    }

    if (hit.size === 0) {
      hit.add('unclassified');
      result.reasons.push(`${norm} matched no class — unknown fails closed`);
    }

    const classes = [...hit].sort();
    result.files.push({ path: norm, classes });
    for (const c of classes) (result.classesTouched[c] ||= []).push(norm);
  }

  const gatingTouched = Object.keys(result.classesTouched).filter(
    c => c === 'unclassified' || c === 'unsafe_path' || c === 'unscanned' || manifest.classes[c]?.gating === true
  );
  result.gatingTouched = gatingTouched.sort();
  if (gatingTouched.length > 0) result.verdict = 'gated';
  return result;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.filesGiven && !args.base) {
    throw new Error('missing classifier input: pass --files <paths...> or --base <ref>');
  }
  const root = resolveRoot(args.root);
  const manifestPath = args.manifest
    || path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'classes.json');
  const manifest = applyOverrides(
    JSON.parse(fs.readFileSync(manifestPath, 'utf8')),
    loadOverrides(root, args.overrides)
  );
  const files = args.filesGiven ? args.files : changedFiles(root, args.base);
  if (!files.length) {
    console.log(JSON.stringify({ version: '1.1.0', verdict: 'clear', root, files: [], note: 'empty diff — no changed files' }, null, 2));
    return 0;
  }
  const result = classify({ root, files, manifest });
  console.log(JSON.stringify(result, null, 2));
  return result.verdict === 'clear' ? 0 : 1;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  try {
    process.exit(main());
  } catch (err) {
    console.error(JSON.stringify({ verdict: 'gated', error: String(err?.message || err), note: 'error fails closed' }));
    process.exit(2);
  }
}
