#!/usr/bin/env node
// One-page card per pack skill: what it does, when it triggers, what the eval checks, measured lift.
//
//   node scripts/eval-card.mjs [skill ...]      (default: every skill in the pack manifest)
//   node scripts/eval-card.mjs --check          (exit 1 if any CARD.md is stale)
//
// Every number on a card comes from a file: the skill's frontmatter, the suite's case files and
// answer key, scripts/trigger-lint.mjs, and the latest results/<stamp>.json written by
// scripts/eval-skill.mjs from `claude plugin eval`. A card never carries a typed-in lift figure.

import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { lintSkill, parseFrontmatter } from './trigger-lint.mjs';
import { comparability } from './eval-skill.mjs';

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

function readCase(dir) {
  const yaml = existsSync(join(dir, 'case.yaml')) ? readFileSync(join(dir, 'case.yaml'), 'utf8') : '';
  const prompt = existsSync(join(dir, 'prompt.md')) ? readFileSync(join(dir, 'prompt.md'), 'utf8') : '';
  const desc = (/^description:\s*"?(.*?)"?\s*$/m.exec(prompt) || /^description:\s*"?(.*?)"?\s*$/m.exec(yaml) || [])[1] || '';
  const graders = existsSync(join(dir, 'graders')) ? readdirSync(join(dir, 'graders')).filter((f) => f.endsWith('.md')).length
    : (yaml.match(/^\s+- name:/gm) || []).length;
  const execPrompt = (/execution:\s*\n\s+prompt:\s*("(?:[^"\\]|\\.)*")/.exec(yaml) || [])[1];
  return { desc, graders, noTrigger: /should-not-trigger/.test(yaml + prompt), prompt: execPrompt ? JSON.parse(execPrompt) : null };
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
    const problems = comparability(r);
    const rows = (r.cases || []).map((c) => {
      const w = c.aggregates?.score; const dl = c.aggregates?.delta;
      return `| ${c.name} | ${pct(w)} | ${pct(typeof w === 'number' && typeof dl === 'number' ? w - dl : undefined)} | ${pts(dl)} | ${c.arms?.with?.length ?? 0}/${c.arms?.without?.length ?? 0} |`;
    });
    lift = [
      problems.length ? `**Not comparable, so no lift is claimed.** ${problems.join('; ')}.` : `**Measured lift (mean over cases): ${pts(r.aggregates?.meanDelta)}.**`,
      '',
      '| Case | With skill | Without | Lift | Runs (with/without) |',
      '|---|---|---|---|---|',
      ...rows,
      '',
      `Source: \`evals/${skill}/results/${res.file}\`, \`claude plugin eval\` ${res.meta?.claudeVersion || ''}, model ${res.meta?.model || 'CLI default'}, judge ${res.meta?.judgeModel || 'n/a'}, cost about $${(r.costUsd ?? 0).toFixed(2)}. Judge is the same provider as the model under test until the G3 cross-family check.`,
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
    'After merge, drop the `#…` / `@…` suffix.',
    '',
  ].join('\n');
}

function main(argv) {
  const check = argv.includes('--check');
  const skills = argv.filter((a) => !a.startsWith('--'));
  const list = skills.length ? skills : PACK.skills;
  let stale = 0;
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
