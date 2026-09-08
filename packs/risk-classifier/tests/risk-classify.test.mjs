import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { classify, resolveRoot, applyOverrides } from '../ci/risk-classify.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const enginePath = path.join(here, '..', 'ci', 'risk-classify.mjs');
const manifest = JSON.parse(fs.readFileSync(path.join(here, '..', 'classes.json'), 'utf8'));

// Every fixture is a real git repo so resolveRoot() behaves exactly as in production.
function fixtureRepo(files = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'riskclassify-'));
  execFileSync('git', ['-C', dir, 'init', '-q']);
  for (const [rel, content] of Object.entries(files)) {
    const abs = path.join(dir, rel);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, content);
  }
  return resolveRoot(dir);
}

function run(files, m = manifest) {
  const root = fixtureRepo(files);
  return classify({ root, files: Object.keys(files), manifest: m });
}

function runCli(args, cwd) {
  try {
    const out = execFileSync('node', [enginePath, ...args], { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    return { code: 0, out };
  } catch (e) {
    return { code: e.status, out: e.stdout, err: e.stderr };
  }
}

// --- classification semantics -------------------------------------------------

test('bounded notes prose clears', () => {
  const r = run({ 'docs/notes/idea.md': '# An idea\nJust prose.\n' });
  assert.equal(r.verdict, 'clear');
  assert.deepEqual(r.files[0].classes, ['prose_docs']);
});

test('prose outside the allowlist gates as unclassified (docs/launch.md)', () => {
  const r = run({ 'docs/launch.md': '# Launch copy\nWe grew 10x.\n' });
  assert.equal(r.verdict, 'gated');
  assert.ok(r.gatingTouched.includes('unclassified'));
});

test('customer docs gate as unclassified (docs/customer/**)', () => {
  const r = run({ 'docs/customer/onboarding.md': '# Onboarding\n' });
  assert.equal(r.verdict, 'gated');
  assert.ok(r.gatingTouched.includes('unclassified'));
});

test('a repo override may widen prose_docs by path', () => {
  const widened = applyOverrides(manifest, { classes: { prose_docs: { paths: ['journal/**/*.md'] } } });
  const r = run({ 'journal/2026-09-01.md': 'today\n' }, widened);
  assert.equal(r.verdict, 'clear');
});

test('a repo override cannot touch a gating class or add extensions', () => {
  assert.throws(() => applyOverrides(manifest, { classes: { secrets: { paths: ['x'] } } }), /only non-gating/);
  assert.throws(() => applyOverrides(manifest, { classes: { prose_docs: { extensions: ['.md'] } } }), /only "paths"/);
});

test('data/ file is executable_config and gated', () => {
  const r = run({ 'data/redirect-aliases.json': '{"old":"/new"}\n' });
  assert.equal(r.verdict, 'gated');
  assert.ok(r.gatingTouched.includes('executable_config'));
});

test('lockfile is generated artifact + dependency change', () => {
  const r = run({ 'pnpm-lock.yaml': 'lockfileVersion: 9\n' });
  assert.ok(r.files[0].classes.includes('generated_artifacts'));
  assert.ok(r.files[0].classes.includes('dependencies'));
});

test('public image gates on asset rights', () => {
  const r = run({ 'public/images/hero.png': 'not-really-a-png' });
  assert.ok(r.gatingTouched.includes('asset_rights'));
});

test('content mdx gates on public claims', () => {
  const r = run({ 'content/blog/post.mdx': '# We grew 10x\n' });
  assert.ok(r.files[0].classes.includes('public_claims'));
});

test('secret-shaped content gates an otherwise-clear notes file', () => {
  const r = run({ 'docs/notes/creds.md': 'aws key AKIAABCDEFGHIJKLMNOP in a note\n' });
  assert.equal(r.verdict, 'gated');
  assert.ok(r.gatingTouched.includes('secrets'));
});

test('migration sql gates', () => {
  const r = run({ 'supabase/migrations/0001_init.sql': 'create table t(id int);\n' });
  assert.ok(r.files[0].classes.includes('migrations'));
});

test('governing CLAUDE.md gates as executable_config', () => {
  const r = run({ 'CLAUDE.md': '# operating contract\n' });
  assert.ok(r.files[0].classes.includes('executable_config'));
});

test('deleted file classifies by path without content scan', () => {
  const root = fixtureRepo();
  const r = classify({ root, files: ['lib/deleted-module.ts'], manifest });
  assert.equal(r.verdict, 'gated');
  assert.ok(r.files[0].classes.includes('executable_config'));
});

test('mixed set: one gating file gates the whole change', () => {
  const r = run({ 'docs/notes/a.md': 'prose\n', 'scripts/deploy.sh': 'echo hi\n' });
  assert.equal(r.verdict, 'gated');
  assert.deepEqual(r.gatingTouched, ['executable_config']);
});

// --- path safety --------------------------------------------------------------

test('traversal input is rejected as unsafe_path and gates', () => {
  const root = fixtureRepo({ 'docs/notes/a.md': 'x\n' });
  const r = classify({ root, files: ['../outside.md', 'docs/../../etc/passwd'], manifest });
  assert.equal(r.verdict, 'gated');
  assert.deepEqual(r.gatingTouched, ['unsafe_path']);
});

test('absolute input is rejected as unsafe_path', () => {
  const root = fixtureRepo();
  const r = classify({ root, files: ['/etc/passwd', 'C:\\Windows\\win.ini'], manifest });
  assert.deepEqual(r.gatingTouched, ['unsafe_path']);
});

test('symlinked file is never followed and gates', () => {
  const root = fixtureRepo({ 'docs/notes/real.md': 'x\n' });
  const outside = path.join(os.tmpdir(), `riskclassify-outside-${process.pid}.md`);
  fs.writeFileSync(outside, 'AKIAABCDEFGHIJKLMNOP\n');
  fs.symlinkSync(outside, path.join(root, 'docs/notes/link.md'));
  const r = classify({ root, files: ['docs/notes/link.md'], manifest });
  assert.equal(r.verdict, 'gated');
  assert.ok(r.gatingTouched.includes('unsafe_path'));
  assert.ok(!r.gatingTouched.includes('secrets'), 'symlink target must not have been read');
});

test('symlinked directory ancestor gates', () => {
  const root = fixtureRepo({ 'docs/notes/a.md': 'x\n' });
  const outsideDir = fs.mkdtempSync(path.join(os.tmpdir(), 'riskclassify-outdir-'));
  fs.writeFileSync(path.join(outsideDir, 'b.md'), 'x\n');
  fs.symlinkSync(outsideDir, path.join(root, 'notes'));
  const r = classify({ root, files: ['notes/b.md'], manifest });
  assert.ok(r.gatingTouched.includes('unsafe_path'));
});

// --- size boundaries -----------------------------------------------------------

test('a large prose file is still fully scanned (secret past 1 MiB is found)', () => {
  const big = 'a'.repeat(1024 * 1024 + 100) + '\nAKIAABCDEFGHIJKLMNOP\n';
  const r = run({ 'docs/notes/big.md': big });
  assert.equal(r.verdict, 'gated');
  assert.ok(r.gatingTouched.includes('secrets'));
});

test('a secret spanning the chunk boundary is found', () => {
  const prefix = 'a'.repeat(1024 * 1024 - 10);
  const r = run({ 'docs/notes/boundary.md': prefix + 'AKIAABCDEFGHIJKLMNOP\n' });
  assert.ok(r.gatingTouched.includes('secrets'));
});

test('a file beyond the scan limit gates as unscanned instead of clearing', () => {
  const root = fixtureRepo();
  const abs = path.join(root, 'docs/notes/huge.md');
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  const fd = fs.openSync(abs, 'w');
  fs.writeSync(fd, 'x', 64 * 1024 * 1024); // sparse file just over the limit
  fs.closeSync(fd);
  const r = classify({ root, files: ['docs/notes/huge.md'], manifest });
  assert.equal(r.verdict, 'gated');
  assert.ok(r.gatingTouched.includes('unscanned'));
});

// --- CLI contract ---------------------------------------------------------------

test('CLI with neither --files nor --base exits 2 (missing input fails closed)', () => {
  const root = fixtureRepo();
  const res = runCli(['--root', root], root);
  assert.equal(res.code, 2);
  assert.match(res.err, /missing classifier input/);
});

test('CLI with --base and an empty diff exits 0 as a legitimate empty change', () => {
  const root = fixtureRepo({ 'README.md': 'r\n' });
  execFileSync('git', ['-C', root, 'add', '.']);
  execFileSync('git', ['-C', root, '-c', 'user.email=t@t', '-c', 'user.name=t', 'commit', '-q', '-m', 'init']);
  const res = runCli(['--root', root, '--base', 'HEAD'], root);
  assert.equal(res.code, 0);
  assert.match(res.out, /empty diff/);
});

test('CLI with --root outside any git checkout exits 2', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'riskclassify-nogit-'));
  const res = runCli(['--root', dir, '--files', 'a.md'], dir);
  assert.equal(res.code, 2);
});
