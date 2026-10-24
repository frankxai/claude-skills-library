#!/usr/bin/env node
// Run a skill's eval suite with the official `claude plugin eval` and record the result.
//
// free-skills/<skill>/ stays the only copy of the skill: this script stages a throwaway
// plugin (manifest + that skill + the public half of evals/<skill>/: prompts and inputs) in the temp dir, adds the
// held-out half (graders, from the private folder; scripts/held-out.mjs), and runs the eval there with its
// no-plugin baseline arm. The eval runs with --threshold 0: this script collects measurements and judges
// comparability itself, it does not gate on a score.
//
// Output is split the same way. Raw output (the tool's result with every grader verdict, the HTML report, every
// run's unedited trace, SCORECARD.md) goes to <private>/results/<skill>/, because it reveals the answer key.
// Only an aggregate summary is public: evals/<skill>/results/<stamp>.summary.json (summarizeResult()), which
// the cards are built from.
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
import { heldOutCounts, heldOutHash, heldOutStatus, isMarker, overlayHeldOut, privateRoot } from './held-out.mjs';

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '..');
// The answer key and past results must never reach the model under test. Public graders do not exist for the pack
// (placeholders named "graders" mark where the private ones go); the overlay adds the private ones after the copy.
const NEVER_STAGED = new Set(['KEY.md', 'results', 'SCORECARD.md', 'graders.yaml']);
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

// Returns the staged plugin, its cases, suiteHash (the public half exactly as staged), and, when the private half
// is present and heldOut is not false, heldOutHash and the number of grader entries added.
export function stage(repoRoot, skill, outDir, { heldOut = true, root = privateRoot() } = {}) {
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
      filter: (src) => !NEVER_STAGED.has(basename(src)) && !isMarker(src),
    });
  }
  // Hash the suite now, before anything runs: `claude plugin eval` writes its results into <plugin>/evals/ during
  // the run, so a hash taken afterwards would never match the suite that ran (G3 P1-5). This is the public half;
  // the held-out half added below gets its own hash.
  const suiteHash = treeHash(join(plugin, 'evals'));
  const graders = heldOut ? overlayHeldOut(skill, plugin, root) : 0;
  return { plugin, cases: cases.map((c) => c.name), suiteHash, graders, heldOutHash: heldOut && graders ? heldOutHash(skill, root) : null };
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

// The stay-quiet (should-not-trigger) case scores the same with and without the skill when the skill behaves, so
// its delta is 0 by design. Averaging it into the lift would dilute it by a quarter to a third: it is reported on
// its own instead (G3 P1-5).
export const isQuietCase = (c) => /(^|[-_/])no-trigger$/.test(c?.name || '') || /(^|[\\/])no-trigger[\\/]?$/.test(c?.dir || '');

// Lift = mean difference (with minus without) over the review cases only.
export function reviewLift(result) {
  const ds = (result.cases || []).filter((c) => !isQuietCase(c)).map((c) => c.aggregates?.delta).filter((d) => typeof d === 'number');
  return ds.length ? ds.reduce((a, b) => a + b, 0) / ds.length : null;
}

