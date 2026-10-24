#!/usr/bin/env node
// G1 for the skills-with-evals pack: run every pack skill's suite with its no-skill baseline, under
// hard cost caps, on the signed-in Claude Code of whoever runs it. Works on Windows, macOS and Linux.
//
//   node scripts/run-pack-lift.mjs                 the full G1 run: 10 skills, 3 runs per arm, $5 per skill, $50 total
//   node scripts/run-pack-lift.mjs --pilot         one skill (github-code-review), 1 run per arm, $1 cap
//   node scripts/run-pack-lift.mjs --dry-run       stage every suite and list the files a run will write; no model call
//   node scripts/run-pack-lift.mjs --check-outputs after a run: verify the files, trace counts, isolation and cards
//   options: [--skills a,b] [--runs N] [--per-skill-usd X] [--total-usd Y] [--model sonnet] [--judge-model haiku]
//            [--by WHO] [--allow-api-key] [--ledger FILE] [--force] [--retry-capped] [--break-lock]
//
// Resumable and idempotent. Every model run is recorded in a cost ledger (JSON Lines, default
// products/skills-with-evals/receipts/g1-ledger.jsonl): a "start" record, with the cap it may spend, is written and
// fsynced BEFORE the skill runs, and a "finish" record with the reported cost after. The ledger is the campaign:
// --total-usd caps everything it records, across every invocation, not just this one. So:
//   - re-running the same command after a crash or Ctrl-C continues where it stopped;
//   - a skill whose newest result is current (skill and suite unchanged), complete, comparable, isolated and has
//     at least --runs runs per arm is skipped, not re-run (--force re-runs it);
//   - a skill that stopped on its cost cap is not retried at the same cap (--retry-capped, or a higher
//     --per-skill-usd, retries it);
//   - a start with no finish (the process was killed) is reconciled first: from the result file it wrote, if any,
//     otherwise counted at its full cap, so an interruption can never let the campaign spend more than --total-usd;
//   - a lock file stops two runs on the same ledger at once (a lock left by a dead process on this machine is
//     cleared automatically; one from elsewhere needs --break-lock).
// Start a new campaign (for example after changing skills on purpose) with a new --ledger file.
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
import { closeSync, existsSync, fsyncSync, mkdirSync, openSync, readFileSync, readSync, readdirSync, rmSync, statSync, writeFileSync, writeSync } from 'node:fs';
import { hostname, userInfo } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { comparability, reviewLift } from './eval-skill.mjs';
import { coverage, currentHashes, staleness } from './eval-card.mjs';

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PACK = JSON.parse(readFileSync(join(REPO, 'products', 'skills-with-evals', 'pack.json'), 'utf8'));
const whoami = () => { try { return `${userInfo().username} (local)`; } catch { return 'local run'; } };
export const LEDGER = join(REPO, 'products', 'skills-with-evals', 'receipts', 'g1-ledger.jsonl');
const DEFAULTS = { skills: PACK.skills.join(','), runs: '3', 'per-skill-usd': '5', 'total-usd': '50', model: 'sonnet', 'judge-model': 'haiku', by: whoami(), ledger: LEDGER };
const FLAGS = new Set(['dry-run', 'allow-api-key', 'pilot', 'check-outputs', 'force', 'retry-capped', 'break-lock']);
export const PILOT = { skills: 'github-code-review', runs: '1', 'per-skill-usd': '1' };

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
  if (o.pilot) for (const [k, v] of Object.entries(PILOT)) if (!argv.includes(`--${k}`)) o[k] = v;
  o.skillList = o.skills.split(',').map((s) => s.trim()).filter(Boolean);
  const bad = o.skillList.filter((s) => !PACK.skills.includes(s));
  if (bad.length) throw new Error(`not in the pack: ${bad.join(', ')}`);
  for (const k of ['per-skill-usd', 'total-usd']) if (!(+o[k] > 0)) throw new Error(`--${k} must be a positive number`);
  if (!/^\d+$/.test(o.runs) || +o.runs < 1) throw new Error('--runs must be a whole number of at least 1');
  o.ledger = resolve(o.ledger);
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

