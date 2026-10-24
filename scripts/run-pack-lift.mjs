#!/usr/bin/env node
// G1 for the skills-with-evals pack: run every pack skill's suite with its no-skill baseline, under
// hard cost caps, on the signed-in Claude Code of whoever runs it. Works on Windows, macOS and Linux.
//
//   node scripts/run-pack-lift.mjs [--skills a,b] [--runs 3] [--per-skill-usd 5] [--total-usd 50]
//                                  [--model sonnet] [--judge-model haiku] [--by "Frank (local)"]
//                                  [--dry-run] [--allow-api-key]
//
// Before anything runs it checks that `claude auth status` says you are signed in, and not with an API
// key (unless --allow-api-key). Then it runs scripts/eval-skill.mjs once per skill (which writes results,
// the HTML report, the run traces and SCORECARD.md), stops early on an auth / rate-limit failure or when
// the total cap is reached, regenerates every CARD.md, and writes a run summary to
// products/skills-with-evals/receipts/g1-run-<stamp>.md.
//
// Isolation is checked from evidence, not assumed: every run's trace starts with an init record listing
// the plugins and skills that loaded. `claude plugin eval` gives each run its own temporary config
// (observed 2026-10-24: a plugin installed in the operator's own config did not load into the run), and
// isolationProblems() fails any run where something other than the staged skill and Claude Code's
// built-ins loaded, or where the no-skill arm loaded the skill. Such a skill is reported not comparable.
//
// Exit 0: every skill ran and is comparable. 1: something stopped or is not comparable. 2: preflight
// or usage failure (nothing was run).

import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { comparability } from './eval-skill.mjs';

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PACK = JSON.parse(readFileSync(join(REPO, 'products', 'skills-with-evals', 'pack.json'), 'utf8'));
const DEFAULTS = { skills: PACK.skills.join(','), runs: '3', 'per-skill-usd': '5', 'total-usd': '50', model: 'sonnet', 'judge-model': 'haiku', by: 'unrecorded' };
const FLAGS = new Set(['dry-run', 'allow-api-key']);

export function parseArgs(argv) {
  const o = { ...DEFAULTS };
  for (const f of FLAGS) o[f] = false;
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i].replace(/^--/, '');
    if (!argv[i].startsWith('--')) throw new Error(`unexpected argument ${argv[i]}`);
    if (FLAGS.has(k)) { o[k] = true; continue; }
    if (!(k in DEFAULTS)) throw new Error(`unknown option --${k}`);
    const v = argv[++i];
    if (v === undefined || v.startsWith('--')) throw new Error(`--${k} needs a value`);
    o[k] = v;
  }
  o.skillList = o.skills.split(',').map((s) => s.trim()).filter(Boolean);
  const bad = o.skillList.filter((s) => !PACK.skills.includes(s));
  if (bad.length) throw new Error(`not in the pack: ${bad.join(', ')}`);
  for (const k of ['per-skill-usd', 'total-usd']) if (!(+o[k] > 0)) throw new Error(`--${k} must be a positive number`);
  if (!/^\d+$/.test(o.runs) || +o.runs < 1) throw new Error('--runs must be a whole number of at least 1');
  return o;
}

// Which stop reasons should halt the whole pack (retrying the next skill would fail the same way)?
export function haltsPack(reason) {
  return /auth|login|rate|limit|quota|overload|credit/i.test(reason || '') && !/cost/i.test(reason || '');
}

function claudeCmd() {
  if (process.platform !== 'win32') return { cmd: 'claude', shell: false };
  const found = spawnSync('where', ['claude'], { encoding: 'utf8' }).stdout?.split(/\r?\n/).filter(Boolean) || [];
  const exe = found.find((p) => p.toLowerCase().endsWith('.exe'));
  if (exe) return { cmd: exe, shell: false };
  const shim = found.find((p) => /\.(cmd|bat)$/i.test(p));
  if (shim) return { cmd: shim, shell: true };
  return null;
}

