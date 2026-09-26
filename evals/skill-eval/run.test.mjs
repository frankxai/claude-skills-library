import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { Budget, GRADERS, MAKERS, budgetedGatewayCall, callCeilingUsd, costUsd, failedPatterns, laneSummary, parseGrade, pickGrader, verdict } from './run.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const cases = JSON.parse(readFileSync(join(HERE, 'cases.json'), 'utf8')).cases;

test('every case points at a real skill and has checks and a rubric', () => {
  for (const c of cases) {
    assert.ok(existsSync(join(HERE, '..', '..', c.skill, 'SKILL.md')), c.skill);
    assert.ok(c.must.length > 0 && c.rubric.length >= 3, c.skill);
    for (const p of c.must) new RegExp(p, 'i');
  }
});

test('a grader never shares the maker family', () => {
  for (const maker of MAKERS) assert.notEqual(pickGrader(maker.family).family, maker.family, maker.id);
  assert.ok(GRADERS.length >= 2);
});

test('missing patterns are reported, case-insensitively', () => {
  assert.deepEqual(failedPatterns('Use a visible LABEL and fix Contrast', ['label', 'contrast', 'wcag']), ['wcag']);
});

test('grades must be one 0/1 per criterion or they are rejected', () => {
  assert.deepEqual(parseGrade('here: {"scores": [1, 0, 1]}', 3), [1, 0, 1]);
  assert.equal(parseGrade('{"scores": [1, 0]}', 3), null);
  assert.equal(parseGrade('no json', 3), null);
});

test('cost uses per-token gateway prices', () => {
  assert.equal(costUsd({ input: '0.0000014', output: '0.0000044' }, { inputTokens: 1_000_000, outputTokens: 100_000 }), 1.4 + 0.44);
  assert.equal(costUsd(undefined, { inputTokens: 10 }), null);
  assert.equal(costUsd({ input: '0.0000014', output: '0.0000044' }, { inputTokens: 10 }), null);
  assert.ok(callCeilingUsd({ input: '0.0000014', output: '0.0000044' }, 'system', 'prompt') > 0);
});

test('a lane with nothing graded is unavailable, not failing or passing', () => {
  assert.equal(laneSummary([{ status: 'unavailable' }]).verdict, 'UNAVAILABLE');
  const s = laneSummary([{ status: 'graded', pass: true, rubricScore: 1 }, { status: 'graded', pass: false, rubricScore: 0.4 }]);
  assert.deepEqual([s.verdict, s.passRate], ['REVISE', 0.5]);
  assert.equal(verdict(0.8), 'PROCEED');
  assert.equal(verdict(0.49), 'STOP');
  const partial = laneSummary([{ status: 'graded', pass: true, rubricScore: 1 }, { status: 'error' }]);
  assert.deepEqual([partial.verdict, partial.passRate], ['INCOMPLETE', 0.5]);
  assert.equal(laneSummary([{ status: 'skipped-budget' }]).verdict, 'INCOMPLETE');
});

test('budget reserves each call before it starts', () => {
  const b = new Budget(0.05);
  assert.equal(b.reserve(0.03), true);
  assert.equal(b.reserve(0.03), false);
  b.settle(0.03, 0.02);
  assert.equal(b.spent, 0.02);
  assert.equal(b.exhausted, false);
  assert.equal(b.reserve(0.03), true);
  b.settle(0.03, 0.03);
  assert.equal(b.exhausted, true);
  assert.throws(() => new Budget(3), /at most 2/);
});

test('missing price or insufficient reservation makes no model call', async () => {
  let calls = 0;
  const invoke = async () => { calls++; return { text: 'answer', usage: { inputTokens: 10, outputTokens: 10 } }; };
  const budget = new Budget(0.001);
  assert.equal((await budgetedGatewayCall(budget, null, 'model', 'system', 'prompt', invoke)).status, 'unpriced');
  assert.equal((await budgetedGatewayCall(budget, { input: 0.01, output: 0.01 }, 'model', 'system', 'prompt', invoke)).status, 'skipped-budget');
  assert.equal(calls, 0);
});

test('unknown usage stops later metered calls and keeps spend unknown', async () => {
  const budget = new Budget(2);
  const price = { input: 0.000001, output: 0.000001 };
  const first = await budgetedGatewayCall(budget, price, 'model', 'system', 'prompt', async () => ({ text: 'answer', usage: {} }));
  assert.equal(first.status, 'metering-unavailable');
  assert.equal(budget.unknown, true);
  let called = false;
  const second = await budgetedGatewayCall(budget, price, 'model', 'system', 'prompt', async () => { called = true; });
  assert.equal(second.status, 'skipped-budget');
  assert.equal(called, false);
});

test('a call above its reservation is recorded and stops later calls', async () => {
  const budget = new Budget(2);
  const price = { input: 0.000001, output: 0.000001 };
  const first = await budgetedGatewayCall(budget, price, 'model', 'system', 'prompt',
    async () => ({ text: 'answer', usage: { inputTokens: 100_000, outputTokens: 10 } }));
  assert.equal(first.status, 'budget-breach');
  assert.equal(budget.breached, true);
  assert.ok(budget.spent > 0);
  assert.equal((await budgetedGatewayCall(budget, price, 'model', 'system', 'prompt',
    async () => { throw new Error('must not call'); })).status, 'skipped-budget');
});