// The files one skill's run writes (relative to the repo), and how many traces to expect.
export function expectedOutputs(skill, cases, runs) {
  return {
    traces: cases * runs * 2,
    files: [
      `evals/${skill}/results/<stamp>.json`,
      `evals/${skill}/results/<stamp>.report.html`,
      `evals/${skill}/results/<stamp>/traces/<case>__<with|without>__<n>.jsonl  (${cases * runs * 2} files)`,
      `evals/${skill}/SCORECARD.md`,
      `evals/${skill}/CARD.md  (regenerated)`,
    ],
  };
}

// After a run: does the newest result for each skill have everything it should, and is it usable?
export function checkOutputs(skill, root = REPO) {
  const dir = join(root, 'evals', skill, 'results');
  const out = { skill, ok: false, notes: [] };
  if (!existsSync(dir)) { out.notes.push('no results/ folder (not run yet)'); return out; }
  const json = readdirSync(dir).filter((n) => n.endsWith('.json')).sort().at(-1);
  if (!json) { out.notes.push('no result file (not run yet)'); return out; }
  const stamp = json.replace(/\.json$/, '');
  const data = JSON.parse(readFileSync(join(dir, json), 'utf8'));
  const r = data.result || {};
  const runs = (r.cases || []).reduce((n, c) => n + (c.arms?.with?.length || 0) + (c.arms?.without?.length || 0), 0);
  const traceDir = join(dir, stamp, 'traces');
  const traces = existsSync(traceDir) ? readdirSync(traceDir).filter((n) => n.endsWith('.jsonl')).length : 0;
  out.stamp = stamp;
  if (!existsSync(join(dir, `${stamp}.report.html`))) out.notes.push('HTML report missing');
  if (traces !== runs) out.notes.push(`${traces} traces for ${runs} runs`);
  if (!existsSync(join(root, 'evals', skill, 'SCORECARD.md'))) out.notes.push('SCORECARD.md missing');
  const problems = [...comparability(r), ...(r.partial ? [] : isolationProblems(r, skill, join(root, 'evals', skill)).problems)];
  out.notes.push(...problems.slice(0, 3));
  out.runs = runs;
  out.traces = traces;
  out.ok = out.notes.length === 0;
  return out;
}

// ---- cost ledger: append-only JSON Lines, the single source of truth for what a campaign has spent ----
const stampNow = () => new Date().toISOString().replace(/[:]/g, '-').replace(/\.\d+Z$/, 'Z');

export function readLedger(file) {
  if (!existsSync(file)) return { records: [], torn: 0 };
  const records = []; let torn = 0;
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    if (!line.trim()) continue;
    try { records.push(JSON.parse(line)); } catch { torn++; } // a line cut off by a crash mid-write
  }
  return { records, torn };
}

export function appendLedger(file, rec) {
  mkdirSync(dirname(file), { recursive: true });
  // If a crash left a torn last line, start on a fresh line so this record stays parseable.
  let lead = '';
  if (existsSync(file) && statSync(file).size > 0) {
    const fd0 = openSync(file, 'r'); const b = Buffer.alloc(1);
    try { readSync(fd0, b, 0, 1, statSync(file).size - 1); } finally { closeSync(fd0); }
    if (b.toString() !== '\n') lead = '\n';
  }
  const fd = openSync(file, 'a');
  try { writeSync(fd, lead + JSON.stringify(rec) + '\n'); fsyncSync(fd); } finally { closeSync(fd); }
}

// What the ledger says has been spent. An open start (no finish yet) counts at its full cap.
export function ledgerState(records) {
  const open = new Map(); const finished = []; let spent = 0;
  for (const r of records) {
    if (r.type === 'start') open.set(r.id, r);
    else if (r.type === 'finish') { open.delete(r.id); finished.push(r); spent += Number(r.costUsd) || 0; }
  }
  const reserved = [...open.values()].reduce((n, r) => n + (Number(r.capUsd) || 0), 0);
  return { spent, reserved, committed: spent + reserved, open: [...open.values()], finished };
}

