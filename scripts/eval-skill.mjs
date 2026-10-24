#!/usr/bin/env node
// Run a skill's eval suite with the official `claude plugin eval` and publish a scorecard.
//
// free-skills/<skill>/ stays the only copy of the skill: this script stages a throwaway
// plugin (manifest + that skill + evals/<skill>/) in the temp dir, runs the eval there with
// its no-plugin baseline arm, and writes evals/<skill>/SCORECARD.md and results/<stamp>.json,
// plus the HTML report (results/<stamp>.report.html) and every run's unedited trace
// (results/<stamp>/traces/<case>__<arm>__<n>.jsonl), so a reader can check what the model did.
// The eval runs with --threshold 0: this script collects measurements and judges
// comparability itself, it does not gate on a score.
//
//   node scripts/eval-skill.mjs <skill> [--runs N] [--max-cost-usd X] [--judge-model M]
//                                       [--model M] [--by WHO] [--stage-only]
// Exit codes: 0 comparable result written, 2 bad usage, 3 result written but not comparable,
// other = the eval or the claude process failed.

import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '..');
// The answer key and past results must never reach the model under test.
const NEVER_STAGED = new Set(['KEY.md', 'results', 'SCORECARD.md']);
const OPTIONS = {
  '--runs': { def: '3', ok: (v) => /^\d+$/.test(v) && +v >= 1 && +v <= 50 },
  '--max-cost-usd': { def: '5', ok: (v) => /^\d+(\.\d+)?$/.test(v) && +v > 0 },
  '--judge-model': { def: 'claude-haiku-4-5', ok: (v) => /^[\w.:-]+$/.test(v) },
  '--model': { def: null, ok: (v) => /^[\w.:-]+$/.test(v) },
  '--by': { def: 'unrecorded', ok: (v) => /^[\w .:()-]{1,60}$/.test(v) },
};

export function parseArgs(argv) {
  const [skill, ...rest] = argv;
  if (!skill || !/^[a-z0-9][a-z0-9-]*$/.test(skill)) throw new Error('first argument must be a skill folder name');
  const out = { skill, stageOnly: false };
  for (const [k, spec] of Object.entries(OPTIONS)) out[k.slice(2)] = spec.def;
  for (let i = 0; i < rest.length; i++) {
    const flag = rest[i];
    if (flag === '--stage-only') { out.stageOnly = true; continue; }
    const spec = OPTIONS[flag];
    if (!spec) throw new Error(`unknown option ${flag}`);
    const value = rest[++i];
    if (value === undefined || value.startsWith('--')) throw new Error(`${flag} needs a value`);
    if (!spec.ok(value)) throw new Error(`invalid value for ${flag}: ${value}`);
    out[flag.slice(2)] = value;
  }
  return out;
}

export function stage(repoRoot, skill, outDir) {
  const skillDir = join(repoRoot, 'free-skills', skill);
  const evalDir = join(repoRoot, 'evals', skill);
  if (!existsSync(join(skillDir, 'SKILL.md'))) throw new Error(`no skill at free-skills/${skill}/SKILL.md`);
  if (!existsSync(evalDir)) throw new Error(`no eval suite at evals/${skill}/`);
  const cases = readdirSync(evalDir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !NEVER_STAGED.has(d.name)
      && ['prompt.md', 'case.yaml'].some((f) => existsSync(join(evalDir, d.name, f))));
  if (!cases.length) throw new Error(`evals/${skill}/ has no case directories`);

  const plugin = join(outDir, `eval-${skill}`);
  mkdirSync(join(plugin, '.claude-plugin'), { recursive: true });
  writeFileSync(join(plugin, '.claude-plugin', 'plugin.json'), JSON.stringify({
    name: `eval-${skill}`,
    version: '0.0.0',
    description: `Throwaway eval harness for free-skills/${skill}, staged by scripts/eval-skill.mjs`,
    author: { name: 'FrankX', url: 'https://github.com/frankxai' },
  }, null, 2) + '\n');
  cpSync(skillDir, join(plugin, 'skills', skill), { recursive: true });
  for (const c of cases) {
    cpSync(join(evalDir, c.name), join(plugin, 'evals', c.name), {
      recursive: true,
      filter: (src) => !NEVER_STAGED.has(basename(src)),
    });
  }
  return { plugin, cases: cases.map((c) => c.name) };
}

