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

import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { lintSkill, parseFrontmatter } from './trigger-lint.mjs';
import { baselineScore, comparability, firedRate, isQuietCase, quietLine, reviewLift, stage, treeHash } from './eval-skill.mjs';

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const RC_REF = 'agent/hyperagent/eval-pack-rc1';
const PACK = JSON.parse(readFileSync(join(REPO, 'products', 'skills-with-evals', 'pack.json'), 'utf8'));
const minRuns = (r) => Math.min(...(r.cases || []).flatMap((c) => [c.arms?.with?.length ?? 0, c.arms?.without?.length ?? 0]), Infinity);
const pct = (x) => (typeof x === 'number' ? `${Math.round(x * 100)}%` : 'n/a');
const pts = (x) => (typeof x === 'number' ? `${x > 0 ? '+' : ''}${Math.round(x * 100)} pts` : 'n/a');

function skillDir(skill) {
  for (const r of ['free-skills', 'free-skills/technical', 'free-skills/creative', 'free-skills/anthropic']) {
    const d = join(REPO, r, skill);
    if (existsSync(join(d, 'SKILL.md'))) return d;
  }
  throw new Error(`no skill ${skill}`);
}

function readCase(dir) {
  const yaml = existsSync(join(dir, 'case.yaml')) ? readFileSync(join(dir, 'case.yaml'), 'utf8') : '';
  const prompt = existsSync(join(dir, 'prompt.md')) ? readFileSync(join(dir, 'prompt.md'), 'utf8') : '';
  const desc = (/^description:\s*"?(.*?)"?\s*$/m.exec(prompt) || /^description:\s*"?(.*?)"?\s*$/m.exec(yaml) || [])[1] || '';
  const graders = existsSync(join(dir, 'graders')) ? readdirSync(join(dir, 'graders')).filter((f) => f.endsWith('.md')).length
    : (yaml.match(/^\s+- name:/gm) || []).length;
  const execPrompt = (/execution:\s*\n\s+prompt:\s*("(?:[^"\\]|\\.)*")/.exec(yaml) || [])[1];
  return { desc, graders, noTrigger: /should-not-trigger/.test(yaml + prompt), prompt: execPrompt ? JSON.parse(execPrompt) : null };
}

