import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { MARK_END, MARK_START, classifyEntrypoint, median, parseRtkGain, renderMarkdown, scanTranscripts, summarize, upsertRow } from '../scripts/turn0-digest.mjs';

const tmp = () => mkdtempSync(join(tmpdir(), 'turn0-digest-'));
const assistant = (ts, input, cacheRead, output = 10) => JSON.stringify({ type: 'assistant', timestamp: ts, message: { usage: { input_tokens: input, cache_read_input_tokens: cacheRead, output_tokens: output } } });
const user = (entrypoint, sidechain = false) => JSON.stringify({ type: 'user', entrypoint, isSidechain: sidechain, message: { role: 'user', content: 'x'.repeat(2500) } });

function writeTranscript(dir, name, lines) {
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, name), `${lines.join('\n')}\n`);
}

test('entrypoint decides the bucket; sdk runs never count as interactive', () => {
  assert.equal(classifyEntrypoint('claude-desktop'), 'interactive');
  assert.equal(classifyEntrypoint('cli'), 'interactive');
  assert.equal(classifyEntrypoint('sdk-py'), 'headless');
  assert.equal(classifyEntrypoint('sdk-ts'), 'headless');
  assert.equal(classifyEntrypoint(undefined), 'unknown');
  assert.equal(median([3, 1, 2]), 2);
  assert.equal(median([]), null);
});

test('scan takes the first assistant usage as Turn-0, skips sidechains and nested subagent dirs', async () => {
  const root = tmp();
  const proj = join(root, 'C--proj');
  writeTranscript(proj, 'a.jsonl', [user('claude-desktop'), assistant('2026-10-29T10:00:00Z', 1000, 239000), assistant('2026-10-29T10:01:00Z', 50, 245000)]);
  writeTranscript(proj, 'b.jsonl', [user('sdk-py'), assistant('2026-10-29T11:00:00Z', 12000, 0)]);
  writeTranscript(proj, 'side.jsonl', [user('claude-desktop', true), assistant('2026-10-29T12:00:00Z', 5, 5)]);
  writeTranscript(join(proj, 'sub-agent-id'), 'nested.jsonl', [user('claude-desktop'), assistant('2026-10-29T13:00:00Z', 7, 7)]);
  writeTranscript(proj, 'old.jsonl', [user('claude-desktop'), assistant('2026-07-01T10:00:00Z', 1, 1)]);
  writeTranscript(proj, 'aborted-first.jsonl', [user('claude-desktop'), assistant('2026-10-29T14:00:00Z', 0, 0, 0), assistant('2026-10-29T14:00:01Z', 100, 900)]);
  const sessions = await scanTranscripts(root, { sinceMs: Date.parse('2026-10-01') });
  assert.equal(sessions.length, 3);
  assert.equal(sessions.find((s) => s.file === 'aborted-first.jsonl').turn0, 1000);
  const s = summarize(sessions);
  assert.equal(s.interactive.n, 2);
  assert.equal(s.interactive.turn0Median, 240000);
  assert.equal(s.interactive.callsMedian, 2);
  assert.equal(s.headless.turn0Median, 12000);
  assert.equal(s.perDay[0].day, '2026-10-29');
});

test('rtk gain header parses to counts; a changed banner returns null instead of a guess', () => {
  const text = 'RTK Token Savings\n\nTotal commands:    13,082\nInput tokens:      9.7M\nTokens saved:      7.2M (74.4%)\n';
  assert.deepEqual(parseRtkGain(text), { commands: 13082, tokensSaved: 7200000, savedPercent: 74.4, estimate: 'bytes/4' });
  assert.equal(parseRtkGain('rtk: unknown subcommand'), null);
});

test('upsert replaces the same-day row and the markdown is marker-delimited', () => {
  const file = join(tmp(), 'token-digest.jsonl');
  const base = { sessions: summarize([]), instructions: { files: [], totalBytes: 0, estTokens: 0 }, rtk: null, skillEvals: null, windowDays: 14 };
  upsertRow(file, { ...base, date: '2026-10-29', ts: 'a' });
  upsertRow(file, { ...base, date: '2026-10-30', ts: 'b' });
  const rows = upsertRow(file, { ...base, date: '2026-10-30', ts: 'c' });
  assert.equal(rows.length, 2);
  assert.equal(readFileSync(file, 'utf8').trim().split('\n').length, 2);
  const md = renderMarkdown({ ...base, date: '2026-10-30', ts: 'c' }, rows);
  assert.ok(md.includes(MARK_START) && md.includes(MARK_END));
  assert.match(md, /rtk not on PATH/);
  assert.match(md, /No foundry graph/);
});
