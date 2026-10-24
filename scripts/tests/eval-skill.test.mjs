import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync as makeTemp, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import test, { after } from 'node:test';
import { fileURLToPath } from 'node:url';

import { comparability, parseArgs, renderScorecard, stage, treeHash } from '../eval-skill.mjs';

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const made = [];
const mkdtempSync = (prefix) => { const d = makeTemp(prefix); made.push(d); return d; };
after(() => made.forEach((d) => rmSync(d, { recursive: true, force: true })));

function fixtureRepo() {
  const repo = mkdtempSync(join(tmpdir(), 'eval-skill-repo-'));
  mkdirSync(join(repo, 'free-skills', 'demo'), { recursive: true });
  writeFileSync(join(repo, 'free-skills', 'demo', 'SKILL.md'), '---\nname: demo\ndescription: d\n---\nbody\n');
  const c = join(repo, 'evals', 'demo', 'case-a');
  mkdirSync(join(c, 'graders'), { recursive: true });
  mkdirSync(join(c, 'resources'), { recursive: true });
  writeFileSync(join(c, 'prompt.md'), '---\nruns: 1\n---\nReview it.\n');
  writeFileSync(join(c, 'graders', 'g.md'), '---\ntype: llm\n---\nPASS if x.\n');
  writeFileSync(join(c, 'resources', 'page.html'), '<p>x</p>');
  writeFileSync(join(c, 'KEY.md'), 'the answers');
  mkdirSync(join(repo, 'evals', 'demo', 'results'), { recursive: true });
  writeFileSync(join(repo, 'evals', 'demo', 'results', 'old.json'), '{}');
  return repo;
}

const COMPLETE = {
  costUsd: 0.4,
  aggregates: { overallScore: 0.9, meanDelta: 0.25 },
  cases: [{ name: 'case-a', aggregates: { score: 0.9, delta: 0.25 }, arms: { with: [{}, {}, {}], without: [{}, {}, {}] } }],
};
const META = { stamp: '2026-10-20T02-00-00Z', claudeVersion: '2.1.303', judgeModel: 'claude-haiku-4-5', by: 'test', skillHash: 'aaa', suiteHash: 'bbb' };

test('stage builds a plugin from the single skill copy and keeps the answer key and old results out', () => {
  const repo = fixtureRepo();
  const { plugin, cases } = stage(repo, 'demo', mkdtempSync(join(tmpdir(), 'eval-skill-out-')));
  assert.deepEqual(cases, ['case-a']);
  assert.equal(JSON.parse(readFileSync(join(plugin, '.claude-plugin', 'plugin.json'), 'utf8')).name, 'eval-demo');
  assert.ok(existsSync(join(plugin, 'skills', 'demo', 'SKILL.md')));
  assert.ok(existsSync(join(plugin, 'evals', 'case-a', 'resources', 'page.html')));
  assert.ok(!existsSync(join(plugin, 'evals', 'case-a', 'KEY.md')));
  assert.ok(!existsSync(join(plugin, 'evals', 'results')));
});

test('stage refuses a skill without a suite', () => {
  const repo = fixtureRepo();
  mkdirSync(join(repo, 'free-skills', 'lonely'), { recursive: true });
  writeFileSync(join(repo, 'free-skills', 'lonely', 'SKILL.md'), 'x');
  assert.throws(() => stage(repo, 'lonely', mkdtempSync(join(tmpdir(), 'o-'))), /no eval suite/);
});

test('parseArgs rejects unknown flags, missing values and unsafe values', () => {
  assert.equal(parseArgs(['demo', '--runs', '2']).runs, '2');
  assert.throws(() => parseArgs(['demo', '--rnus', '2']), /unknown option/);
  assert.throws(() => parseArgs(['demo', '--runs']), /needs a value/);
  assert.throws(() => parseArgs(['demo', '--runs', '0']), /invalid value/);
  assert.throws(() => parseArgs(['demo', '--judge-model', 'haiku & calc']), /invalid value/);
  assert.throws(() => parseArgs(['../etc']), /skill folder name/);
});

test('a complete two-arm result is comparable and the scorecard derives the no-skill score', () => {
  assert.deepEqual(comparability(COMPLETE), []);
  const md = renderScorecard('demo', COMPLETE, META);
  assert.match(md, /\| case-a \| 90% \| 65% \| \+25 pts \| 3 \/ 3 \|/);
  assert.match(md, /Comparable run/);
});

test('unequal arms, errors, skipped judges and partial runs block a lift claim', () => {
  const bad = structuredClone(COMPLETE);
  bad.partial = true;
  bad.cases[0].arms.without = [{}, { error: 'x' }];
  bad.cases[0].arms.with[0] = { skippedPaidGraders: true };
  const problems = comparability(bad).join(' | ');
  assert.match(problems, /partial run/);
  assert.match(problems, /3 runs with the skill but 2 without/);
  assert.match(problems, /errored/);
  assert.match(problems, /judge graders were skipped/);
  assert.match(renderScorecard('demo', bad, META), /Not comparable, so no claim of lift/);
});

test('every suite in evals/ tests the free-skills/ copy and stages, with no second copy of a skill', () => {
  const NOT_SUITES = new Set(['skill-eval', '_runs']);
  const suites = readdirSync(join(REPO, 'evals'), { withFileTypes: true })
    .filter((d) => d.isDirectory() && !NOT_SUITES.has(d.name)).map((d) => d.name);
  assert.ok(suites.length >= 11, `expected at least 11 suites, found ${suites.length}`);
  for (const skill of suites) {
    assert.ok(existsSync(join(REPO, 'free-skills', skill, 'SKILL.md')), `evals/${skill} has no free-skills/${skill}`);
    const { cases } = stage(REPO, skill, mkdtempSync(join(tmpdir(), 'eval-skill-all-')));
    assert.ok(cases.length >= 1, skill);
    assert.ok(!existsSync(join(REPO, 'packs', 'skills-with-evals', 'skills', skill)), `second copy of ${skill} in packs/`);
  }
});

test('treeHash ignores line endings and changes with content', () => {
  const a = mkdtempSync(join(tmpdir(), 'h-'));
  const b = mkdtempSync(join(tmpdir(), 'h-'));
  writeFileSync(join(a, 'x.md'), 'one\ntwo\n');
  writeFileSync(join(b, 'x.md'), 'one\r\ntwo\r\n');
  assert.equal(treeHash(a), treeHash(b));
  writeFileSync(join(b, 'x.md'), 'one\nthree\n');
  assert.notEqual(treeHash(a), treeHash(b));
});