function preflight(o) {
  const say = (s) => console.log(s);
  const fail = (s) => { console.error(`\nPREFLIGHT FAILED: ${s}\nNothing was run.`); return false; };
  const c = claudeCmd();
  if (!c) return fail('claude is not on PATH.');
  const ver = spawnSync(c.cmd, ['--version'], { encoding: 'utf8', shell: c.shell }).stdout?.trim();
  say(`claude: ${ver || 'unknown version'}`);
  const st = spawnSync(c.cmd, ['auth', 'status', '--json'], { encoding: 'utf8', shell: c.shell });
  let auth = {};
  try { auth = JSON.parse(st.stdout); } catch { return fail(`could not read \`claude auth status --json\`: ${(st.stdout || st.stderr || '').trim().slice(0, 200)}`); }
  say(`auth: loggedIn=${auth.loggedIn} authMethod=${auth.authMethod}`);
  if (!auth.loggedIn) return fail('not signed in. Run `claude auth login` and choose your Claude subscription (not Console/API), then re-run.');
  const apiKey = /api.?key/i.test(String(auth.authMethod)) || !!process.env.ANTHROPIC_API_KEY;
  if (apiKey && !o['allow-api-key']) return fail(`this would bill an API key (authMethod=${auth.authMethod}${process.env.ANTHROPIC_API_KEY ? ', ANTHROPIC_API_KEY is set' : ''}). Unset ANTHROPIC_API_KEY and sign in with your subscription, or pass --allow-api-key.`);
  if (process.env.CLAUDE_CONFIG_DIR) say(`config dir: ${process.env.CLAUDE_CONFIG_DIR} (CLAUDE_CONFIG_DIR)`);
  return c;
}

// Read each run's trace init record and report anything that should not be there.
export function isolationProblems(result, skill, baseDir) {
  const problems = [];
  const models = new Set();
  const staged = `eval-${skill}`;
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
        const leaked = (init.skills || []).filter((sk) => sk.includes(':') ? !sk.startsWith(`${staged}:`) && !/^cc-plugin-/.test(sk) : PACK.skills.includes(sk));
        if (leaked.length) problems.push(`${where}: unexpected skill(s) ${leaked.join(', ')}`);
      });
    }
  }
  return { problems, models: [...models] };
}

function latestResult(skill, since) {
  const dir = join(REPO, 'evals', skill, 'results');
  if (!existsSync(dir)) return null;
  const f = readdirSync(dir).filter((n) => n.endsWith('.json')).sort().at(-1);
  if (!f) return null;
  const data = JSON.parse(readFileSync(join(dir, f), 'utf8'));
  return data.meta?.stamp && data.meta.stamp >= since ? { file: f, ...data } : null;
}