// A delta is evidence only when both arms completed the same number of runs, nothing
// errored, no paid grader was skipped, and the run was not cut short.
export function comparability(result) {
  const problems = [];
  if (result.partial) problems.push(`partial run (${result.partialReason || 'stopped early'})`);
  if (!(result.cases || []).length) problems.push('the result has no cases');
  else if (!result.cases.some((c) => !isQuietCase(c))) problems.push('the result has no review cases, only the stay-quiet case');
  if (typeof result.aggregates?.meanDelta !== 'number') problems.push('no mean difference reported');
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

// Trigger, from the tool's own grader records: the share of with-skill runs on review cases where the with-only
// "fired" indicator passed (the skill loaded on its own job). null when no such runs exist.
export function firedRate(result) {
  const runs = (result.cases || []).filter((c) => !isQuietCase(c)).flatMap((c) => c.arms?.with || []);
  const flags = runs.map((r) => (r?.graders || []).find((g) => g.withOnly && /fired/.test(g.name || ''))).filter(Boolean);
  return flags.length ? { fired: flags.filter((g) => g.passed).length, of: flags.length } : null;
}

// Baseline: the mean no-skill score over the review cases (with-skill score minus the reported difference).
export function baselineScore(result) {
  const xs = (result.cases || []).filter((c) => !isQuietCase(c))
    .map((c) => (typeof c.aggregates?.score === 'number' && typeof c.aggregates?.delta === 'number' ? c.aggregates.score - c.aggregates.delta : null))
    .filter((x) => x !== null);
  return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null;
}

export function quietLine(result) {
  const q = (result.cases || []).find(isQuietCase);
  if (!q) return 'none in this run';
  const w = q.aggregates?.score;
  return typeof w === 'number' ? `${pct(w)} with the skill loaded (100% means it never fired on the unrelated task)` : 'no score';
}

// Read each run's trace init record and report anything that should not be there (moved from run-pack-lift.mjs).
export function isolationProblems(result, skill, baseDir) {
  const problems = [];
  const models = new Set();
  const staged = `eval-${skill}`;
  const packSkills = JSON.parse(readFileSync(join(REPO, 'products', 'skills-with-evals', 'pack.json'), 'utf8')).skills;
  for (const c of result.cases || []) {
    for (const [arm, runs] of Object.entries(c.arms || {})) {
      (runs || []).forEach((r, i) => {
        const where = `${c.name} ${arm} run ${i + 1}`;
        const p = r?.tracePath && (existsSync(r.tracePath) ? r.tracePath : join(baseDir, r.tracePath));
        if (!p || !existsSync(p)) { problems.push(`${where}: no trace`); return; }
        const init = readFileSync(p, 'utf8').split('\n').filter(Boolean).map((l) => { try { return JSON.parse(l); } catch { return {}; } })
          .find((e) => e.type === 'system' && e.subtype === 'init');
        if (!init) { problems.push(`${where}: trace has no init record`); return; }
        if (init.model) models.add(init.model);
        const foreign = (init.plugins || []).filter((pl) => !/@builtin$/.test(pl.source || '') && !(arm === 'with' && pl.name === staged));
        if (foreign.length) problems.push(`${where}: unexpected plugin(s) ${foreign.map((pl) => pl.name).join(', ')}`);
        if (arm !== 'with' && (init.plugins || []).some((pl) => pl.name === staged)) problems.push(`${where}: the no-skill arm loaded the skill`);
        const leaked = (init.skills || []).filter((sk) => sk.includes(':') ? !sk.startsWith(`${staged}:`) && !/^cc-plugin-/.test(sk) : packSkills.includes(sk));
        if (leaked.length) problems.push(`${where}: unexpected skill(s) ${leaked.join(', ')}`);
      });
    }
  }
  return { problems, models: [...models] };
}

const mean = (xs) => { const v = xs.filter((x) => typeof x === 'number'); return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null; };
const passedCount = (run, re) => (run?.graders || []).filter((g) => re.test(g.name || '') && g.passed).length;
const caseName = (c) => (c.dir ? c.dir.split(/[\\/]/).filter(Boolean).at(-1) : c.name);

// The public record of a run: aggregates only. No grader names, verdicts, criteria, prompts, answers or traces, so
// it can be published without revealing what the graders look for. Bugs found is a count per run, never which ones.
export function summarizeResult(result, meta, { isolation = [], models = [], planted = null } = {}) {
  const cases = result.cases || [];
  const arm = (c, a) => c?.arms?.[a] || [];
  const runsPerArm = cases.length ? Math.min(...cases.flatMap((c) => [arm(c, 'with').length, arm(c, 'without').length])) : 0;
  const seeded = cases.find((c) => caseName(c) === 'seeded-defects');
  const clean = cases.find((c) => /^clean/.test(caseName(c) || ''));
  const found = (a) => (seeded && arm(seeded, a).length ? mean(arm(seeded, a).map((r) => passedCount(r, /^d\d+-/))) : null);
  const alarms = (a) => (clean && arm(clean, a).length ? arm(clean, a).filter((r) => !passedCount(r, /no-unsupported-claims/)).length / arm(clean, a).length : null);
  const perRun = (k, a) => mean(cases.flatMap((c) => arm(c, a)).map((r) => r?.[k]));
  const problems = [...comparability(result), ...(result.partial ? [] : isolation)];
  return {
    meta: { stamp: meta.stamp, claudeVersion: meta.claudeVersion, model: meta.model || null, judgeModel: meta.judgeModel, by: meta.by, traces: meta.traces ?? 0,
      skillHash: meta.skillHash, suiteHash: meta.suiteHash, heldOutHash: meta.heldOutHash || null, modelsSeen: models },
    summary: {
      costUsd: result.costUsd ?? null, partial: !!result.partial, partialReason: result.partialReason || null, runsPerArm,
      comparable: problems.length === 0, problems,
      reviewLift: reviewLift(result), baselineScore: baselineScore(result), fired: firedRate(result),
      quietWithScore: cases.find(isQuietCase)?.aggregates?.score ?? null, meanDelta: result.aggregates?.meanDelta ?? null, overallScore: result.aggregates?.overallScore ?? null,
      cases: cases.map((c) => ({ name: caseName(c), quiet: isQuietCase(c), with: c.aggregates?.score ?? null, delta: c.aggregates?.delta ?? null,
        runsWith: arm(c, 'with').length, runsWithout: arm(c, 'without').length })),
      recall: seeded && planted ? { planted, foundMeanWith: found('with'), foundMeanWithout: found('without') } : null,
      falseAlarmRate: clean ? { with: alarms('with'), without: alarms('without') } : null,
      perRun: { costUsdWith: perRun('costUsd', 'with'), costUsdWithout: perRun('costUsd', 'without'), secondsWith: perRun('durationSeconds', 'with'), secondsWithout: perRun('durationSeconds', 'without') },
    },
  };
}

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
    `Lift over the review cases: ${pts(reviewLift(result))}. Stay-quiet case: ${quietLine(result)}. Overall with the skill: ${pct(a.overallScore)}; mean difference over all cases (stay-quiet included, so diluted): ${pts(a.meanDelta)}. Cost about $${(result.costUsd ?? 0).toFixed(2)}.`,
    '',
    `Private: this scorecard, the raw result (\`${meta.stamp}.json\`), the HTML report and the unedited traces (\`${meta.stamp}/traces/\`, ${meta.traces ?? 0} files) stay in the private half, next to this file. The public record is \`evals/${skill}/results/${meta.stamp}.summary.json\` (aggregates only).`,
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
  const root = privateRoot();
  const { plugin, cases, suiteHash, graders, heldOutHash: hHash } = stage(REPO, opts.skill, work, { root });
  const counts = heldOutCounts(opts.skill);
  const held = counts ? heldOutStatus(opts.skill, root) : null;
  console.log(`staged ${cases.length} case(s) at ${plugin}${counts ? ` · held-out half: ${held.present ? `${graders} graders added (${hHash})` : `MISSING (${held.missing.join('; ')})`}` : ''}`);
  if (opts.stageOnly) return 0;
  if (held && !held.present) {
    console.error(`The private half of evals/${opts.skill}/ (graders, answer key) is not at ${root}. Set SKILLS_EVALS_PRIVATE, or rebuild it from history: node scripts/held-out.mjs export --from 0ae110c --to <a folder outside this repo>. Nothing was run.`);
    return 2;
  }

  const claude = findClaude();
  const jsonOut = join(work, 'result.json');
  const stamp = new Date().toISOString().replace(/[:]/g, '-').replace(/\.\d+Z$/, 'Z');
  const out = join(root, 'results', opts.skill);
  mkdirSync(out, { recursive: true });
  const report = join(out, `${stamp}.report.html`);
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
  const traces = collectTraces(result, join(out, stamp, 'traces'), out);
  const claudeVersion = spawnSync(claude.cmd, ['--version'], { encoding: 'utf8', shell: claude.shell }).stdout?.trim() || 'unknown version';
  const meta = {
    stamp, claudeVersion, judgeModel: opts['judge-model'], model: opts.model, by: opts.by, traces,
    skillHash: treeHash(join(REPO, 'free-skills', opts.skill)), suiteHash, heldOutHash: hHash,
  };
  writeFileSync(join(out, `${stamp}.json`), JSON.stringify({ meta, result }, null, 2) + '\n');
  writeFileSync(join(out, 'SCORECARD.md'), renderScorecard(opts.skill, result, meta));
  const iso = isolationProblems(result, opts.skill, out);
  const pub = summarizeResult(result, meta, { isolation: iso.problems, models: iso.models, planted: counts?.planted ?? null });
  mkdirSync(join(REPO, 'evals', opts.skill, 'results'), { recursive: true });
  writeFileSync(join(REPO, 'evals', opts.skill, 'results', `${stamp}.summary.json`), JSON.stringify(pub, null, 2) + '\n');
  const problems = pub.summary.problems;
  console.log(`wrote ${out}/ (private: result, report, traces, SCORECARD.md) and evals/${opts.skill}/results/${stamp}.summary.json (public, aggregates only)${problems.length ? ' (not comparable: ' + problems.slice(0, 3).join('; ') + ')' : ''}`);
  if (run.status) return run.status;
  return problems.length ? 3 : 0;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exit(main(process.argv.slice(2)));
}
