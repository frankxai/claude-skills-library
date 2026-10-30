import assert from 'node:assert/strict';
import { test } from 'node:test';
import { formatFloor, parseRun, VARIANTS } from '../scripts/floor.mjs';

const events = (usage, extra = {}) => JSON.stringify([
  { type: 'system', subtype: 'init', tools: ['Bash', 'Read'], mcp_servers: [{}], agents: ['a'], skills: [] },
  { type: 'result', usage, total_cost_usd: 0.2, result: 'ok', ...extra },
]);

test('parseRun sums uncached, cache write and cache read into Turn-0', () => {
  const row = parseRun(events({ input_tokens: 4, cache_creation_input_tokens: 46900, cache_read_input_tokens: 47054 }));
  assert.equal(row.turn0, 93958);
  assert.equal(row.tools, 2);
  assert.equal(row.mcpServers, 1);
  assert.equal(row.costUsd, 0.2);
});

test('parseRun treats a run that billed nothing as a failure, not a zero floor', () => {
  assert.throws(() => parseRun(events({ input_tokens: 0, cache_creation_input_tokens: 0, cache_read_input_tokens: 0 }, { result: 'Not logged in' })), /no billed input: Not logged in/);
  assert.throws(() => parseRun(JSON.stringify([{ type: 'system' }])), /no result event/);
});

test('formatFloor shows each variant against its folder default and keeps failures visible', () => {
  const table = formatFloor([
    { cwd: 'a', variant: 'default', turn0: 141089, tools: 436, mcpServers: 13, skills: 727 },
    { cwd: 'a', variant: 'no-mcp', turn0: 128780, tools: 31, mcpServers: 0, skills: 727 },
    { cwd: 'a', variant: 'core-tools', error: 'no billed input' },
  ]);
  assert.match(table, /\| a \| no-mcp \| 128780 \| -12309 \|/);
  assert.match(table, /\| a \| core-tools \| failed: no billed input/);
});

test('every variant flag set is a list of strings claude accepts as separate arguments', () => {
  for (const flags of Object.values(VARIANTS)) for (const f of flags) assert.equal(typeof f, 'string');
  assert.deepEqual(VARIANTS.default, []);
});
