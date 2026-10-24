#!/usr/bin/env node
// One-page card per pack skill: what it does, when it triggers, what the eval checks, measured lift.
//
//   node scripts/eval-card.mjs [skill ...]      (default: every skill in the pack manifest)
//   node scripts/eval-card.mjs --check          (exit 1 if any CARD.md is stale)
//   node scripts/eval-card.mjs --json [out]     (the same facts as data, for the buyer page)
//
// Every number on a card comes from a file: the skill's frontmatter, the suite's case files and
// answer key, scripts/trigger-lint.mjs, and the latest results/<stamp>.json written by
// scripts/eval-skill.mjs from `claude plugin eval`. A card never carries a typed-in lift figure.

import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { lintSkill, parseFrontmatter } from './trigger-lint.mjs';
import { stage, treeHash } from './eval-skill.mjs';

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const RC_REF = 'agent/hyperagent/eval-pack-rc1';
const PACK = JSON.parse(readFileSync(join(REPO, 'products', 'skills-with-evals', 'pack.json'), 'utf8'));
const pct = (x) => (typeof x === 'number' ? `${Math.round(x * 100)}%` : 'n/a');
const pts = (x) => (typeof x === 'number' ? `${x > 0 ? '+' : ''}${Math.round(x * 100)} pts` : 'n/a');

function skillDir(skill) {
  for (const r of ['free-skills', 'free-skills/technical', 'free-skills/creative', 'free-skills/anthropic']) {
    const d = join(REPO, r, skill);
    if (existsSync(join(d, 'SKILL.md'))) return d;
  }
  throw new Error(`no skill ${skill}`);
}

// Grader counts for pack skills come from pack.json ("heldOut"): the graders themselves are held out.
function readCase(dir, skill, name) {
  const yaml = existsSync(join(dir, 'case.yaml')) ? readFileSync(join(dir, 'case.yaml'), 'utf8') : '';
  const prompt = existsSync(join(dir, 'prompt.md')) ? readFileSync(join(dir, 'prompt.md'), 'utf8') : '';
  const desc = (/^description:\s*"?(.*?)"?\s*$/m.exec(prompt) || /^description:\s*"?(.*?)"?\s*$/m.exec(yaml) || [])[1] || '';
  const held = PACK.heldOut?.[skill]?.graders;
  const graders = held ? held[name] ?? 0
    : existsSync(join(dir, 'graders')) && statSync(join(dir, 'graders')).isDirectory() ? readdirSync(join(dir, 'graders')).filter((f) => f.endsWith('.md')).length
    : (yaml.match(/^\s+- name:/gm) || []).length;
  const execPrompt = (/execution:\s*\n\s+prompt:\s*("(?:[^"\\]|\\.)*")/.exec(yaml) || [])[1];
  return { desc, graders, noTrigger: /should-not-trigger/.test(yaml + prompt), prompt: execPrompt ? JSON.parse(execPrompt) : null };
}

// Hashes of the skill and of the suite exactly as scripts/eval-skill.mjs stages them for a run.
export function currentHashes(skill) {
  const tmp = mkdtempSync(join(tmpdir(), 'card-hash-'));
  try {
    const { cases, suiteHash } = stage(REPO, skill, tmp, { heldOut: false });
    return { skillHash: treeHash(join(REPO, 'free-skills', skill)), suiteHash, cases };
  } finally { rmSync(tmp, { recursive: true, force: true }); }
}

// A result only describes the skill and suite it ran against (G3 P1-5): if either changed since, the card must not
// show its numbers as the skill's lift.
export function staleness(res, current) {
  const out = [];
  const meta = res?.meta || {};
  if (meta.skillHash !== current.skillHash) out.push(`the skill changed since the run (${meta.skillHash || 'no hash'} → ${current.skillHash})`);
  if (meta.suiteHash !== current.suiteHash) out.push(`the suite changed since the run (${meta.suiteHash || 'no hash'} → ${current.suiteHash})`);
  return out;
}

// Every case in the suite must have runs in the result, or the lift describes only part of the suite.
export function coverage(res, current) {
  const ran = new Set(res?.summary ? (res.summary.cases || []).map((c) => c.name)
    : (res?.result?.cases || []).map((c) => (c.dir ? c.dir.split(/[\\/]/).filter(Boolean).at(-1) : c.name)));
  const missing = current.cases.filter((c) => !ran.has(c));
  return missing.length ? [`the result has no runs for ${missing.join(', ')}`] : [];
}