export function treeHash(dir) {
  const hash = createHash('sha256');
  const walk = (d) => readdirSync(d).sort().forEach((name) => {
    const p = join(d, name);
    if (statSync(p).isDirectory()) return walk(p);
    hash.update(relative(dir, p).split('\\').join('/') + '\0');
    hash.update(readFileSync(p).toString('utf8').replace(/\r\n/g, '\n'));
  });
  walk(dir);
  return hash.digest('hex').slice(0, 12);
}

// A delta is evidence only when both arms completed the same number of runs, nothing
// errored, no paid grader was skipped, and the run was not cut short.
export function comparability(result) {
  const problems = [];
  if (result.partial) problems.push(`partial run (${result.partialReason || 'stopped early'})`);
  for (const c of result.cases || []) {
    const w = c.arms?.with || [];
    const wo = c.arms?.without || [];
    if (!wo.length) problems.push(`${c.name}: no baseline arm`);
    else if (w.length !== wo.length) problems.push(`${c.name}: ${w.length} runs with the skill but ${wo.length} without`);
    if ([...w, ...wo].some((r) => r?.error || r?.aborted)) problems.push(`${c.name}: some runs errored`);
    if ([...w, ...wo].some((r) => r?.skippedPaidGraders)) problems.push(`${c.name}: judge graders were skipped`);
    if (typeof c.aggregates?.delta !== 'number') problems.push(`${c.name}: no delta reported`);
  }
  return problems;
}

// `claude plugin eval` writes each run's trace to a temp dir it deletes unless --keep-temp is set.
// Copy every trace into destDir, point tracePath at the copy (relative to relBase), and remove the
// claude-eval-* temp dirs afterwards. Returns the number of traces copied.
export function collectTraces(result, destDir, relBase) {
  let copied = 0;
  const temps = new Set();
  for (const c of result.cases || []) {
    for (const [arm, runs] of Object.entries(c.arms || {})) {
      (runs || []).forEach((r, i) => {
        const src = r?.tracePath;
        if (!src || !existsSync(src)) return;
        mkdirSync(destDir, { recursive: true });
        const dest = join(destDir, `${c.name}__${arm}__${i + 1}.jsonl`);
        cpSync(src, dest);
        r.tracePath = relative(relBase, dest).split('\\').join('/');
        copied++;
        const tmp = dirname(dirname(src));
        if (/^claude-eval-/.test(basename(tmp)) && resolve(tmp).startsWith(resolve(tmpdir()))) temps.add(tmp);
      });
    }
  }
  for (const t of temps) rmSync(t, { recursive: true, force: true });
  return copied;
}

const pct = (x) => (typeof x === 'number' ? `${Math.round(x * 100)}%` : 'n/a');
const pts = (x) => (typeof x === 'number' ? `${x > 0 ? '+' : ''}${Math.round(x * 100)} pts` : 'n/a');

export function renderScorecard(skill, result, meta) {
  const problems = comparability(result);
  const rows = (result.cases || []).map((c) => {
    const withScore = c.aggregates?.score;
    const delta = c.aggregates?.delta;
    const without = typeof withScore === 'number' && typeof delta === 'number' ? withScore - delta : undefined;
    return `| ${c.name} | ${pct(withScore)} | ${pct(without)} | ${pts(delta)} | ${c.arms?.with?.length ?? 0} / ${c.arms?.without?.length ?? 0} |`;
  });
  const a = result.aggregates || {};
  return [
    `# ${skill}: eval scorecard`,
    '',
    `Run ${meta.stamp} with \`claude plugin eval\` (${meta.claudeVersion}). Model under test: ${meta.model || 'the CLI default'}. Judge: ${meta.judgeModel}. Run by: ${meta.by}. Skill ${meta.skillHash}, suite ${meta.suiteHash}. Review state: not independently reviewed.`,
    '',
    problems.length
      ? `**Not comparable, so no claim of lift.** ${problems.join('; ')}.`
      : '**Comparable run:** both arms completed every run with no errors or skipped judges.',
    '',
    '"With" loads the skill; "without" is the same model and prompt with no skill loaded. A score is the weighted share of graders passed, averaged over runs.',
    '',
    '| Case | With skill | Without | Difference | Runs (with / without) |',
    '|---|---|---|---|---|',
    ...rows,
    '',
    `Overall with the skill: ${pct(a.overallScore)}. Mean difference: ${pts(a.meanDelta)}. Cost about $${(result.costUsd ?? 0).toFixed(2)}.`,
    '',
    `Cases, fixtures and graders are in this folder. Raw result: \`results/${meta.stamp}.json\`; HTML report: \`results/${meta.stamp}.report.html\`; unedited run traces: \`results/${meta.stamp}/traces/\` (${meta.traces ?? 0} files).`,
    '',
  ].join('\n');
}

