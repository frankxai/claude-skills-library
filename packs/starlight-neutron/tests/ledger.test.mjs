import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { addRow, compare, importCcusage, loadPrices, normalizeRow, readLedger, validateRow } from '../scripts/ledger.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const NEUTRON = join(HERE, '..', 'scripts', 'neutron.mjs');
const tmp = () => mkdtempSync(join(tmpdir(), 'neutron-ledger-'));
const row = (taskId, arm, tokens, check = 'pass') => ({
  date: '2026-10-01', harness: 'claude-code', model: 'm', taskId, arm,
  uncachedInput: tokens, cacheWrite: tokens, cacheRead: tokens, output: tokens, check, notes: null,
});
const set = (arm, tokens, checks = {}) => Array.from({ length: 6 }, (_, i) => row(`t${i}`, arm, tokens, checks[`t${i}`] ?? 'pass'));

test('validation rejects bad rows and names the field', () => {
  assert.deepEqual(validateRow(row('t', 'baseline', 1)), []);
  assert.match(validateRow({ ...row('t', 'a', 1), date: 'yesterday' }).join(), /date/);
  assert.match(validateRow({ ...row('t', 'a', 1), check: 'maybe' }).join(), /check/);
  assert.match(validateRow({ ...row('t', 'a', 1), output: -1 }).join(), /output/);
  assert.match(validateRow({ ...row('t', 'a', 1), cacheRead: 1.5 }).join(), /cacheRead/);
  assert.match(validateRow({ ...row('', 'a', 1) }).join(), /taskId/);
  assert.throws(() => normalizeRow({ ...row('t', 'a', 1), arm: undefined }), /arm/);
});

test('add appends one validated JSONL row and refuses an invalid one', () => {
  const file = join(tmp(), 'l.jsonl');
  addRow(file, row('t1', 'baseline', 5));
  assert.throws(() => addRow(file, { ...row('t2', 'baseline', 5), check: 'nope' }), /invalid row/);
  const lines = readFileSync(file, 'utf8').trim().split('\n');
  assert.equal(lines.length, 1);
  assert.equal(JSON.parse(lines[0]).taskId, 't1');
  assert.equal(readLedger(file).length, 1);
});

test('readLedger reports the line of a bad row', () => {
  const file = join(tmp(), 'bad.jsonl');
  writeFileSync(file, `${JSON.stringify(row('t', 'a', 1))}\nnot json\n`);
  assert.throws(() => readLedger(file), /bad\.jsonl:2/);
});

test('honesty rule: a pair counts only if both rows pass', () => {
  const base = set('baseline', 100);
  const cand = set('cand', 50, { t0: 'fail', t1: 'not-checked' });
  cand[2].check = 'pass';
  const r = compare(base, cand);
  assert.equal(r.n, 4);
  assert.deepEqual(r.excluded.map((e) => e.taskId).sort(), ['t0', 't1']);
  // the failed and unchecked pairs are absent from the totals: 4 pairs x 100
  assert.equal(r.metrics.output.baseline, 400);
  assert.equal(r.metrics.output.candidate, 200);
});

test('a baseline row that is not "pass" also removes the pair', () => {
  const base = set('baseline', 100, { t3: 'fail' });
  const r = compare(base, set('cand', 50));
  assert.equal(r.n, 5);
  assert.equal(r.excluded[0].taskId, 't3');
});

test('n below 5 prints the too-few message and no percentage', () => {
  const r = compare(set('baseline', 100).slice(0, 4), set('cand', 50).slice(0, 4));
  assert.equal(r.n, 4);
  assert.equal(r.message, 'n=4, too few to call this a result');
  for (const m of Object.values(r.metrics)) assert.equal(m.percent, null);
});

test('n of 5 or more gives a percentage', () => {
  const r = compare(set('baseline', 100), set('cand', 60));
  assert.equal(r.n, 6);
  assert.equal(r.message, null);
  assert.equal(r.metrics.output.percent, 40);
});