// The newest public summary (aggregates only; raw results are private, scripts/held-out.mjs).
function latestResult(skill) {
  const dir = join(REPO, 'evals', skill, 'results');
  if (!existsSync(dir)) return null;
  const files = readdirSync(dir).filter((f) => f.endsWith('.summary.json')).sort();
  return files.length ? { file: files.at(-1), ...JSON.parse(readFileSync(join(dir, files.at(-1)), 'utf8')) } : null;
}

export function renderCard(skill) {
  const dir = skillDir(skill);
  const { fm } = parseFrontmatter(readFileSync(join(dir, 'SKILL.md'), 'utf8'));
  const lint = lintSkill(dir);
  const suite = join(REPO, 'evals', skill);
  const cases = readdirSync(suite, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith('_') && d.name !== 'results'
      && (existsSync(join(suite, d.name, 'case.yaml')) || existsSync(join(suite, d.name, 'prompt.md'))))
    .map((d) => ({ name: d.name, ...readCase(join(suite, d.name), skill, d.name) }));
  const seeded = PACK.heldOut?.[skill]?.planted ?? 0;
  const quiet = cases.find((c) => c.noTrigger);
  const desc = (fm.description || '').replace(/\s+/g, ' ').trim();
  const cueText = lint.cueAt === null ? 'no "use when" cue found' : `"use when" cue starts at character ${lint.cueAt}`;
  const codexVisible = lint.cueAt !== null && lint.cueAt <= 100;

  const res = latestResult(skill);
  let lift;
  if (!res) {
    lift = [
      '**Not measured yet. No lift is claimed.**',
      '',
      `Measure it: \`node scripts/eval-skill.mjs ${skill} --runs 3 --max-cost-usd 5 --model claude-sonnet-5-5\` (needs a signed-in \`claude\`). The scorecard and this card update from the result file.`,
    ];
  } else {
    const r = res.summary || {};
    const now = currentHashes(skill);
    const stale = staleness(res, now);
    const problems = [...stale, ...coverage(res, now), ...(r.problems || [])];
    const rows = (r.cases || []).map((c) => `| ${c.name} | ${pct(c.with)} | ${pct(typeof c.with === 'number' && typeof c.delta === 'number' ? c.with - c.delta : undefined)} | ${pts(c.delta)} | ${c.runsWith}/${c.runsWithout} |`);
    const quietText = typeof r.quietWithScore === 'number' ? `${pct(r.quietWithScore)} with the skill loaded (100% means it never fired on the unrelated task)` : 'n/a';
    lift = [
      stale.length ? `**Stale result, so no lift is claimed.** ${stale.join('; ')}. Re-run the suite.`
        : problems.length ? `**Not comparable, so no lift is claimed.** ${problems.join('; ')}.`
        : r.runsPerArm < 3 ? `**Pilot only (${r.runsPerArm} run per arm), so no lift is claimed.** Lift over the review cases in this pilot: ${pts(r.reviewLift)}. A lift claim needs at least 3 runs per arm.`
        : `**Measured lift over the review cases (${r.runsPerArm} runs per arm): ${pts(r.reviewLift)}.** No-skill baseline: ${pct(r.baselineScore)}. Fires on its job: ${r.fired ? `${r.fired.fired} of ${r.fired.of} with-skill runs` : 'n/a'}. Stay-quiet case: ${quietText}.`,
      '',
      '| Case | With skill | Without | Lift | Runs (with/without) |',
      '|---|---|---|---|---|',
      ...rows,
      '',
      `Source: \`evals/${skill}/results/${res.file}\` (aggregates only; the raw result, report and traces are held out with the graders), \`claude plugin eval\` ${res.meta?.claudeVersion || ''}, model ${res.meta?.model || 'CLI default'}, judge ${res.meta?.judgeModel || 'n/a'}, cost about $${(r.costUsd ?? 0).toFixed(2)}. Judge is the same provider as the model under test until the G3 cross-family check.`,
    ];
  }

  return [
    `# ${skill}`,
    '',
    `> Card for the **Skills that ship with their evals** pack. Generated by \`scripts/eval-card.mjs\`; do not edit by hand.`,
    '',
    '## What it does',
    '',
    PACK.jobs?.[skill] || desc,
    '',
    '## When it triggers',
    '',
    `Routing text (the only part an agent sees before loading the skill): "${desc}"`,
    '',
    `- ${cueText}. ${codexVisible ? 'Survives' : 'Would be cut by'} Codex trimming descriptions on a large install (about 100 characters once roughly 80 or more skills are installed; full text on small installs).`,
    quiet ? `- Trigger test: fires on the review tasks below; must stay quiet on an adjacent task such as "${(quiet.prompt || quiet.desc).replace(/\.$/, "")}".` : '- Trigger test: no should-not-trigger case yet.',
    `- Context cost: listed in every session; full body loads only when it fires (${lint.warnings.find((w) => w.startsWith('body')) || 'body under 500 lines'}).`,
    '',
    '## What the eval checks',
    '',
    '| Case | What it measures | Graders |',
    '|---|---|---|',
    ...cases.map((c) => `| ${c.name} | ${c.desc || (c.noTrigger ? 'Stays quiet on an adjacent task' : '')} | ${c.graders} |`),
    '',
    `${seeded ? `${seeded} planted defects in the recall case. The answer key and the graders are held out: never shown to the model, and not published. ` : ''}Every case runs twice: with the skill and with no skill (baseline), same model and prompt.`,
    '',
    '## Measured lift',
    '',
    ...lift,
    '',
    '## Install',
    '',
    `Release candidate: until this pack is merged to \`main\`, pin the branch (\`#\` for Claude Code, \`@\` for Codex).`,
    '',
    '```bash',
    '# Claude Code (2.1.310 tested)',
    `claude plugin marketplace add frankxai/claude-skills-library#${RC_REF}`,
    'claude plugin install skills-with-evals@claude-skills-library',
    '# Codex (codex-cli 0.164.0 tested)',
    `codex plugin marketplace add frankxai/claude-skills-library@${RC_REF}`,
    'codex plugin add skills-with-evals@claude-skills-library',
    '```',
    '',
    'After merge, drop the `#…` / `@…` suffix. Already added this marketplace from `main`? Remove it first (`claude plugin marketplace remove claude-skills-library`, `codex plugin marketplace remove claude-skills-library`): both runtimes refuse a second source under the same name.',
    '',
  ].join('\n');
}