// Close every open start: from the result file the run wrote (its reported cost), or at its full cap if none exists.
// Sound because the lock guarantees that any result for that skill stamped after the start belongs to that start.
export function reconcile(open, resultSince, at = stampNow()) {
  return open.map((st) => {
    const res = resultSince(st.skill, st.at);
    if (res) {
      const r = res.result || {};
      return { type: 'finish', id: st.id, skill: st.skill, at, status: r.partial ? 'partial' : 'complete', partialReason: r.partialReason || null,
        costUsd: Number(r.costUsd) || 0, costKnown: true, capUsd: st.capUsd, skillHash: st.skillHash, suiteHash: st.suiteHash, resultFile: res.file, reconciled: true };
    }
    return { type: 'finish', id: st.id, skill: st.skill, at, status: 'interrupted', partialReason: 'interrupted before a result was written',
      costUsd: Number(st.capUsd) || 0, costKnown: false, capUsd: st.capUsd, skillHash: st.skillHash, suiteHash: st.suiteHash, resultFile: null, reconciled: true,
      note: 'no result file; counted at its full cap so the campaign cannot overspend' };
  });
}

const minRunsPerArm = (r) => {
  const n = (r.cases || []).flatMap((c) => ['with', 'without'].map((a) => (c.arms?.[a] || []).length));
  return n.length ? Math.min(...n) : 0;
};

// Run, or skip, one skill? Pure given its inputs, so the resume logic is testable without a model.
export function decide(skill, o, { hashes, latest, isolation, finished }) {
  if (o.force) return { action: 'run', reason: '--force' };
  const now = hashes(skill);
  const res = latest(skill);
  let why = 'not run yet';
  if (res) {
    const r = res.result || {};
    const problems = [...staleness(res, now), ...coverage(res, now), ...comparability(r), ...(r.partial ? [`partial: ${r.partialReason || 'stopped early'}`] : []),
      ...(r.partial ? [] : isolation(r, skill)), ...(minRunsPerArm(r) < +o.runs ? [`${minRunsPerArm(r)} run(s) per arm, ${o.runs} requested`] : [])];
    if (!problems.length) return { action: 'skip', reason: `already measured (${res.file}: current, complete, comparable, ${minRunsPerArm(r)} runs per arm)`, res };
    why = `newest result not usable: ${problems[0]}`;
  }
  const capped = finished.filter((f) => f.skill === skill && f.skillHash === now.skillHash && f.suiteHash === now.suiteHash
    && f.status === 'partial' && /cost|budget|max-cost/i.test(f.partialReason || '')).at(-1);
  if (capped && !o['retry-capped'] && +o['per-skill-usd'] <= +capped.capUsd) {
    return { action: 'skip', reason: `stopped at its $${(+capped.capUsd).toFixed(2)} cap (${capped.at}); not retried at the same cap. Raise --per-skill-usd or pass --retry-capped` };
  }
  return { action: 'run', reason: why, hashes: now };
}

const pidAlive = (pid) => { try { process.kill(pid, 0); return true; } catch (e) { return e.code === 'EPERM'; } };

