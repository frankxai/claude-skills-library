import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { aggregate, collectSessions, dailyMain, median, mergeLedger, trend } from '../scripts/daily.mjs';

const tmp = (name) => mkdtempSync(join(tmpdir(), `neutron-daily-${name}-`));
const usage = (input, write, read, output) => ({ input_tokens: input, cache_creation_input_tokens: write, cache_read_input_tokens: read, output_tokens: output });
const assistant = (id, ts, u, extra = {}) => JSON.stringify({ type: 'assistant', timestamp: ts, message: { id, model: 'claude-opus-5-5', usage: u }, ...extra });
const call = (ts, cacheRead) => ({ ts, uncached: 0, cacheWrite: 0, cacheRead, output: 1 });

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
  transcript(join(root, 'p1'), 's.jsonl', [
    JSON.stringify({ type: 'user', entrypoint: 'claude-desktop', timestamp: '2026-10-29T10:00:00Z' }),
    assistant('m1', '2026-10-29T10:00:01Z', usage(10, 200000, 40000, 50)),
    assistant('m1', '2026-10-29T10:00:01Z', usage(10, 200000, 40000, 50)),
    assistant('m2', '2026-10-29T10:01:00Z', usage(5, 1000, 240000, 70)),
  ]);
  const [s] = await collectSessions(root, Date.parse('2026-10-28'));
  assert.equal(s.turn0, 240010);
  assert.equal(s.calls.length, 2);
  const [row] = aggregate([s]);
  assert.equal(row.output, 120);
  assert.equal(row.cacheRead, 280000);
});

test('malformed records (null, numbers, bad timestamps, invalid usage, non-string text) are skipped, not fatal', async () => {
  const root = tmp('malformed');
  transcript(join(root, 'p1'), 's.jsonl', [
    'null', '42', '"text"', '{not json',
    JSON.stringify({ type: 'user', timestamp: '2026-10-29T09:59:00Z', message: { content: [{ type: 'text', text: 7 }] } }),
    assistant('bad-ts', 1730000000, usage(1, 1, 1, 1)),
    assistant('m1', '2026-10-29T10:00:00Z', usage(-5, 100, 0, 2)),
    assistant('m1', '2026-10-29T10:00:00Z', usage(3, 100, 200, 2)),
  ]);
  const [s] = await collectSessions(root, Date.parse('2026-10-28'));
  assert.equal(s.firstPrompt, null);
  assert.equal(s.calls.length, 1);
  assert.equal(s.turn0, 303);
});

test('date keys are UTC whatever offset a timestamp carries', () => {
  const s = { entrypoint: 'cli', start: '2026-10-30T00:30:00+02:00', turn0: 1, calls: [call('2026-10-30T00:30:00+02:00', 5)] };
  assert.deepEqual(aggregate([s]).map(r => [r.date, r.sessions, r.cacheRead]), [['2026-10-29', 1, 5]]);
});

test('neutron floor probe sessions are not counted as work sessions', async () => {
  const root = tmp('probe');
  const user = (text) => JSON.stringify({ type: 'user', entrypoint: 'claude-desktop', timestamp: '2026-10-29T10:00:00Z', message: { role: 'user', content: text } });
  transcript(join(root, 'p1'), 'probe.jsonl', [user('Reply with the single word ok.'), assistant('m1', '2026-10-29T10:00:01Z', usage(4, 46900, 47054, 3))]);
  transcript(join(root, 'p1'), 'split.jsonl', [user([{ type: 'text', text: 'Reply' }]), assistant('m2', '2026-10-29T10:00:01Z', usage(4, 46900, 47054, 3))]);
  transcript(join(root, 'p1'), 'work.jsonl', [user('Reply to the reviewer on PR 12'), assistant('m3', '2026-10-29T10:00:01Z', usage(4, 46900, 47054, 3))]);
  transcript(join(root, 'p1'), 'long.jsonl', [user('Reply'), assistant('m4', '2026-10-29T10:00:01Z', usage(4, 46900, 47054, 3)), assistant('m5', '2026-10-29T10:05:00Z', usage(4, 100, 94000, 9))]);
  const sessions = await collectSessions(root, Date.parse('2026-10-28'));
  assert.deepEqual(sessions.map(s => s.firstPrompt).sort(), ['Reply', 'Reply to the reviewer on PR 12']);
});