// The facts behind a card, as data. Lift is null until a result file exists; then it carries the
// numbers and whether they are comparable and backed by at least 3 runs per arm.
export function cardData(skill) {
  const dir = skillDir(skill);
  const { fm } = parseFrontmatter(readFileSync(join(dir, 'SKILL.md'), 'utf8'));
  const lint = lintSkill(dir);
  const suite = join(REPO, 'evals', skill);
  const cases = readdirSync(suite, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith('_') && d.name !== 'results'
      && (existsSync(join(suite, d.name, 'case.yaml')) || existsSync(join(suite, d.name, 'prompt.md'))))
    .map((d) => ({ name: d.name, ...readCase(join(suite, d.name), skill, d.name) }));
  const planted = PACK.heldOut?.[skill]?.planted ?? 0;
  const recall = cases.find((c) => c.name === 'seeded-defects');
  const quiet = cases.find((c) => c.noTrigger);
  const res = latestResult(skill);
  let lift = null;
  if (res) {
    const r = res.summary || {};
    const now = currentHashes(skill);
    const stale = staleness(res, now);
    const problems = [...stale, ...coverage(res, now), ...(r.problems || [])];
    lift = {
      comparable: !problems.length, stale: stale.length > 0, problems, runsPerArm: r.runsPerArm ?? 0,
      reviewLift: r.reviewLift ?? null, baselineScore: r.baselineScore ?? null, fired: r.fired ?? null, quietWithScore: r.quietWithScore ?? null,
      meanDelta: r.meanDelta ?? null, withScore: r.overallScore ?? null,
      cases: (r.cases || []).map((c) => ({ name: c.name, with: c.with ?? null, delta: c.delta ?? null })),
      model: res.meta?.model || null, claudeVersion: res.meta?.claudeVersion || null, stamp: res.meta?.stamp || null, file: `evals/${skill}/results/${res.file}`,
    };
  }
  return {
    skill, job: PACK.jobs?.[skill] || (fm.description || ''),
    test: (recall?.desc || '').replace(/^Recall\.\s*/, ''), planted,
    cases: cases.map((c) => c.name), clean: cases.some((c) => /^clean/.test(c.name)),
    quietTask: quiet ? (quiet.prompt || quiet.desc).replace(/\.$/, '') : null,
    cueAt: lint.cueAt, cueSurvivesLargeCodexInstall: lint.cueAt !== null && lint.cueAt <= 100,
    lift,
  };
}

