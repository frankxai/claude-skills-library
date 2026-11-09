import { test } from 'node:test';
import assert from 'node:assert/strict';
import { gpuPlan, medianMs, withinBudget, FRAME_BUDGET_MS } from '../examples/gpu-glass/glass-gate.mjs';

const capable = {
  webgl2: true,
  reducedMotion: false,
  reducedTransparency: false,
  saveData: false,
  deviceMemory: 8,
  viewportWidth: 1440,
};

test('a capable desktop gets WebGL', () => {
  assert.deepEqual(gpuPlan(capable), { mode: 'webgl', reason: 'capable' });
});

test('every refusal keeps the CSS glass and says why', () => {
  const cases = [
    [{ webgl2: false }, 'no WebGL2'],
    [{ reducedMotion: true }, 'reduced motion requested'],
    [{ reducedTransparency: true }, 'reduced transparency requested'],
    [{ saveData: true }, 'data saver on'],
    [{ deviceMemory: 2 }, 'device memory 2 GB'],
    [{ viewportWidth: 390 }, 'phone layout'],
  ];
  for (const [patch, reason] of cases) {
    assert.deepEqual(gpuPlan({ ...capable, ...patch }), { mode: 'css', reason });
  }
});

test('unknown device memory (Safari, Firefox) is not treated as low', () => {
  assert.equal(gpuPlan({ ...capable, deviceMemory: undefined }).mode, 'webgl');
});

test('the 900px boundary matches the prototype breakpoint', () => {
  assert.equal(gpuPlan({ ...capable, viewportWidth: 899 }).mode, 'css');
  assert.equal(gpuPlan({ ...capable, viewportWidth: 900 }).mode, 'webgl');
});

test('one slow shader-compile frame does not fail the budget', () => {
  assert.equal(withinBudget([40, 2, 2, 3, 2]), true);
});

test('a consistently slow device fails the budget', () => {
  assert.equal(withinBudget([9, 10, 12, 9, 11]), false);
  assert.equal(withinBudget([FRAME_BUDGET_MS, FRAME_BUDGET_MS]), true);
});

test('no valid samples means no budget, so CSS wins', () => {
  assert.equal(medianMs([]), Infinity);
  assert.equal(withinBudget([NaN, -1]), false);
  assert.equal(medianMs([1, 3]), 2);
});
