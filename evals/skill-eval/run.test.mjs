import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { Budget, GRADERS, MAKERS, costUsd, failedPatterns, laneSummary, parseGrade, pickGrader, verdict } from './run.mjs';

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
  assert.equal(costUsd(undefined, { inputTokens: 10 }), 0);
});

test('a lane with nothing graded is unavailable, not failing or passing', () => {
  assert.equal(laneSummary([{ status: 'unavailable' }]).verdict, 'UNAVAILABLE');
  const s = laneSummary([{ status: 'graded', pass: true, rubricScore: 1 }, { status: 'graded', pass: false, rubricScore: 0.4 }]);
  assert.deepEqual([s.verdict, s.passRate], ['REVISE', 0.5]);
  assert.equal(verdict(0.8), 'PROCEED');
  assert.equal(verdict(0.49), 'STOP');
});

test('budget stops further calls once spent', () => {
  const b = new Budget(0.05);
  b.add(0.03);
  assert.equal(b.exhausted, false);
  b.add(0.03);
  assert.equal(b.exhausted, true);
});