// ---- Flagship: one skill shown in full, method and aggregate results only (buyer critique; CEO guardrail) ----
// Never shown here, on the buyer page or anywhere public: the answer key, which problems are planted, grader
// expected outputs, per-problem results or model answers. Any of those leaks the eval.
export const FLAGSHIP = 'github-code-review';
const README_PATH = join(REPO, 'products', 'skills-with-evals', 'README.md');
const MARK = ['<!-- flagship:start (generated by scripts/eval-card.mjs; do not edit by hand) -->', '<!-- flagship:end -->'];

// Aggregate measurements per arm, read from the public summary only.
export function flagshipMeasures(summary) {
  const s = summary || {};
  const arm = (a) => ({
    foundMean: s.recall?.[a === 'with' ? 'foundMeanWith' : 'foundMeanWithout'] ?? null,
    falseAlarmRate: s.falseAlarmRate?.[a] ?? null,
    costPerRunUsd: s.perRun?.[a === 'with' ? 'costUsdWith' : 'costUsdWithout'] ?? null,
    secondsPerRun: s.perRun?.[a === 'with' ? 'secondsWith' : 'secondsWithout'] ?? null,
  });
  return { with: arm('with'), without: arm('without'), runsPerArm: s.runsPerArm ?? 0 };
}

export function flagshipData(skill = FLAGSHIP) {
  const card = cardData(skill);
  const suite = join(REPO, 'evals', skill);
  const descOf = (c) => readCase(join(suite, c), skill, c).desc.replace(/^(Recall|Precision)\.\s*/, '');
  const clean = card.cases.find((c) => /^clean/.test(c));
  const usable = card.lift && card.lift.comparable && !card.lift.stale && card.lift.runsPerArm >= 3;
  const res = latestResult(skill);
  const now = currentHashes(skill);
  return {
    skill, job: card.job, question: 'Does it catch more real bugs in a pull request than plain Claude, without inventing blockers?',
    planted: card.planted,
    method: [
      { step: 'A realistic pull request', detail: `${descOf('seeded-defects')} The answer key is held out: never shown to the model, and not published.` },
      { step: 'The same pull request, fixed', detail: clean ? `${descOf(clean)} A review that invents a blocking problem here counts as a false alarm.` : null },
      { step: 'An unrelated task', detail: card.quietTask ? `“${card.quietTask}”. The skill should stay out of it.` : null },
      { step: 'Two arms, same everything else', detail: 'Each case runs with the skill loaded and with no skill at all: same model, same prompt, same files. Three runs per arm.' },
      { step: 'Scored by graders that are held out too', detail: 'A judge model scores each answer against private graders. Only totals are published: how many planted bugs a run found on average, never which ones.' },
    ].filter((m) => m.detail),
    versions: { skillHash: now.skillHash, suiteHash: now.suiteHash, heldOutHash: res?.meta?.heldOutHash || 'recorded with the first run', claudeCode: res?.meta?.claudeVersion || 'not run yet (tested install: 2.1.310)', model: res?.meta?.model || 'sonnet (planned)', judge: res?.meta?.judgeModel || 'haiku (planned)' },
    lift: card.lift,
    measured: usable ? flagshipMeasures(res.summary) : null,
    limits: [
      'The same author wrote the skill and its test suite.',
      'The test inputs are public, and until 24 October 2026 the answer key was public too, so these cases are not held out from anyone who read it. A clean claim needs fresh cases that have never been published.',
      'The judge (haiku) is the same provider as the model under test until a cross-family check runs.',
    ],
  };
}

