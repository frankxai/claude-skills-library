import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { aggregate, collectSessions, dailyMain, median, mergeLedger, trend } from '../scripts/daily.mjs';

const tmp = (name) => mkdtempSync(join(tmpdir(), `neutron-daily-${name}-`));
const usage = (input, write, read, output) => ({ input_tokens: input, cache_creation_input_tokens: write, cache_read_input_tokens: read, output_tokens: output });
const assistant = (id, ts, u, extra = {}) => JSON.stringify({ type: 'assistant', timestamp: ts, message: { id, model: 'claude-opus-5-5', usage: u }, ...extra });

function transcript(dir, name, lines) {
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, name), lines.join('\n') + '\n');
}

test('median and percentile helpers handle even, odd and empty input', () => {
  assert.equal(median([]), null);
  assert.equal(median([3, 1, 2]), 2);
  assert.equal(median([1, 2, 3, 4]), 3);
});

test('usage repeated across streamed lines of one message counts once', async () => {
  const root = tmp('dedupe');
  const proj = join(root, 'p1');
  transcript(proj, 's.jsonl', [
    JSON.stringify({ type: 'user', entrypoint: 'claude-desktop', timestamp: '2026-10-29T10:00:00Z' }),
    assistant('m1', '2026-10-29T10:00:01Z', usage(10, 200000, 40000, 50)),
    assistant('m1', '2026-10-29T10:00:01Z', usage(10, 200000, 40000, 50)),
    assistant('m2', '2026-10-29T10:01:00Z', usage(5, 1000, 240000, 70)),
  ]);
  const [s] = await collectSessions(root, Date.parse('2026-10-28'));
  assert.equal(s.turn0, 240010);
  assert.equal(s.calls, 2);
  assert.equal(s.output, 120);
  assert.equal(s.cacheRead, 280000);
});

test('sidechains, subagent folders and sessions before the window are skipped', async () => {
  const root = tmp('skip');
  const proj = join(root, 'p1');
  transcript(proj, 'side.jsonl', [assistant('a', '2026-10-29T10:00:00Z', usage(1, 1, 1, 1), { isSidechain: true })]);
  transcript(proj, 'old.jsonl', [assistant('b', '2026-10-01T10:00:00Z', usage(1, 1, 1, 1))]);
  transcript(join(proj, 'sess', 'subagents'), 'agent.jsonl', [assistant('c', '2026-10-29T10:00:00Z', usage(1, 1, 1, 1))]);
  assert.deepEqual(await collectSessions(root, Date.parse('2026-10-28')), []);
});

test('aggregate splits desktop, cli and headless sessions per day', () => {
  const s = (entrypoint, turn0) => ({ entrypoint, start: '2026-10-29T09:00:00Z', turn0, calls: 3, uncached: 1, cacheWrite: 2, cacheRead: 3, output: 4 });
  const [row] = aggregate([s('claude-desktop', 240000), s('claude-desktop', 250000), s('cli', 110000), s('sdk-py', 20000)]);
  assert.equal(row.interactive, 3);
  assert.equal(row.headless, 1);
  assert.equal(row.byEntrypoint['claude-desktop'].turn0Median, 245000);
  assert.equal(row.byEntrypoint.cli.turn0Median, 110000);
  assert.equal(row.headlessTurn0Median, 20000);
  assert.equal(row.output, 16);
});

test('mergeLedger keeps rows outside the window and the snapshot of earlier days', () => {
  const existing = [
    { date: '2026-10-01', sessions: 9, snapshot: { skills: 1 } },
    { date: '2026-10-29', sessions: 1, snapshot: { skills: 2 } },
  ];
  const rows = mergeLedger(existing, [{ date: '2026-10-29', sessions: 4 }], '2026-10-30', { skills: 3 });
  assert.deepEqual(rows.map(r => r.date), ['2026-10-01', '2026-10-29', '2026-10-30']);
  assert.equal(rows[0].sessions, 9);
  assert.equal(rows[1].sessions, 4);
  assert.deepEqual(rows[1].snapshot, { skills: 2 });
  assert.deepEqual(rows[2].snapshot, { skills: 3 });
});

test('trend compares desktop medians of the last 7 days with the 7 before', () => {
  const row = (date, v) => ({ date, byEntrypoint: { 'claude-desktop': { turn0Median: v } } });
  const tr = trend([row('2026-10-18', 200000), row('2026-10-29', 220000), row('2026-10-30', 240000)], '2026-10-30');
  assert.deepEqual(tr, { last7: 230000, prior7: 200000, changePct: 15 });
});

test('dailyMain writes the ledger, digest and a heartbeat that reports an empty read', async () => {
  const home = tmp('home');
  const out = join(home, 'out');
  const hb = join(home, 'hb.json');
  const code = await dailyMain(['--days', '3', '--out', out, '--heartbeat', hb, '--json'], { home, now: new Date('2026-10-30T12:00:00Z') });
  assert.equal(code, 0);
  const ledger = readFileSync(join(out, 'daily.jsonl'), 'utf8').trim().split('\n').map(l => JSON.parse(l));
  assert.equal(ledger.at(-1).date, '2026-10-30');
  assert.match(readFileSync(join(out, 'DAILY.md'), 'utf8'), /Neutron daily: 2026-10-30/);
  assert.equal(JSON.parse(readFileSync(hb, 'utf8')).status, 'no-sessions');
});