function findClaude() {
  if (process.platform !== 'win32') return { cmd: 'claude', shell: false };
  const found = spawnSync('where', ['claude'], { encoding: 'utf8' }).stdout?.split(/\r?\n/).filter(Boolean) || [];
  const exe = found.find((p) => p.toLowerCase().endsWith('.exe'));
  if (exe) return { cmd: exe, shell: false };
  const shim = found.find((p) => /\.(cmd|bat)$/i.test(p));
  if (shim) return { cmd: shim, shell: true };
  throw new Error('claude is not on PATH');
}

function main(argv) {
  let opts;
  try { opts = parseArgs(argv); } catch (e) {
    console.error(`${e.message}\nusage: node scripts/eval-skill.mjs <skill> [--runs N] [--max-cost-usd X] [--judge-model M] [--model M] [--by WHO] [--stage-only]`);
    return 2;
  }
  const work = mkdtempSync(join(tmpdir(), `skill-eval-${opts.skill}-`));
  const { plugin, cases } = stage(REPO, opts.skill, work);
  console.log(`staged ${cases.length} case(s) at ${plugin}`);
  if (opts.stageOnly) return 0;

  const claude = findClaude();
  const jsonOut = join(work, 'result.json');
  const stamp = new Date().toISOString().replace(/[:]/g, '-').replace(/\.\d+Z$/, 'Z');
  const out = join(REPO, 'evals', opts.skill);
  mkdirSync(join(out, 'results'), { recursive: true });
  const report = join(out, 'results', `${stamp}.report.html`);
  const args = ['plugin', 'eval', plugin, '--trust-plugin', '--ablation', 'with-without', '--no-publish', '--keep-temp', '--report', report,
    '--threshold', '0', '--runs', opts.runs, '--max-cost-usd', opts['max-cost-usd'],
    '--judge-model', opts['judge-model'], '--json', jsonOut, ...(opts.model ? ['--model', opts.model] : [])];
  // A .cmd shim needs a shell, which splits on spaces and interprets metacharacters, in the
  // shim's own path as much as in its arguments.
  if (claude.shell && [claude.cmd, ...args].some((a) => !/^[\w.:\\/@+-]+$/.test(a))) {
    console.error('claude is a .cmd shim here and its path or an argument (the temp path or this repo\'s path) contains spaces or shell characters. Install the native claude binary, or use a repo path and TMP without spaces.');
    return 2;
  }
  const run = spawnSync(claude.cmd, args, { stdio: 'inherit', shell: claude.shell });
  if (run.error || run.signal) {
    console.error(`claude did not finish: ${run.error?.message || run.signal}`);
    return 1;
  }
  if (!existsSync(jsonOut)) {
    console.error(`claude plugin eval produced no result (exit ${run.status}). If it says the OAuth session expired, run \`claude\` once in a terminal to sign in.`);
    return run.status || 1;
  }
  const result = JSON.parse(readFileSync(jsonOut, 'utf8'));
  const traces = collectTraces(result, join(out, 'results', stamp, 'traces'), out);
  const claudeVersion = spawnSync(claude.cmd, ['--version'], { encoding: 'utf8', shell: claude.shell }).stdout?.trim() || 'unknown version';
  const meta = {
    stamp, claudeVersion, judgeModel: opts['judge-model'], model: opts.model, by: opts.by, traces,
    skillHash: treeHash(join(REPO, 'free-skills', opts.skill)), suiteHash: treeHash(join(plugin, 'evals')),
  };
  writeFileSync(join(out, 'results', `${stamp}.json`), JSON.stringify({ meta, result }, null, 2) + '\n');
  writeFileSync(join(out, 'SCORECARD.md'), renderScorecard(opts.skill, result, meta));
  const problems = comparability(result);
  console.log(`wrote evals/${opts.skill}/SCORECARD.md${problems.length ? ' (not comparable: ' + problems.join('; ') + ')' : ''}`);
  if (run.status) return run.status;
  return problems.length ? 3 : 0;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exit(main(process.argv.slice(2)));
}