// Hashes of the skill and of the suite exactly as scripts/eval-skill.mjs stages them for a run.
export function currentHashes(skill) {
  const tmp = mkdtempSync(join(tmpdir(), 'card-hash-'));
  try {
    const { plugin, cases } = stage(REPO, skill, tmp);
    return { skillHash: treeHash(join(REPO, 'free-skills', skill)), suiteHash: treeHash(join(plugin, 'evals')), cases };
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
  const ran = new Set((res?.result?.cases || []).map((c) => (c.dir ? c.dir.split(/[\\/]/).filter(Boolean).at(-1) : c.name)));
  const missing = current.cases.filter((c) => !ran.has(c));
  return missing.length ? [`the result has no runs for ${missing.join(', ')}`] : [];
}

function latestResult(skill) {
  const dir = join(REPO, 'evals', skill, 'results');
  if (!existsSync(dir)) return null;
  const files = readdirSync(dir).filter((f) => f.endsWith('.json')).sort();
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
    .map((d) => ({ name: d.name, ...readCase(join(suite, d.name)) }));
  const keyFile = join(suite, 'seeded-defects', 'KEY.md');
  const seeded = existsSync(keyFile) ? readFileSync(keyFile, 'utf8').split('\n').filter((l) => /^\d+\.\s/.test(l) || /^\|\s*\d+\s*\|/.test(l)).length : 0;
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
    const r = res.result || {};
    const now = currentHashes(skill);
    const stale = staleness(res, now);
    const problems = [...stale, ...coverage(res, now), ...comparability(r)];
    const rows = (r.cases || []).map((c) => {
      const w = c.aggregates?.score; const dl = c.aggregates?.delta;
      return `| ${c.name} | ${pct(w)} | ${pct(typeof w === 'number' && typeof dl === 'number' ? w - dl : undefined)} | ${pts(dl)} | ${c.arms?.with?.length ?? 0}/${c.arms?.without?.length ?? 0} |`;
    });
    lift = [
      stale.length ? `**Stale result, so no lift is claimed.** ${stale.join('; ')}. Re-run the suite.`
        : problems.length ? `**Not comparable, so no lift is claimed.** ${problems.join('; ')}.`
        : minRuns(r) < 3 ? `**Pilot only (${minRuns(r)} run per arm), so no lift is claimed.** Lift over the review cases in this pilot: ${pts(reviewLift(r))}. A lift claim needs at least 3 runs per arm.`
        : `**Measured lift over the review cases (${minRuns(r)} runs per arm): ${pts(reviewLift(r))}.** No-skill baseline: ${pct(baselineScore(r))}. Fires on its job: ${firedRate(r) ? `${firedRate(r).fired} of ${firedRate(r).of} with-skill runs` : 'n/a'}. Stay-quiet case: ${quietLine(r)}.`,
      '',
      '| Case | With skill | Without | Lift | Runs (with/without) |',
      '|---|---|---|---|---|',
      ...rows,
      '',
      `Source: \`evals/${skill}/results/${res.file}\` (traces: \`results/${res.file.replace(/\.json$/, '')}/traces/\`, report: \`results/${res.file.replace(/\.json$/, '.report.html')}\`), \`claude plugin eval\` ${res.meta?.claudeVersion || ''}, model ${res.meta?.model || 'CLI default'}, judge ${res.meta?.judgeModel || 'n/a'}, cost about $${(r.costUsd ?? 0).toFixed(2)}. Judge is the same provider as the model under test until the G3 cross-family check.`,
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
    `${seeded ? `${seeded} planted defects in the recall case (answer key never shown to the model). ` : ''}Every case runs twice: with the skill and with no skill (baseline), same model and prompt.`,
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
    .map((d) => ({ name: d.name, ...readCase(join(suite, d.name)) }));
  const keyFile = join(suite, 'seeded-defects', 'KEY.md');
  const planted = existsSync(keyFile) ? readFileSync(keyFile, 'utf8').split('\n').filter((l) => /^\d+\.\s/.test(l) || /^\|\s*\d+\s*\|/.test(l)).length : 0;
  const recall = cases.find((c) => c.name === 'seeded-defects');
  const quiet = cases.find((c) => c.noTrigger);
  const res = latestResult(skill);
  let lift = null;
  if (res) {
    const r = res.result || {};
    const now = currentHashes(skill);
    const stale = staleness(res, now);
    const problems = [...stale, ...coverage(res, now), ...comparability(r)];
    const quiet = (r.cases || []).find(isQuietCase);
    lift = {
      comparable: !problems.length, stale: stale.length > 0, problems, runsPerArm: minRuns(r) === Infinity ? 0 : minRuns(r),
      reviewLift: reviewLift(r), baselineScore: baselineScore(r), fired: firedRate(r), quietWithScore: quiet?.aggregates?.score ?? null,
      meanDelta: r.aggregates?.meanDelta ?? null, withScore: r.aggregates?.overallScore ?? null,
      cases: (r.cases || []).map((c) => ({ name: c.name, with: c.aggregates?.score ?? null, delta: c.aggregates?.delta ?? null })),
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

// ---- Flagship: one skill's full worked comparison, baseline vs skill, from files only (buyer critique, clarity) ----
export const FLAGSHIP = 'github-code-review';
const README_PATH = join(REPO, 'products', 'skills-with-evals', 'README.md');
const MARK = ['<!-- flagship:start (generated by scripts/eval-card.mjs; do not edit by hand) -->', '<!-- flagship:end -->'];

function promptBody(caseDir) {
  const md = join(caseDir, 'prompt.md');
  if (existsSync(md)) return readFileSync(md, 'utf8').replace(/^---[\s\S]*?\n---\n/, '').trim();
  const y = existsSync(join(caseDir, 'case.yaml')) ? readFileSync(join(caseDir, 'case.yaml'), 'utf8') : '';
  const q = /execution:\s*\n\s+prompt:\s*("(?:[^"\\]|\\.)*")/.exec(y);
  return q ? JSON.parse(q[1]) : '';
}

// The answer key's target up to the first ", " or " (" that is outside an inline code span.
export function firstClause(text) {
  let code = false;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '`') code = !code;
    else if (!code && (text.startsWith(', ', i) || text.startsWith(' (', i))) return text.slice(0, i);
  }
  return text;
}

export function plantedDefects(skill) {
  const key = join(REPO, 'evals', skill, 'seeded-defects', 'KEY.md');
  if (!existsSync(key)) return [];
  return readFileSync(key, 'utf8').split('\n').map((l) => /^(\d+)\.\s+\*\*([\w-]+)\*\*\s+\((\w+)\):\s+(.*?)\s+→\s+fix:\s+(.*)$/.exec(l)).filter(Boolean)
    .map(([, n, id, kind, target]) => ({ n: +n, id, kind, what: firstClause(target).replace(/^the /, '').replace(/^./, (c) => c.toUpperCase()) }));
}

const rate = (runs, pred) => (runs.length ? runs.filter(pred).length / runs.length : null);
const graderPassed = (run, re) => (run?.graders || []).some((g) => re.test(g.name || '') && g.passed);
const finalText = (tracePath, base) => {
  const p = tracePath && (existsSync(tracePath) ? tracePath : join(base, tracePath));
  if (!p || !existsSync(p)) return null;
  const last = readFileSync(p, 'utf8').split('\n').filter(Boolean).map((l) => { try { return JSON.parse(l); } catch { return {}; } })
    .filter((e) => e.type === 'result' && typeof e.result === 'string').at(-1);
  return last ? last.result : null;
};

// Per-arm measurements for the flagship, from the tool's own records. null until a usable result exists.
export function flagshipMeasures(result, defects, base) {
  const byName = (re) => (result.cases || []).find((c) => re.test(c.name || '') || re.test(c.dir || ''));
  const seeded = byName(/seeded-defects/);
  const clean = byName(/(^|[-_/])clean[\w-]*$/);
  const arm = (a) => {
    const sr = seeded?.arms?.[a] || [];
    const cr = clean?.arms?.[a] || [];
    const perDefect = defects.map((d) => ({ id: d.id, found: rate(sr, (r) => graderPassed(r, new RegExp(`^d${d.n}-`))) }));
    const meanFound = sr.length ? sr.reduce((n, r) => n + defects.filter((d) => graderPassed(r, new RegExp(`^d${d.n}-`))).length, 0) / sr.length : null;
    const all = [...sr, ...cr];
    const avg = (k) => { const xs = all.map((r) => r?.[k]).filter((x) => typeof x === 'number'); return xs.length ? xs.reduce((x, y) => x + y, 0) / xs.length : null; };
    return {
      runs: sr.length, meanFound, perDefect,
      falseAlarmRate: cr.length ? 1 - rate(cr, (r) => graderPassed(r, /no-unsupported-claims/)) : null,
      costPerRunUsd: avg('costUsd'), secondsPerRun: avg('durationSeconds'),
      example: finalText(sr[0]?.tracePath, base),
    };
  };
  return { with: arm('with'), without: arm('without') };
}

export function flagshipData(skill = FLAGSHIP) {
  const suite = join(REPO, 'evals', skill);
  const card = cardData(skill);
  const defects = plantedDefects(skill);
  const resources = join(suite, 'seeded-defects', 'resources');
  const prDoc = existsSync(resources) ? readdirSync(resources).find((f) => /\.md$/i.test(f)) : null;
  const res = latestResult(skill);
  const usable = card.lift && card.lift.comparable && !card.lift.stale && card.lift.runsPerArm >= 3;
  const now = currentHashes(skill);
  return {
    skill, job: card.job, question: 'Does it catch more real bugs in a pull request than plain Claude, without inventing blockers?',
    task: promptBody(join(suite, 'seeded-defects')),
    input: prDoc ? { file: `evals/${skill}/seeded-defects/resources/${prDoc}`, summary: readFileSync(join(resources, prDoc), 'utf8').split('\n').slice(2).join(' ').replace(/\s+/g, ' ').trim() } : null,
    inputFiles: existsSync(resources) ? readdirSync(resources).map((f) => `evals/${skill}/seeded-defects/resources/${f}`) : [],
    planted: defects,
    clean: (card.cases.find((c) => /^clean/.test(c)) && promptBody(join(suite, card.cases.find((c) => /^clean/.test(c))))) ? 'The same pull request with every planted bug fixed; a review must not invent blocking problems.' : null,
    quietTask: card.quietTask,
    versions: { skillHash: now.skillHash, suiteHash: now.suiteHash, claudeCode: res?.meta?.claudeVersion || 'not run yet (tested install: 2.1.310)', model: res?.meta?.model || 'sonnet (planned)', judge: res?.meta?.judgeModel || 'haiku (planned)' },
    lift: card.lift,
    measured: usable ? flagshipMeasures(res.result, defects, join(REPO, 'evals', skill)) : null,
    limits: [
      'The same author wrote the skill and its test suite.',
      'There are no held-out cases yet, so a pass shows the skill works on these fixtures, not that it generalises.',
      'The judge (haiku) is the same provider as the model under test until a cross-family check runs.',
    ],
  };
}

const PH = '*placeholder*';
export function renderFlagshipMd(f = flagshipData()) {
  const m = f.measured;
  const n = f.planted.length;
  const cell = (a, k) => {
    if (!m) return PH;
    const v = m[a][k];
    if (k === 'meanFound') return typeof v === 'number' ? `${v.toFixed(1)} of ${n}` : 'n/a';
    if (k === 'falseAlarmRate') return typeof v === 'number' ? `${Math.round(v * 100)}% of runs` : 'n/a';
    if (k === 'costPerRunUsd') return typeof v === 'number' ? `about USD ${v.toFixed(2)}` : 'n/a';
    if (k === 'secondsPerRun') return typeof v === 'number' ? `${Math.round(v)} s` : 'n/a';
    return String(v);
  };
  const fired = !m ? PH : f.lift?.fired ? `${f.lift.fired.fired} of ${f.lift.fired.of} runs` : 'n/a';
  const quiet = !m ? PH : typeof f.lift?.quietWithScore === 'number' ? `${Math.round(f.lift.quietWithScore * 100)}%` : 'n/a';
  const lines = [
    MARK[0],
    `## Flagship: \`${f.skill}\``,
    '',
    `**${f.question}**`,
    '',
    f.job,
    '',
    '**The task**, given word for word to Claude with the skill and without it:',
    '',
    ...f.task.split('\n').map((l) => `> ${l}`),
    '',
    `**The input:** ${f.input ? f.input.summary : ''} Files: ${f.inputFiles.map((x) => `\`${x}\``).join(', ')}.`,
    '',
    `**What is planted** (${n} bugs; the answer key is never shown to the model):`,
    '',
    ...f.planted.map((d) => `${d.n}. ${d.what} *(${d.kind})*`),
    '',
    `**Also checked:** ${f.clean} And an unrelated task it must stay out of: “${f.quietTask}”.`,
    '',
    m ? '**Result** (from the measured run; misses and false alarms included):' : '> **Placeholder.** Nothing below is measured yet. The first lift run fills every cell from the tool\'s own output, including misses and false alarms.',
    '',
    '| | No skill (baseline) | With `' + f.skill + '` |',
    '|---|---|---|',
    `| Planted bugs found, mean per run (of ${n}) | ${cell('without', 'meanFound')} | ${cell('with', 'meanFound')} |`,
    `| Runs with a false alarm on the clean copy | ${cell('without', 'falseAlarmRate')} | ${cell('with', 'falseAlarmRate')} |`,
    `| Loaded on its own job | n/a | ${fired} |`,
    `| Stayed out of the unrelated task | n/a | ${quiet} |`,
    `| Cost per run | ${cell('without', 'costPerRunUsd')} | ${cell('with', 'costPerRunUsd')} |`,
    `| Time per run | ${cell('without', 'secondsPerRun')} | ${cell('with', 'secondsPerRun')} |`,
    '',
    m ? '**Per planted bug** (share of runs that found it):' : '**Per planted bug:** *placeholder* until the first run.',
    ...(m ? ['', '| Bug | No skill | With skill |', '|---|---|---|', ...f.planted.map((d, i) => `| ${d.n}. ${d.id} | ${Math.round((m.without.perDefect[i].found ?? 0) * 100)}% | ${Math.round((m.with.perDefect[i].found ?? 0) * 100)}% |`)] : []),
    '',
    `**Example output:** ${m ? 'first run of each arm, unedited (full traces in `results/`).' : '*placeholder*: one unedited answer from each arm appears here after the run.'}`,
    ...(m ? ['', '<details><summary>No skill</summary>', '', '```text', (m.without.example || 'n/a').slice(0, 1500), '```', '</details>', '', '<details><summary>With the skill</summary>', '', '```text', (m.with.example || 'n/a').slice(0, 1500), '```', '</details>'] : []),
    '',
    `**Versions this result belongs to:** skill \`${f.versions.skillHash}\`, suite \`${f.versions.suiteHash}\`, Claude Code ${f.versions.claudeCode}, model ${f.versions.model}, judge ${f.versions.judge}. A change to the skill or the suite marks any result out of date.`,
    '',
    '**Limits:**',
    ...f.limits.map((l) => `- ${l}`),
    MARK[1],
  ];
  return lines.join('\n');
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