export function acquireLock(ledger, { breakLock = false } = {}) {
  const lock = `${ledger}.lock`;
  mkdirSync(dirname(lock), { recursive: true });
  try {
    writeFileSync(lock, JSON.stringify({ pid: process.pid, host: hostname(), at: new Date().toISOString() }), { flag: 'wx' });
    return { lock, cleared: null };
  } catch (e) {
    if (e.code !== 'EEXIST') throw e;
    let info = {};
    try { info = JSON.parse(readFileSync(lock, 'utf8')); } catch { /* unreadable lock: treat as foreign */ }
    const here = info.host === hostname();
    if (here && pidAlive(info.pid)) throw new Error(`another G1 run (pid ${info.pid}, since ${info.at}) holds ${lock}. Wait for it to finish.`);
    if (!here && !breakLock) throw new Error(`${lock} was left by ${info.host || 'an unknown host'} (pid ${info.pid}, ${info.at}). If no run is active there, re-run with --break-lock.`);
    rmSync(lock, { force: true });
    const again = acquireLock(ledger);
    return { ...again, cleared: `cleared a lock left by pid ${info.pid} on ${info.host || 'unknown host'} (${info.at})` };
  }
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
  try { o = parseArgs(argv); } catch (e) { console.error(`${e.message}\nusage: node scripts/run-pack-lift.mjs [--pilot | --dry-run | --check-outputs] [--skills a,b] [--runs N] [--per-skill-usd X] [--total-usd Y] [--model M] [--judge-model M] [--by WHO] [--ledger FILE] [--force] [--retry-capped] [--break-lock]`); return 2; }
  const plannedRuns = (s) => {
    const suite = join(REPO, 'evals', s);
    const cases = readdirSync(suite, { withFileTypes: true }).filter((d) => d.isDirectory() && !d.name.startsWith('_') && d.name !== 'results'
      && (existsSync(join(suite, d.name, 'case.yaml')) || existsSync(join(suite, d.name, 'prompt.md')))).length;
    return { cases, runs: cases * +o.runs * 2 };
  };
  if (o['check-outputs']) {
    let bad = 0;
    for (const s of o.skillList) {
      const c = checkOutputs(s);
      console.log(`${c.ok ? 'OK  ' : 'FAIL'} ${s.padEnd(27)} ${c.stamp ? `${c.stamp} · ${c.runs} runs · ${c.traces} traces` : ''}${c.notes.length ? ' · ' + c.notes.join('; ') : ''}`);
      if (!c.ok) bad++;
    }
    const cards = spawnSync(process.execPath, [join(REPO, 'scripts', 'eval-card.mjs'), '--check'], { encoding: 'utf8' });
    console.log(cards.status === 0 ? 'cards: every CARD.md is current' : `cards: stale, run node scripts/eval-card.mjs\n${cards.stdout}`);
    console.log(bad || cards.status ? `check-outputs: ${bad} skill(s) incomplete or not comparable` : 'check-outputs: every skill has a complete, comparable, isolated result');
    return bad || cards.status ? 1 : 0;
  }
  console.log(`Plan: ${o.skillList.length} skill(s), ${o.runs} run(s) per case per arm, model ${o.model}, judge ${o['judge-model']}, cap $${o['per-skill-usd']} per skill and $${o['total-usd']} for the campaign (ledger), recorded as run by "${o.by}".`);
  for (const s of o.skillList) { const p = plannedRuns(s); console.log(`  ${s.padEnd(27)} ${p.cases} cases → ${p.runs} runs`); }
  if (o['dry-run']) {
    console.log('Files the run will write:');
    for (const s of o.skillList) for (const f of expectedOutputs(s, plannedRuns(s).cases, +o.runs).files) console.log(`  ${f}`);
    console.log('  products/skills-with-evals/receipts/g1-run-<stamp>.md  (the run summary)');
    let bad = 0;
    for (const s of o.skillList) {
      const r = spawnSync(process.execPath, [join(REPO, 'scripts', 'eval-skill.mjs'), s, '--stage-only'], { encoding: 'utf8' });
      console.log(`  stage ${s}: ${r.status === 0 ? r.stdout.trim().replace(/ at .*/, '') : 'FAILED ' + r.stderr.trim()}`);
      if (r.status) bad++;
    }
    const led = ledgerState(readLedger(o.ledger).records);
    console.log(`Ledger: ${o.ledger.replace(REPO + '/', '')} · spent $${led.spent.toFixed(2)}${led.open.length ? ` + $${led.reserved.toFixed(2)} in ${led.open.length} interrupted run(s), counted at cap unless their results are found` : ''} · remaining $${Math.max(0, +o['total-usd'] - led.committed).toFixed(2)} of $${(+o['total-usd']).toFixed(2)}`);
    if (!bad) {
      const deps = realDeps();
      for (const s of o.skillList) {
        const dec = decide(s, o, { hashes: deps.hashes, latest: deps.latest, isolation: deps.isolation, finished: led.finished });
        console.log(`  ${dec.action === 'run' ? 'would run ' : 'would skip'} ${s.padEnd(27)} ${dec.reason}`);
      }
    }
    console.log(bad ? `dry run: ${bad} skill(s) failed to stage` : 'dry run: every skill stages. Nothing was sent to a model.');
    return bad ? 1 : 0;
  }
  if (!preflight(o)) return 2;
  let held;
  try { held = acquireLock(o.ledger, { breakLock: o['break-lock'] }); } catch (e) { console.error(`\nLEDGER LOCKED: ${e.message}\nNothing was run.`); return 2; }
  if (held.cleared) console.log(`ledger: ${held.cleared}`);
  try { return runPack(o).exitCode; } finally { rmSync(held.lock, { force: true }); }
}

