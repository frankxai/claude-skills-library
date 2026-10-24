// Structural tests for the skills-with-evals pack. No network, no model, no claude binary.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { lintSkill, parseFrontmatter } from '../trigger-lint.mjs';
import { renderCard } from '../eval-card.mjs';
import { haltsPack, isolationProblems, parseArgs as packArgs } from '../run-pack-lift.mjs';
import { mkdtempSync, writeFileSync as writeF, mkdirSync as mkdirS } from 'node:fs';
import { tmpdir } from 'node:os';

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const PACK = JSON.parse(readFileSync(join(REPO, 'products/skills-with-evals/pack.json'), 'utf8'));
const MARKET = JSON.parse(readFileSync(join(REPO, '.claude-plugin/marketplace.json'), 'utf8'));
const walk = (d) => readdirSync(d).flatMap((n) => { const p = join(d, n); return statSync(p).isDirectory() ? walk(p) : [p]; });

test('every pack skill has a recall, a precision and a no-trigger case, and one grader per answer-key entry', () => {
  assert.equal(PACK.skills.length, 10);
  for (const s of PACK.skills) {
    const suite = join(REPO, 'evals', s);
    const key = readFileSync(join(suite, 'seeded-defects', 'KEY.md'), 'utf8').split('\n').filter((l) => /^\d+\.\s/.test(l) || /^\|\s*\d+\s*\|/.test(l));
    const graders = readdirSync(join(suite, 'seeded-defects', 'graders')).filter((f) => /^d\d+-/.test(f));
    assert.ok(key.length >= 7, `${s}: at least 7 planted defects (has ${key.length})`);
    assert.equal(graders.length, key.length, `${s}: one grader per planted defect`);
    const cleanDir = ['clean', 'clean-form', 'clean-chapter', 'clean-section'].map((c) => join(suite, c)).find(existsSync);
    assert.ok(cleanDir, `${s}: has a clean (precision) case`);
    assert.ok(readdirSync(join(cleanDir, 'graders')).some((f) => f === 'no-unsupported-claims.md'), `${s}: precision grader`);
    const nt = readFileSync(join(suite, 'no-trigger', 'case.yaml'), 'utf8');
    assert.match(nt, /should-not-trigger/);
    assert.match(nt, /max: 0/);
    assert.match(nt, /arm: both/);
  }
});

test('no case.yaml uses an escape YAML double-quoted strings reject (a case that cannot load is a silent hole)', () => {
  const bad = [];
  for (const f of walk(join(REPO, 'evals')).filter((p) => p.endsWith('case.yaml'))) {
    for (const [i, line] of readFileSync(f, 'utf8').split('\n').entries()) {
      for (const m of line.matchAll(/"((?:[^"\\]|\\.)*)"/g)) {
        const esc = m[1].match(/\\(.)/g) || [];
        for (const e of esc) if (!/\\[0abtnvfre "\/\\N_LPxuU\t]/.test(e)) bad.push(`${f.slice(REPO.length + 1)}:${i + 1} ${e}`);
      }
    }
  }
  assert.deepEqual(bad, []);
});

test('the pack marketplace entry lists exactly the pack skills, by paths that exist, under a name Claude Code allows', () => {
  const entry = MARKET.plugins.find((p) => p.name === 'skills-with-evals');
  assert.ok(entry);
  assert.doesNotMatch(entry.name, /^(claude-|anthropic-|anthropics-|cc-plugin-)|^(claude|anthropic|anthropics|claude-code|claude-mods)$/);
  const names = entry.skills.map((p) => p.split('/').pop());
  assert.deepEqual([...names].sort(), [...PACK.skills].sort());
  for (const p of entry.skills) assert.ok(existsSync(join(REPO, p, 'SKILL.md')), p);
});

test('no plugin in the marketplace uses a name Claude Code reserves (claude plugin validate rule)', () => {
  const reserved = /^(claude-|anthropic-|anthropics-|cc-plugin-)|^(claude|anthropic|anthropics|claude-code|claude-mods)$|official.*(claude|anthropic)|(claude|anthropic).*official/;
  for (const p of MARKET.plugins) assert.doesNotMatch(p.name, reserved, `plugin name "${p.name}" is reserved`);
  assert.equal(MARKET.plugins[0].name, 'frankx-skills');
});

