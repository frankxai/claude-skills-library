import assert from 'node:assert/strict';
import { test } from 'node:test';
import { formatFloor, parseRun, VARIANTS } from '../scripts/floor.mjs';

const init = { type: 'system', subtype: 'init', tools: ['Bash', 'Read'], mcp_servers: [{}], agents: ['a'], skills: [] };
const first = (u) => ({ type: 'assistant', message: { id: 'm1', usage: u } });
const result = (u, extra = {}) => ({ type: 'result', usage: u, total_cost_usd: 0.2, num_turns: 1, result: 'ok', ...extra });
const u = (input, write, read) => ({ input_tokens: input, cache_creation_input_tokens: write, cache_read_input_tokens: read });

test('parseRun reads Turn-0 from the first assistant call in the event array (2.1.312 shape)', () => {
  const stdout = JSON.stringify([init, first(u(4, 46900, 47054)), { type: 'rate_limit_event' }, result(u(9, 50000, 99000), { num_turns: 2 })]);
  const row = parseRun(stdout);
  assert.equal(row.turn0, 93958);
  assert.equal(row.calls, 2);
  assert.equal(row.tools, 2);
  assert.equal(row.mcpServers, 1);
});

test('parseRun accepts a single result object for a one-call run and refuses run totals for multi-call runs', () => {
  assert.equal(parseRun(JSON.stringify(result(u(2, 24051, 1679)))).turn0, 25732);
  assert.throws(() => parseRun(JSON.stringify(result(u(2, 24051, 1679), { num_turns: 3 }))), /run made 3 calls/);
});

test('parseRun treats a run that billed nothing as a failure, not a zero floor', () => {
  assert.throws(() => parseRun(JSON.stringify([init, result(u(0, 0, 0), { result: 'Not logged in' })])), /no billed input: Not logged in/);
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