const PH = '*placeholder*';
export function renderFlagshipMd(f = flagshipData()) {
  const m = f.measured;
  const n = f.planted;
  const cell = (a, k) => {
    if (!m) return PH;
    const v = m[a][k];
    if (v == null) return 'n/a';
    if (k === 'foundMean') return `${v.toFixed(1)} of ${n}`;
    if (k === 'falseAlarmRate') return `${Math.round(v * 100)}% of runs`;
    if (k === 'costPerRunUsd') return `about USD ${v.toFixed(2)}`;
    if (k === 'secondsPerRun') return `${Math.round(v)} s`;
    return String(v);
  };
  const fired = !m ? PH : f.lift?.fired ? `${f.lift.fired.fired} of ${f.lift.fired.of} runs` : 'n/a';
  const quiet = !m ? PH : typeof f.lift?.quietWithScore === 'number' ? `${Math.round(f.lift.quietWithScore * 100)}%` : 'n/a';
  return [
    MARK[0],
    `## Flagship: \`${f.skill}\``,
    '',
    `**${f.question}**`,
    '',
    f.job,
    '',
    '**How it is tested:**',
    '',
    ...f.method.map((s, i) => `${i + 1}. **${s.step}.** ${s.detail}`),
    '',
    m ? `**Result** (${m.runsPerArm} runs per arm, totals only):` : '> **Placeholder.** Nothing below is measured yet. The first lift run fills every cell from the published summary: totals only, misses and false alarms included.',
    '',
    `| | No skill (baseline) | With \`${f.skill}\` |`,
    '|---|---|---|',
    `| Planted bugs found, mean per run (of ${n}) | ${cell('without', 'foundMean')} | ${cell('with', 'foundMean')} |`,
    `| Runs with a false alarm on the fixed copy | ${cell('without', 'falseAlarmRate')} | ${cell('with', 'falseAlarmRate')} |`,
    `| Loaded on its own job | n/a | ${fired} |`,
    `| Stayed out of the unrelated task | n/a | ${quiet} |`,
    `| Cost per run | ${cell('without', 'costPerRunUsd')} | ${cell('with', 'costPerRunUsd')} |`,
    `| Time per run | ${cell('without', 'secondsPerRun')} | ${cell('with', 'secondsPerRun')} |`,
    '',
    `**Versions this result belongs to:** skill \`${f.versions.skillHash}\`, public suite \`${f.versions.suiteHash}\`, held-out half ${/^[0-9a-f]{12}$/.test(f.versions.heldOutHash) ? `\`${f.versions.heldOutHash}\`` : f.versions.heldOutHash}, Claude Code ${f.versions.claudeCode}, model ${f.versions.model}, judge ${f.versions.judge}. A change to the skill, the public cases or the held-out half marks any result out of date.`,
    '',
    '**Limits:**',
    ...f.limits.map((l) => `- ${l}`),
    MARK[1],
  ].join('\n');
}

export function withFlagship(readme, block) {
  const a = readme.indexOf(MARK[0]); const b = readme.indexOf(MARK[1]);
  if (a < 0 || b < 0) throw new Error('flagship markers missing in products/skills-with-evals/README.md');
  return readme.slice(0, a) + block + readme.slice(b + MARK[1].length);
}

function main(argv) {
  const j = argv.indexOf('--json');
  if (j > -1) {
    const out = argv[j + 1] && !argv[j + 1].startsWith('--') ? argv[j + 1] : null;
    const data = { generatedBy: 'scripts/eval-card.mjs --json', pack: 'skills-with-evals', skills: PACK.skills.map(cardData) };
    const text = JSON.stringify(data, null, 2) + '\n';
    if (out) { writeFileSync(out, text); console.log(`wrote ${out}`); } else process.stdout.write(text);
    return 0;
  }
  const fl = argv.indexOf('--flagship');
  if (fl > -1) {
    const out = argv[fl + 1] && !argv[fl + 1].startsWith('--') ? argv[fl + 1] : null;
    const text = JSON.stringify(flagshipData(), null, 2) + '\n';
    if (out) { writeFileSync(out, text); console.log(`wrote ${out}`); } else process.stdout.write(text);
    return 0;
  }
  const check = argv.includes('--check');
  const skills = argv.filter((a) => !a.startsWith('--'));
  const list = skills.length ? skills : PACK.skills;
  let stale = 0;
  if (!skills.length || skills.includes(FLAGSHIP)) {
    const readme = readFileSync(README_PATH, 'utf8');
    const next = withFlagship(readme, renderFlagshipMd());
    if (check) { if (next !== readme) { console.log('stale: products/skills-with-evals/README.md (flagship section)'); stale++; } }
    else if (next !== readme) { writeFileSync(README_PATH, next); console.log('wrote products/skills-with-evals/README.md (flagship section)'); }
  }
  for (const s of list) {
    const out = join(REPO, 'evals', s, 'CARD.md');
    const card = renderCard(s);
    if (check) {
      if (!existsSync(out) || readFileSync(out, 'utf8') !== card) { console.log(`stale: evals/${s}/CARD.md`); stale++; }
    } else { writeFileSync(out, card); console.log(`wrote evals/${s}/CARD.md`); }
  }
  return stale ? 1 : 0;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) process.exit(main(process.argv.slice(2)));
