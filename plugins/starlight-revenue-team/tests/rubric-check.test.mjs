import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkScore, exitCodeFor, canonicalProvider, CRITERIA } from '../bin/rubric-check.mjs';

const CLI = fileURLToPath(new URL('../bin/rubric-check.mjs', import.meta.url));
const scores = (values) => Object.fromEntries(CRITERIA.map((name, i) => [name, { score: values[i], reason: 'r' }]));
const base = (values, extra = {}) => ({ makerProvider: 'anthropic', scorerProvider: 'openai', criteria: scores(values), ...extra });

function runCli(score, files = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'rubric-'));
  for (const [name, body] of Object.entries(files)) writeFileSync(join(dir, name), body);
  const file = join(dir, 'score.json');
  writeFileSync(file, typeof score === 'string' ? score : JSON.stringify(score));
  try {
    execFileSync(process.execPath, [CLI, file], { stdio: 'pipe' });
    return 0;
  } catch (err) {
    return err.status;
  }
}

test('26 or more from an independent provider ships', () => {
  const r = checkScore(base([5, 4, 4, 5, 4, 4]));
  assert.equal(r.total, 26);
  assert.equal(r.verdict, 'ship');
  assert.equal(exitCodeFor(r), 0);
});

test('22 to 25 is revise and 21 is restart', () => {
  assert.equal(checkScore(base([4, 4, 4, 4, 3, 3])).verdict, 'revise');
  assert.equal(checkScore(base([4, 4, 4, 3, 3, 3])).verdict, 'restart');
});

test('aliases of the same provider are not independent', () => {
  assert.equal(checkScore(base([5, 5, 5, 5, 5, 5], { scorerProvider: ' Claude ' })).verdict, 'missing-independent');
  assert.equal(checkScore(base([5, 5, 5, 5, 5, 5], { makerProvider: 'codex', scorerProvider: 'openai' })).verdict, 'missing-independent');
});

test('unknown, blank and non-string providers are invalid', () => {
  for (const bad of ['   ', '', 'somebody', { name: 'openai' }, 42, null]) {
    assert.equal(checkScore(base([5, 5, 5, 5, 5, 5], { scorerProvider: bad })).ok, false, JSON.stringify(bad));
  }
  assert.equal(canonicalProvider('Gemini'), 'google');
});

test('a friendlier second opinion cannot lift a revise into a ship', () => {
  const r = checkScore(base([4, 4, 4, 4, 4, 4], { secondOpinion: { provider: 'anthropic', criteria: scores([5, 5, 5, 5, 5, 5]) } }));
  assert.equal(r.total, 24);
  assert.equal(r.verdict, 'revise');
});

test('a harsher second opinion pulls the verdict down', () => {
  const r = checkScore(base([5, 5, 5, 5, 5, 5], { secondOpinion: { provider: 'anthropic', criteria: scores([3, 3, 3, 3, 3, 3]) } }));
  assert.equal(r.verdict, 'restart');
});

test('a total that disagrees with the criteria is invalid', () => {
  assert.equal(checkScore(base([5, 5, 5, 5, 5, 5], { total: 29 })).ok, false);
});

test('missing, unknown and out-of-range criteria are invalid', () => {
  const missing = base([5, 5, 5, 5, 5, 5]);
  delete missing.criteria.voice;
  assert.match(checkScore(missing).errors.join(), /criterion missing: voice/);
  const unknown = base([5, 5, 5, 5, 5, 5]);
  unknown.criteria.vibes = 5;
  assert.match(checkScore(unknown).errors.join(), /unknown criterion: vibes/);
  assert.equal(checkScore(base([6, 5, 5, 5, 5, 5])).ok, false);
  assert.equal(checkScore(base([4.5, 5, 5, 5, 5, 5])).ok, false);
  assert.equal(checkScore([]).ok, false);
});

test('cli exit codes: 0 ship, 2 revise, 1 invalid json', () => {
  assert.equal(runCli(base([5, 5, 5, 5, 5, 5])), 0);
  assert.equal(runCli(base([4, 4, 4, 4, 4, 4])), 2);
  assert.equal(runCli('{not json'), 1);
});

test('cli binds the score to the scored file by digest', () => {
  const body = 'the final piece';
  const digest = createHash('sha256').update(body).digest('hex');
  assert.equal(runCli(base([5, 5, 5, 5, 5, 5], { target: 'piece.md', targetSha256: digest }), { 'piece.md': body }), 0);
  assert.equal(runCli(base([5, 5, 5, 5, 5, 5], { target: 'piece.md', targetSha256: digest }), { 'piece.md': 'edited after scoring' }), 1);
  assert.equal(runCli(base([5, 5, 5, 5, 5, 5], { target: 'piece.md' }), { 'piece.md': body }), 1);
});
