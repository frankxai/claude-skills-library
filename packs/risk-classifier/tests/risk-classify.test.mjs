import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { classify } from '../ci/risk-classify.mjs';

const manifest = JSON.parse(
  fs.readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'classes.json'), 'utf8')
);

function fixtureRoot(files) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'riskclassify-'));
  for (const [rel, content] of Object.entries(files)) {
    const abs = path.join(root, rel);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, content);
  }
  return root;
}

function run(files) {
  const root = fixtureRoot(files);
  return classify({ root, files: Object.keys(files), manifest });
}

test('plain prose doc clears', () => {
  const r = run({ 'docs/notes/idea.md': '# An idea\nJust prose, no claims machinery.\n' });
  assert.equal(r.verdict, 'clear');
  assert.deepEqual(r.files[0].classes, ['prose_docs']);
});

test('data/ file is executable_config and gated', () => {
  const r = run({ 'data/redirect-aliases.json': '{"old":"/new"}\n' });
  assert.equal(r.verdict, 'gated');
  assert.ok(r.gatingTouched.includes('executable_config'));
});

test('lockfile is generated artifact + dependency change', () => {
  const r = run({ 'pnpm-lock.yaml': 'lockfileVersion: 9\n' });
  assert.equal(r.verdict, 'gated');
  assert.ok(r.files[0].classes.includes('generated_artifacts'));
  assert.ok(r.files[0].classes.includes('dependencies'));
});

test('public image gates on asset rights', () => {
  const r = run({ 'public/images/hero.png': 'not-really-a-png' });
  assert.equal(r.verdict, 'gated');
  assert.ok(r.gatingTouched.includes('asset_rights'));
});

test('content mdx gates on public claims even though it is prose', () => {
  const r = run({ 'content/blog/post.mdx': '# We grew 10x\n' });
  assert.equal(r.verdict, 'gated');
  assert.ok(r.files[0].classes.includes('public_claims'));
  assert.ok(r.files[0].classes.includes('prose_docs'));
});

test('secret-shaped content gates a prose file', () => {
  const r = run({ 'docs/notes/creds.md': 'aws key AKIAABCDEFGHIJKLMNOP in a note\n' });
  assert.equal(r.verdict, 'gated');
  assert.ok(r.gatingTouched.includes('secrets'));
});

test('unknown file type fails closed as unclassified', () => {
  const r = run({ 'weird/blob.xyz': 'mystery\n' });
  assert.equal(r.verdict, 'gated');
  assert.ok(r.gatingTouched.includes('unclassified'));
});

test('migration sql gates', () => {
  const r = run({ 'supabase/migrations/0001_init.sql': 'create table t(id int);\n' });
  assert.equal(r.verdict, 'gated');
  assert.ok(r.files[0].classes.includes('migrations'));
});

test('governing CLAUDE.md gates as executable_config', () => {
  const r = run({ 'CLAUDE.md': '# operating contract\n' });
  assert.equal(r.verdict, 'gated');
  assert.ok(r.files[0].classes.includes('executable_config'));
});

test('deleted file classifies by path without content scan', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'riskclassify-'));
  const r = classify({ root, files: ['lib/deleted-module.ts'], manifest });
  assert.equal(r.verdict, 'gated');
  assert.ok(r.files[0].classes.includes('executable_config'));
});

test('mixed set: one gating file gates the whole change', () => {
  const r = run({
    'docs/notes/a.md': 'prose\n',
    'scripts/deploy.sh': 'echo hi\n',
  });
  assert.equal(r.verdict, 'gated');
  assert.deepEqual(r.gatingTouched, ['executable_config']);
});