function main(argv) {
  let o;
  try { o = parseArgs(argv); } catch (e) { console.error(`${e.message}\nusage: node scripts/run-pack-lift.mjs [--skills a,b] [--runs N] [--per-skill-usd X] [--total-usd Y] [--model M] [--judge-model M] [--by WHO] [--dry-run]`); return 2; }
  const plannedRuns = (s) => {
    const suite = join(REPO, 'evals', s);
    const cases = readdirSync(suite, { withFileTypes: true }).filter((d) => d.isDirectory() && !d.name.startsWith('_') && d.name !== 'results'
      && (existsSync(join(suite, d.name, 'case.yaml')) || existsSync(join(suite, d.name, 'prompt.md')))).length;
    return { cases, runs: cases * +o.runs * 2 };
  };
  console.log(`Plan: ${o.skillList.length} skill(s), ${o.runs} run(s) per case per arm, model ${o.model}, judge ${o['judge-model']}, cap $${o['per-skill-usd']} per skill and $${o['total-usd']} in total.`);
  for (const s of o.skillList) { const p = plannedRuns(s); console.log(`  ${s.padEnd(27)} ${p.cases} cases → ${p.runs} runs`); }
  if (o['dry-run']) {
    let bad = 0;
    for (const s of o.skillList) {
      const r = spawnSync(process.execPath, [join(REPO, 'scripts', 'eval-skill.mjs'), s, '--stage-only'], { encoding: 'utf8' });
      console.log(`  stage ${s}: ${r.status === 0 ? r.stdout.trim().replace(/ at .*/, '') : 'FAILED ' + r.stderr.trim()}`);
      if (r.status) bad++;
    }
    console.log(bad ? `dry run: ${bad} skill(s) failed to stage` : 'dry run: every skill stages. Nothing was sent to a model.');
    return bad ? 1 : 0;
  }
  if (!preflight(o)) return 2;

  const started = new Date().toISOString().replace(/[:]/g, '-').replace(/\.\d+Z$/, 'Z');
  const rows = [];
  let spent = 0;
  let stopped = null;
  for (const s of o.skillList) {
    const remaining = +o['total-usd'] - spent;
    if (remaining <= 0.01) { stopped = `total cap $${o['total-usd']} reached`; break; }
    const cap = Math.min(+o['per-skill-usd'], remaining).toFixed(2);
    console.log(`\n=== ${s} · cap $${cap} · spent so far $${spent.toFixed(2)} ===`);
    const args = [join(REPO, 'scripts', 'eval-skill.mjs'), s, '--runs', o.runs, '--max-cost-usd', cap,
      '--judge-model', o['judge-model'], '--model', o.model, '--by', o.by];
    const run = spawnSync(process.execPath, args, { stdio: 'inherit' });
    const res = latestResult(s, started);
    if (!res) { rows.push({ s, status: `no result (exit ${run.status})` }); stopped = `${s} produced no result`; break; }
    const r = res.result;
    spent += r.costUsd || 0;
    const iso = isolationProblems(r, s, join(REPO, 'evals', s));
    const problems = [...comparability(r), ...(r.partial ? [] : iso.problems)];
    rows.push({ s, file: res.file, cost: r.costUsd || 0, partial: r.partial ? r.partialReason || 'yes' : '', comparable: !problems.length,
      lift: r.aggregates?.meanDelta, traces: res.meta?.traces ?? 0, models: iso.models, problems });
    if (r.partial && haltsPack(r.partialReason)) { stopped = `${s} stopped: ${r.partialReason}`; break; }
  }

  spawnSync(process.execPath, [join(REPO, 'scripts', 'eval-card.mjs')], { stdio: 'inherit' });
  const pts = (x) => (typeof x === 'number' ? `${x > 0 ? '+' : ''}${Math.round(x * 100)} pts` : 'n/a');
  const lines = [
    `# G1 run ${started}`, '',
    `Run by: ${o.by}. Model ${o.model}, judge ${o['judge-model']}, ${o.runs} run(s) per case per arm. Caps: $${o['per-skill-usd']} per skill, $${o['total-usd']} total.`,
    `Reported cost: $${spent.toFixed(2)} (the harness's own figure; on a subscription this is usage against the plan, not a bill).`,
    stopped ? `**Stopped early:** ${stopped}.` : 'Every requested skill ran.', '',
    '| Skill | Comparable | Mean difference (with − without) | Cost | Traces | Model (from traces) | Notes |', '|---|---|---|---|---|---|---|',
    ...rows.map((x) => `| ${x.s} | ${x.comparable ? 'yes' : 'no'} | ${x.comparable ? pts(x.lift) : '—'} | ${x.cost != null ? '$' + x.cost.toFixed(2) : '—'} | ${x.traces ?? '—'} | ${(x.models || []).join(', ') || '—'} | ${x.status || x.partial || (x.problems || []).slice(0, 4).join('; ') || ''} |`),
    ...o.skillList.filter((s) => !rows.find((x) => x.s === s)).map((s) => `| ${s} | not run | — | — | — | — | skipped after stop |`),
    '', 'A lift claim needs a comparable row with at least 3 runs per arm. Cards: `evals/<skill>/CARD.md` (regenerated).', '',
  ];
  const outDir = join(REPO, 'products', 'skills-with-evals', 'receipts');
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, `g1-run-${started}.md`), lines.join('\n'));
  console.log('\n' + lines.join('\n'));
  console.log(`wrote products/skills-with-evals/receipts/g1-run-${started}.md`);
  return !stopped && rows.length === o.skillList.length && rows.every((x) => x.comparable) ? 0 : 1;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) process.exit(main(process.argv.slice(2)));