test('sidechains, subagent folders and sessions with no call in the window are skipped', async () => {
  const root = tmp('skip');
  const proj = join(root, 'p1');
  transcript(proj, 'side.jsonl', [assistant('a', '2026-10-29T10:00:00Z', usage(1, 1, 1, 1), { isSidechain: true })]);
  transcript(proj, 'old.jsonl', [assistant('b', '2026-10-01T10:00:00Z', usage(1, 1, 1, 1))]);
  transcript(join(proj, 'sess', 'subagents'), 'agent.jsonl', [assistant('c', '2026-10-29T10:00:00Z', usage(1, 1, 1, 1))]);
  assert.deepEqual(await collectSessions(root, Date.parse('2026-10-28')), []);
});

test('a session that started before the window still counts the usage it billed inside it', async () => {
  const root = tmp('carry');
  transcript(join(root, 'p1'), 's.jsonl', [
    assistant('m1', '2026-10-20T23:00:00Z', usage(0, 0, 240000, 1)),
    assistant('m2', '2026-10-29T09:00:00Z', usage(0, 0, 500000, 1)),
  ]);
  const sessions = await collectSessions(root, Date.parse('2026-10-28'));
  assert.equal(sessions.length, 1);
  const rows = aggregate(sessions, Date.parse('2026-10-28'));
  assert.deepEqual(rows.map(r => [r.date, r.sessions, r.cacheRead]), [['2026-10-29', 0, 500000]]);
});

test('usage is bucketed by call day while Turn-0 stays on the start day', () => {
  const s = { entrypoint: 'claude-desktop', start: '2026-10-29T23:30:00Z', turn0: 240000, calls: [call('2026-10-29T23:30:00Z', 240000), call('2026-10-30T00:10:00Z', 900000)] };
  const [d29, d30] = aggregate([s]);
  assert.equal(d29.sessions, 1);
  assert.equal(d29.cacheRead, 240000);
  assert.equal(d30.sessions, 0);
  assert.equal(d30.turn0Median, null);
  assert.equal(d30.cacheRead, 900000);
});

test('aggregate splits desktop, cli and headless sessions per day', () => {
  const s = (entrypoint, turn0) => ({ entrypoint, start: '2026-10-29T09:00:00Z', turn0, calls: [{ ts: '2026-10-29T09:00:00Z', uncached: 1, cacheWrite: 2, cacheRead: 3, output: 4 }] });
  const [row] = aggregate([s('claude-desktop', 240000), s('claude-desktop', 250000), s('cli', 110000), s('sdk-py', 20000)]);
  assert.equal(row.interactive, 3);
  assert.equal(row.headless, 1);
  assert.equal(row.byEntrypoint['claude-desktop'].turn0Median, 245000);
  assert.equal(row.byEntrypoint.cli.turn0Median, 110000);
  assert.equal(row.headlessTurn0Median, 20000);
  assert.equal(row.output, 16);
});

test('mergeLedger replaces every day in the window, zeroing days whose sessions are gone', () => {
  const existing = [
    { date: '2026-10-01', sessions: 9, snapshot: { skills: 1 } },
    { date: '2026-10-28', sessions: 5, snapshot: { skills: 2 } },
    { date: '2026-10-29', sessions: 1, snapshot: { skills: 2 } },
  ];
  const rows = mergeLedger(existing, [{ date: '2026-10-29', sessions: 4 }], { since: '2026-10-28', today: '2026-10-30', snap: { skills: 3 }, rtk: new Map() });
  assert.deepEqual(rows.map(r => [r.date, r.sessions]), [['2026-10-01', 9], ['2026-10-28', 0], ['2026-10-29', 4], ['2026-10-30', 0]]);
  assert.deepEqual(rows[1].snapshot, { skills: 2 });
  assert.deepEqual(rows[3].snapshot, { skills: 3 });
});

test('mergeLedger keeps a recorded RTK figure when RTK could not be read, and takes fresh figures when it could', () => {
  const existing = [{ date: '2026-10-29', sessions: 1, rtk: { savedTokens: 686059 } }];
  const kept = mergeLedger(existing, [{ date: '2026-10-29', sessions: 2 }], { since: '2026-10-29', today: '2026-10-29', snap: null, rtk: null });
  assert.equal(kept[0].rtk.savedTokens, 686059);
  const fresh = mergeLedger(existing, [], { since: '2026-10-29', today: '2026-10-29', snap: null, rtk: new Map([['2026-10-29', { savedTokens: 1 }]]) });
  assert.equal(fresh[0].rtk.savedTokens, 1);
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
  assert.deepEqual(ledger.map(r => r.date), ['2026-10-28', '2026-10-29', '2026-10-30']);
  assert.match(readFileSync(join(out, 'DAILY.md'), 'utf8'), /Neutron daily: 2026-10-30/);
  assert.equal(JSON.parse(readFileSync(hb, 'utf8')).status, 'no-sessions');
});
