#!/usr/bin/env node
// risk-classify.mjs — manifest-driven risk classifier for PR readiness gating.
//
// Classifies a set of changed files against the eight risk classes in
// ../classes.json and returns a fail-closed verdict:
//   clear  -> every file matched at least one class, none of them gating
//   gated  -> a gating class was touched, a secret pattern was found, or a
//             file matched no class at all (unknown fails closed)
//
// Usage:
//   node risk-classify.mjs --root <repo> --files a.md lib/x.ts ...
//   node risk-classify.mjs --root <repo> --base origin/main
//   [--manifest path/to/classes.json]
//
// Exit codes: 0 clear · 1 gated · 2 error (treat as gated).
// No dependencies; node >= 18.

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const MAX_SCAN_BYTES = 512 * 1024;

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
  const args = { files: [], root: process.cwd(), base: null, manifest: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--root') args.root = argv[++i];
    else if (a === '--base') args.base = argv[++i];
    else if (a === '--manifest') args.manifest = argv[++i];
    else if (a === '--files') { while (argv[i + 1] && !argv[i + 1].startsWith('--')) args.files.push(argv[++i]); }
    else throw new Error(`unknown argument: ${a}`);
  }
  return args;
}

function changedFiles(root, base) {
  const out = execFileSync('git', ['-C', root, 'diff', '--name-only', `${base}...HEAD`], { encoding: 'utf8' });
  return out.split('\n').map(s => s.trim()).filter(Boolean);
}

function isTextSample(buf) {
  return !buf.includes(0);
}

export function classify({ root, files, manifest }) {
  const result = { version: '1.0.0', manifestVersion: manifest.version, files: [], classesTouched: {}, reasons: [], verdict: 'clear' };
  const secretRegexes = (manifest.classes.secrets?.content_patterns || []).map(compileContentPattern);

  for (const rel of files) {
    const norm = rel.split(path.sep).join('/');
    const hit = new Set();

    for (const [name, def] of Object.entries(manifest.classes)) {
      const byPath = (def.paths || []).some(p => matchesPath(norm, p));
      const byExt = (def.extensions || []).includes(path.posix.extname(norm).toLowerCase());
      if (byPath || byExt) hit.add(name);
    }

    // Secret content scan applies to every readable text file, wherever it lives.
    const abs = path.join(root, norm);
    if (secretRegexes.length && fs.existsSync(abs) && fs.statSync(abs).isFile() && fs.statSync(abs).size <= MAX_SCAN_BYTES) {
      const buf = fs.readFileSync(abs);
      if (isTextSample(buf)) {
        const text = buf.toString('utf8');
        for (const rx of secretRegexes) {
          if (rx.test(text)) { hit.add('secrets'); result.reasons.push(`secret-shaped content in ${norm}`); break; }
        }
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
    c => c === 'unclassified' || manifest.classes[c]?.gating === true
  );
  result.gatingTouched = gatingTouched.sort();
  if (gatingTouched.length > 0) result.verdict = 'gated';
  return result;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const manifestPath = args.manifest
    || path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'classes.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const files = args.files.length ? args.files : (args.base ? changedFiles(args.root, args.base) : []);
  if (!files.length) {
    console.log(JSON.stringify({ verdict: 'clear', files: [], note: 'no changed files' }, null, 2));
    return 0;
  }
  const result = classify({ root: args.root, files, manifest });
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