test('unpaired tasks are listed and never counted', () => {
  const base = [...set('baseline', 100), row('only-b', 'baseline', 1)];
  const cand = [...set('cand', 50), row('only-c', 'cand', 1)];
  const r = compare(base, cand);
  assert.equal(r.n, 6);
  assert.deepEqual(r.unpaired, [{ taskId: 'only-b', side: 'baseline only' }, { taskId: 'only-c', side: 'candidate only' }]);
});

test('duplicate taskId in one arm is an error', () => {
  assert.throws(() => compare([row('t', 'b', 1), row('t', 'b', 2)], []), /more than one row/);
});

test('null metrics are skipped per metric, not treated as zero', () => {
  const base = set('baseline', 100);
  const cand = set('cand', 50);
  cand[0].cacheRead = null;
  const r = compare(base, cand);
  assert.equal(r.metrics.cacheRead.n, 5);
  assert.equal(r.metrics.output.n, 6);
});

test('prices are read from the file, never built in, and weight the total', () => {
  assert.throws(() => loadPrices({ output: 1 }), /uncachedInput/);
  const prices = loadPrices({ uncachedInput: 1, cacheWrite: 2, cacheRead: 3, output: 4 });
  const r = compare(set('baseline', 1_000_000), set('cand', 500_000), prices);
  assert.equal(r.weighted.baseline, 6 * 10);
  assert.equal(r.weighted.candidate, 6 * 5);
  assert.equal(r.weighted.percent, 50);
  assert.equal(compare(set('baseline', 1), set('cand', 1)).weighted, null);
});

test('ccusage fixture import maps fields and nulls what is missing', () => {
  const fixture = JSON.parse(readFileSync(join(HERE, 'fixtures', 'ccusage-session.json'), 'utf8'));
  const rows = importCcusage(fixture, { arm: 'baseline', harness: 'claude-code' });
  assert.equal(rows.length, 2);
  assert.deepEqual(
    [rows[0].taskId, rows[0].date, rows[0].model, rows[0].uncachedInput, rows[0].cacheWrite, rows[0].cacheRead, rows[0].output, rows[0].check],
    ['task-a', '2026-10-01', 'claude-sonnet-5-5', 1200, 20000, 150000, 3400, 'not-checked'],
  );
  assert.equal(rows[1].model, null);
  assert.equal(rows[1].cacheWrite, null);
  assert.equal(rows[1].cacheRead, null);
  assert.match(rows[1].notes, /cacheWrite: cacheCreationTokens missing/);
  assert.match(rows[1].notes, /several models/);
});

test('ccusage import accepts the older sessionId shape and rejects unknown JSON', () => {
  const old = { sessions: [{ sessionId: 's1', lastActivity: '2026-09-30', modelsUsed: ['m'], inputTokens: 1, outputTokens: 2, cacheCreationTokens: 3, cacheReadTokens: 4 }] };
  assert.equal(importCcusage(old, { arm: 'a', harness: 'h' })[0].taskId, 's1');
  assert.throws(() => importCcusage({ foo: 1 }, { arm: 'a', harness: 'h' }), /unrecognised/);
  assert.throws(() => importCcusage(old, { harness: 'h' }), /arm/);
});

test('CLI: neutron.mjs ledger compare --json end to end', () => {
  const dir = tmp();
  const [a, b] = [join(dir, 'a.jsonl'), join(dir, 'b.jsonl')];
  writeFileSync(a, set('baseline', 100).map((r) => JSON.stringify(r)).join('\n'));
  writeFileSync(b, set('cand', 80).map((r) => JSON.stringify(r)).join('\n'));
  const res = spawnSync(process.execPath, [NEUTRON, 'ledger', 'compare', '--baseline', a, '--candidate', b, '--json'], { encoding: 'utf8' });
  assert.equal(res.status, 0, res.stderr);
  assert.equal(JSON.parse(res.stdout).metrics.output.percent, 20);
  const table = spawnSync(process.execPath, [NEUTRON, 'ledger', 'compare', '--baseline', a, '--candidate', b], { encoding: 'utf8' });
  assert.match(table.stdout, /n=6/);
  const bad = spawnSync(process.execPath, [NEUTRON, 'ledger', 'compare', '--baseline', a], { encoding: 'utf8' });
  assert.equal(bad.status, 1);
});