test('trigger-lint finds the cue position, parses folded descriptions, and fails a broken name', () => {
  const fm = parseFrontmatter('---\nname: x\ndescription: >-\n  Reviews diffs.\n  Use when a PR is opened.\n---\nbody\n');
  assert.equal(fm.fm.description, 'Reviews diffs. Use when a PR is opened.');
  const seeded = lintSkill(join(REPO, 'evals/skill-builder/seeded-defects/resources/deploy-helper'));
  assert.ok(seeded.errors.some((e) => /not lowercase-hyphen/.test(e)));
  assert.ok(seeded.errors.some((e) => /1024/.test(e)));
  const clean = lintSkill(join(REPO, 'evals/skill-builder/clean/resources/db-migration-check'));
  assert.deepEqual(clean.errors, []);
  assert.ok(clean.cueAt !== null && clean.cueAt <= 100, `clean fixture cue within Codex window (at ${clean.cueAt})`);
});

test('cards are generated from files and never claim lift without a result file', () => {
  for (const s of PACK.skills) {
    const card = renderCard(s);
    assert.equal(readFileSync(join(REPO, 'evals', s, 'CARD.md'), 'utf8'), card, `${s}: CARD.md is stale; run node scripts/eval-card.mjs`);
    const hasResult = existsSync(join(REPO, 'evals', s, 'results')) && readdirSync(join(REPO, 'evals', s, 'results')).some((f) => f.endsWith('.json'));
    if (!hasResult) assert.match(card, /Not measured yet\. No lift is claimed\./);
  }
});

test('run-pack-lift parses caps, rejects skills outside the pack, and halts only on auth or rate-limit stops', () => {
  const o = packArgs(['--skills', 'github-code-review,nextjs-expert', '--per-skill-usd', '1', '--runs', '1']);
  assert.deepEqual(o.skillList, ['github-code-review', 'nextjs-expert']);
  assert.equal(o.model, 'sonnet');
  assert.equal(packArgs([])['total-usd'], '50');
  assert.throws(() => packArgs(['--skills', 'not-a-pack-skill']), /not in the pack/);
  assert.throws(() => packArgs(['--per-skill-usd', '0']), /positive/);
  assert.throws(() => packArgs(['--bogus', '1']), /unknown option/);
  assert.equal(haltsPack('auth_failed'), true);
  assert.equal(haltsPack('rate_limited'), true);
  assert.equal(haltsPack('cost_ceiling'), false);
  assert.equal(haltsPack(undefined), false);
});

test('isolationProblems passes a clean pair of runs and flags foreign plugins, leaked pack skills and a skill in the baseline arm', () => {
  const dir = mkdtempSync(join(tmpdir(), 'iso-'));
  const init = (plugins, skills) => JSON.stringify({ type: 'system', subtype: 'init', model: 'claude-sonnet-5-5', plugins, skills }) + '\n';
  const builtin = { name: 'cc-plugin-agents-md', source: 'cc-plugin-agents-md@builtin' };
  const staged = { name: 'eval-nextjs-expert', source: 'eval-nextjs-expert@inline' };
  const files = {
    w: init([staged, builtin], ['code-review', 'eval-nextjs-expert:nextjs-expert']),
    wo: init([builtin], ['code-review']),
    bad: init([builtin, { name: 'frankx-skills', source: 'frankx-skills@claude-skills-library' }], ['frankx-skills:github-code-review']),
    leak: init([staged], ['eval-nextjs-expert:nextjs-expert']),
  };
  for (const [k, v] of Object.entries(files)) writeF(join(dir, `${k}.jsonl`), v);
  const r = (w, wo) => ({ cases: [{ name: 'c', arms: { with: [{ tracePath: `${w}.jsonl` }], without: [{ tracePath: `${wo}.jsonl` }] } }] });
  const ok = isolationProblems(r('w', 'wo'), 'nextjs-expert', dir);
  assert.deepEqual(ok.problems, []);
  assert.deepEqual(ok.models, ['claude-sonnet-5-5']);
  assert.match(isolationProblems(r('w', 'bad'), 'nextjs-expert', dir).problems.join(' '), /unexpected plugin\(s\) frankx-skills/);
  assert.match(isolationProblems(r('w', 'leak'), 'nextjs-expert', dir).problems.join(' '), /no-skill arm loaded the skill/);
  assert.match(isolationProblems(r('w', 'missing'), 'nextjs-expert', dir).problems.join(' '), /no trace/);
});
