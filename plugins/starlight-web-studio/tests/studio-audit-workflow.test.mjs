// Runs workflows/studio-audit.js against stub agents, emulating the Workflow runtime's
// documented semantics: a thrown stage drops its item to null, parallel never rejects.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = (await readFile(new URL('../workflows/studio-audit.js', import.meta.url), 'utf8'))
  .replace('export const meta =', 'const meta =');
const AsyncFunction = Object.getPrototypeOf(async () => {}).constructor;
const body = new AsyncFunction('args', 'agent', 'pipeline', 'parallel', 'log', 'phase', source);

const STUB = {
  scout: () => ({ machineScore: 27, eyeScore: 31, captured: true, topFixes: ['x'], auditPath: 'a' }),
  copy: () => ({ verdict: 'rewrite', findings: ['x'], reportPath: 'c' }),
  search: () => ({ verdict: 'ok', findings: [], reportPath: 's' }),
  critic: () => ({ independentProvider: 'codex', verdict: 'revise', worst: ['x'], report: 'r' }),
  rank: () => ({ proposals: [{ id: 'one', route: 'R3', problem: 'p', roles: ['copy-chief'], expectedChange: '+5', humanGate: 'none' }] }),
};

async function run(args, overrides = {}) {
  const calls = [];
  const logs = [];
  const agent = async (prompt, opts) => {
    const role = opts.label.split(':')[0];
    calls.push({ role, prompt });
    const impl = overrides[role] ?? STUB[role];
    return impl(opts.label);
  };
  const pipeline = (items, ...stages) => Promise.all(items.map(async (item, i) => {
    let prev = item;
    try { for (const stage of stages) prev = await stage(prev, item, i); return prev; } catch { return null; }
  }));
  const parallel = thunks => Promise.all(thunks.map(t => t().catch(() => null)));
  const result = await body(args, agent, pipeline, parallel, m => logs.push(m), () => {});
  return { result, calls, logs };
}

const two = { targets: [{ id: 'one', url: 'https://one.test' }, { id: 'two', url: 'https://two.test' }], runId: 'r1' };

test('a full run ranks every site and namespaces evidence by run', async () => {
  const { result, calls } = await run(two);
  assert.equal(result.proposals.length, 1);
  assert.deepEqual(result.incomplete, []);
  assert.ok(calls.filter(c => c.role === 'scout').every(c => c.prompt.includes('.studio/') && c.prompt.includes('/r1/')));
});

test('a site whose copy review died is reported incomplete and kept out of ranking', async () => {
  const { result, calls } = await run(two, { copy: label => (label === 'copy:two' ? null : STUB.copy()) });
  assert.deepEqual(result.incomplete, [{ id: 'two', missing: ['copy'] }]);
  const rankPrompt = calls.find(c => c.role === 'rank').prompt;
  assert.ok(rankPrompt.includes('"one"') && !rankPrompt.includes('"two"'));
});

test('a dead scout skips the later stages for that site', async () => {
  const { result, calls } = await run(two, { scout: label => (label === 'scout:one' ? null : STUB.scout()) });
  assert.deepEqual(result.incomplete, [{ id: 'one', missing: ['scout', 'copy', 'search', 'critique'] }]);
  assert.ok(!calls.some(c => c.role === 'critic' && c.prompt.includes('"one"')));
});

test('a missing second provider is surfaced, not hidden', async () => {
  const { result, logs } = await run(two, { critic: () => ({ ...STUB.critic(), independentProvider: 'missing' }) });
  assert.deepEqual(result.unverifiedCritique, ['one', 'two']);
  assert.ok(logs.some(l => l.includes('same-model only')));
});

test('duplicate or unsafe ids refuse to run before any agent starts', async () => {
  const dup = await run({ targets: [{ id: 'x', url: 'https://a.test' }, { id: 'x', url: 'https://b.test' }] });
  assert.equal(dup.result.skipped, 'bad target ids');
  assert.equal(dup.calls.length, 0);
  const unsafe = await run({ targets: [{ id: '../up', url: 'https://a.test' }] });
  assert.equal(unsafe.result.skipped, 'bad target ids');
});

test('ids that differ only in case refuse to run', async () => {
  const { result, calls } = await run({ runId: 'r', targets: [{ id: 'Site', url: 'https://a.test' }, { id: 'site', url: 'https://b.test' }] });
  assert.equal(result.skipped, 'bad target ids');
  assert.equal(calls.length, 0);
});

test('a run without a runId refuses instead of overwriting earlier evidence', async () => {
  const { result, calls } = await run({ targets: [{ id: 'one', url: 'https://one.test' }] });
  assert.equal(result.skipped, 'no runId');
  assert.equal(calls.length, 0);
});

test('no targets is a clean no-op', async () => {
  const { result, calls } = await run(undefined);
  assert.equal(result.skipped, 'no targets');
  assert.equal(calls.length, 0);
});