const realDeps = () => ({
  hashes: (s) => currentHashes(s),
  latest: (s) => latestResult(s, ''),
  resultSince: (s, since) => latestResult(s, since),
  isolation: (r, s) => isolationProblems(r, s, join(REPO, 'evals', s)).problems,
  models: (r, s) => isolationProblems(r, s, join(REPO, 'evals', s)).models,
  runSkill: (s, cap, o) => spawnSync(process.execPath, [join(REPO, 'scripts', 'eval-skill.mjs'), s, '--runs', o.runs, '--max-cost-usd', cap,
    '--judge-model', o['judge-model'], '--model', o.model, '--by', o.by], { stdio: 'inherit' }).status,
  regenerateCards: () => spawnSync(process.execPath, [join(REPO, 'scripts', 'eval-card.mjs')], { stdio: 'inherit' }),
  receiptsDir: join(REPO, 'products', 'skills-with-evals', 'receipts'),
  now: stampNow,
  log: (x) => console.log(x),
});

// The run itself, under the caller's lock. deps are injectable so a crash and a resume can be tested without a model.
export function runPack(o, deps = realDeps()) {
  const d = { ...realDeps(), ...deps };
  const started = d.now();
  const { records, torn } = readLedger(o.ledger);
  if (torn) d.log(`ledger: ignored ${torn} unreadable line(s) (a write cut off by a crash)`);
  const closing = reconcile(ledgerState(records).open, d.resultSince, started);
  for (const f of closing) { appendLedger(o.ledger, f); d.log(`ledger: reconciled interrupted run ${f.id}: ${f.costKnown ? `reported $${f.costUsd.toFixed(2)} from ${f.resultFile}` : `no result, counted at its $${f.costUsd.toFixed(2)} cap`}`); }
  const before = ledgerState(readLedger(o.ledger).records);
  let committed = before.committed;
  const total = +o['total-usd'];
  d.log(`ledger: ${o.ledger.replace(REPO + '/', '')} · campaign spent $${before.spent.toFixed(2)} of $${total.toFixed(2)} · remaining $${Math.max(0, total - committed).toFixed(2)}`);

  const rows = [];
  let stopped = null;
  let spentNow = 0;
  for (const s of o.skillList) {
    const dec = decide(s, o, { hashes: d.hashes, latest: d.latest, isolation: d.isolation, finished: ledgerState(readLedger(o.ledger).records).finished });
    if (dec.action === 'skip') {
      d.log(`\n=== ${s} · skipped: ${dec.reason} ===`);
      const r = dec.res?.result;
      rows.push({ s, skipped: dec.reason, file: dec.res?.file, comparable: !!r, lift: r ? reviewLift(r) : null, cost: null, traces: dec.res?.meta?.traces ?? null, models: r ? d.models(r, s) : [] });
      continue;
    }
    const remaining = total - committed;
    if (remaining <= 0.01) { stopped = `campaign cap $${total.toFixed(2)} reached (ledger)`; break; }
    const cap = Math.min(+o['per-skill-usd'], remaining);
    const h = dec.hashes || d.hashes(s);
    const id = `${d.now()}:${s}`;
    const at = id.split(':')[0];
    appendLedger(o.ledger, { type: 'start', id, skill: s, at, capUsd: +cap.toFixed(2), runs: +o.runs, model: o.model, judgeModel: o['judge-model'], by: o.by, skillHash: h.skillHash, suiteHash: h.suiteHash, reason: dec.reason });
    committed += +cap.toFixed(2);
    d.log(`\n=== ${s} · ${dec.reason} · cap $${cap.toFixed(2)} · campaign committed $${committed.toFixed(2)} of $${total.toFixed(2)} ===`);
    const status = d.runSkill(s, cap.toFixed(2), o);
    const res = d.resultSince(s, at);
    const r = res?.result;
    const fin = { type: 'finish', id, skill: s, at: d.now(), status: r ? (r.partial ? 'partial' : 'complete') : 'no-result', partialReason: r ? r.partialReason || null : `exit ${status}`,
      costUsd: r ? Number(r.costUsd) || 0 : +cap.toFixed(2), costKnown: !!r, capUsd: +cap.toFixed(2), skillHash: h.skillHash, suiteHash: h.suiteHash, resultFile: res?.file || null,
      ...(r ? {} : { note: 'no result file; counted at its full cap so the campaign cannot overspend' }) };
    appendLedger(o.ledger, fin);
    committed += fin.costUsd - +cap.toFixed(2);
    spentNow += fin.costUsd;
    if (!r) { rows.push({ s, status: `no result (exit ${status}); counted at its $${cap.toFixed(2)} cap`, cost: fin.costUsd }); stopped = `${s} produced no result`; break; }
    const problems = [...comparability(r), ...(r.partial ? [] : d.isolation(r, s))];
    rows.push({ s, file: res.file, cost: fin.costUsd, partial: r.partial ? r.partialReason || 'yes' : '', comparable: !problems.length,
      lift: reviewLift(r), traces: res.meta?.traces ?? 0, models: d.models(r, s), problems });
    if (r.partial && haltsPack(r.partialReason)) { stopped = `${s} stopped: ${r.partialReason}`; break; }
  }

  d.regenerateCards();
  const after = ledgerState(readLedger(o.ledger).records);
  const pts = (x) => (typeof x === 'number' ? `${x > 0 ? '+' : ''}${Math.round(x * 100)} pts` : 'n/a');
  const money = (x) => (x == null ? '—' : `$${x.toFixed(2)}`);
  const lines = [
    `# G1 run ${started}`, '',
    `Run by: ${o.by}. Model ${o.model}, judge ${o['judge-model']}, ${o.runs} run(s) per case per arm. Caps: $${o['per-skill-usd']} per skill, $${o['total-usd']} for the campaign.`,
    `Reported cost this invocation: ${money(spentNow)}. Campaign total in the ledger: ${money(after.spent)} of ${money(total)} (\`${o.ledger.replace(REPO + '/', '')}\`). These are the harness's own figures; on a subscription this is usage against the plan, not a bill.`,
    closing.length ? `Reconciled ${closing.length} interrupted run(s) from an earlier invocation: ${closing.map((f) => `${f.skill} ${f.costKnown ? money(f.costUsd) + ' reported' : money(f.costUsd) + ' counted at cap'}`).join('; ')}.` : 'No interrupted runs to reconcile.',
    stopped ? `**Stopped early:** ${stopped}. Re-run the same command to continue; finished skills are skipped.` : 'Every requested skill ran or already had a usable result.', '',
    '| Skill | Comparable | Lift over review cases (with − without) | Cost | Traces | Model (from traces) | Notes |', '|---|---|---|---|---|---|---|',
    ...rows.map((x) => `| ${x.s} | ${x.comparable ? 'yes' : 'no'} | ${x.comparable ? pts(x.lift) : '—'} | ${x.skipped ? 'earlier run' : money(x.cost)} | ${x.traces ?? '—'} | ${(x.models || []).join(', ') || '—'} | ${x.skipped || x.status || x.partial || (x.problems || []).slice(0, 4).join('; ') || ''} |`),
    ...o.skillList.filter((s) => !rows.find((x) => x.s === s)).map((s) => `| ${s} | not run | — | — | — | — | not reached: ${stopped || 'stopped'} |`),
    '', '## Ledger (every run in this campaign)', '',
    '| Run | Skill | Status | Cost | Cap | Cost known | Result |', '|---|---|---|---|---|---|---|',
    ...after.finished.map((f) => `| ${f.id.split(':')[0]} | ${f.skill} | ${f.status}${f.reconciled ? ' (reconciled)' : ''} | ${money(Number(f.costUsd))} | ${money(Number(f.capUsd))} | ${f.costKnown ? 'yes' : 'no, counted at cap'} | ${f.resultFile || '—'} |`),
    '', 'A lift claim needs a comparable row with at least 3 runs per arm. Cards: `evals/<skill>/CARD.md` (regenerated).', '',
  ];
  mkdirSync(d.receiptsDir, { recursive: true });
  const receipt = join(d.receiptsDir, `g1-run-${started}.md`);
  writeFileSync(receipt, lines.join('\n'));
  d.log('\n' + lines.join('\n'));
  d.log(`wrote ${receipt.replace(REPO + '/', '')}`);
  const exitCode = !stopped && rows.length === o.skillList.length && rows.every((x) => x.comparable) ? 0 : 1;
  return { exitCode, rows, stopped, spentNow, campaignSpent: after.spent, reconciled: closing, receipt };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) process.exit(main(process.argv.slice(2)));
