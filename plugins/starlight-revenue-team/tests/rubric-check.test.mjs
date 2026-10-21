import test from 'node:test';
import assert from 'node:assert/strict';
import { checkScore, exitCodeFor, CRITERIA } from '../bin/rubric-check.mjs';

const scores = (values) => Object.fromEntries(CRITERIA.map((name, i) => [name, { score: values[i], reason: 'r' }]));
const base = (values, extra = {}) => ({ makerProvider: 'anthropic', scorerProvider: 'openai', criteria: scores(values), ...extra });

test('26 or more from an independent provider ships', () => {
  const r = checkScore(base([5, 4, 4, 5, 4, 4]));
  assert.equal(r.total, 26);
  assert.equal(r.verdict, 'ship');
  assert.equal(exitCodeFor(r), 0);
});

test('22 to 25 is revise and 21 is restart', () => {
  assert.equal(checkScore(base([4, 4, 4, 4, 3, 3])).verdict, 'revise');
  assert.equal(checkScore(base([4, 4, 4, 3, 3, 3])).verdict, 'restart');
});

test('a same-provider score never ships, even at 30', () => {
  const r = checkScore(base([5, 5, 5, 5, 5, 5], { scorerProvider: ' Anthropic ' }));
  assert.equal(r.verdict, 'missing-independent');
  assert.equal(exitCodeFor(r), 2);
});

test('plain numbers are accepted as criterion values', () => {
  const r = checkScore({ makerProvider: 'a', scorerProvider: 'b', criteria: Object.fromEntries(CRITERIA.map((n) => [n, 5])) });
  assert.equal(r.total, 30);
});

test('a total that disagrees with the criteria is invalid', () => {
  const r = checkScore(base([5, 5, 5, 5, 5, 5], { total: 29 }));
  assert.equal(r.ok, false);
  assert.equal(exitCodeFor(r), 1);
});

test('missing, unknown and out-of-range criteria are invalid', () => {
  const missing = base([5, 5, 5, 5, 5, 5]);
  delete missing.criteria.voice;
  assert.match(checkScore(missing).errors.join(), /criterion missing: voice/);

  const unknown = base([5, 5, 5, 5, 5, 5]);
  unknown.criteria.vibes = 5;
  assert.match(checkScore(unknown).errors.join(), /unknown criterion: vibes/);

  assert.equal(checkScore(base([6, 5, 5, 5, 5, 5])).ok, false);
  assert.equal(checkScore(base([4.5, 5, 5, 5, 5, 5])).ok, false);
});

test('providers are required and non-objects are rejected', () => {
  assert.equal(checkScore(base([5, 5, 5, 5, 5, 5], { scorerProvider: '' })).ok, false);
  assert.equal(checkScore([]).ok, false);
  assert.equal(checkScore(null).ok, false);
});
