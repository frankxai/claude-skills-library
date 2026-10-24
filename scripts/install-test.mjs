#!/usr/bin/env node
// Install test for the skills-with-evals pack: does a fresh install expose exactly the pack's skills
// to Claude Code AND Codex? No model call is made; nothing needs a login.
//
//   node scripts/install-test.mjs [--repo <path-to-clean-clone>] [--json <out.json>] [--keep-home]
//
// It runs with a throwaway HOME so the result reflects a machine that has never seen this
// marketplace. Claude Code: marketplace add -> install -> `plugin details` lists the skills.
// Codex: marketplace add -> plugin add -> `debug prompt-input` shows each skill in the
// model-visible skill list. Exit 0 = both runtimes see all pack skills; 1 = a check failed;
// 2 = a runtime is missing or bad usage.

import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PLUGIN = 'skills-with-evals';

function arg(name, def) {
  const i = process.argv.indexOf(name);
  return i > -1 ? process.argv[i + 1] : def;
}
const repo = resolve(arg('--repo', HERE));
const jsonOut = arg('--json', null);
const keepHome = process.argv.includes('--keep-home');

function which(bin) {
  const r = spawnSync(process.platform === 'win32' ? 'where' : 'which', [bin], { encoding: 'utf8' });
  return r.status === 0 ? r.stdout.split(/\r?\n/)[0].trim() : null;
}

const pack = JSON.parse(readFileSync(join(repo, 'products', 'skills-with-evals', 'pack.json'), 'utf8'));
const marketplace = JSON.parse(readFileSync(join(repo, '.claude-plugin', 'marketplace.json'), 'utf8')).name;
const id = `${PLUGIN}@${marketplace}`;
const home = mkdtempSync(join(tmpdir(), 'skills-install-home-'));
mkdirSync(join(home, '.codex'), { recursive: true });
const env = { ...process.env, HOME: home, USERPROFILE: home, CODEX_HOME: join(home, '.codex') };
const receipt = { repo, plugin: id, startedAt: new Date().toISOString(), home: keepHome ? home : '(deleted)', runtimes: {}, pass: false };
const log = (s) => process.stdout.write(s + '\n');

function run(cmd, args) {
  const r = spawnSync(cmd, args, { env, encoding: 'utf8', timeout: 180_000 });
  return { code: r.status, out: `${r.stdout || ''}${r.stderr || ''}`, cmd: [cmd.split(/[\\/]/).pop(), ...args].join(' ') };
}

function check(runtime, steps, seen) {
  const missing = pack.skills.filter((s) => !seen.has(s));
  const extra = [...seen].filter((s) => !pack.skills.includes(s));
  const ok = steps.every((s) => s.code === 0) && missing.length === 0;
  receipt.runtimes[runtime] = { ok, steps: steps.map(({ cmd, code }) => ({ cmd, code })), skillsSeen: [...seen].sort(), missing, extra };
  log(`${ok ? 'PASS' : 'FAIL'} ${runtime}: ${seen.size} skill(s) visible, ${missing.length} missing${missing.length ? ` (${missing.join(', ')})` : ''}${extra.length ? `, ${extra.length} extra` : ''}`);
  for (const s of steps) if (s.code !== 0) log(`     ${s.cmd} -> exit ${s.code}\n     ${s.out.trim().split('\n').slice(-3).join('\n     ')}`);
  return ok;
}

const claude = which('claude');
const codex = which('codex');
log(`install-test: ${id} from ${repo}`);
log(`throwaway HOME ${home}`);
if (!claude || !codex) {
  log(`missing runtime: ${!claude ? 'claude ' : ''}${!codex ? 'codex' : ''}`.trim());
  process.exit(2);
}
receipt.versions = { claude: run(claude, ['--version']).out.trim(), codex: run(codex, ['--version']).out.trim() };
log(`versions: ${receipt.versions.claude} | ${receipt.versions.codex}`);

// Claude Code
{
  const steps = [run(claude, ['plugin', 'marketplace', 'add', repo]), run(claude, ['plugin', 'install', id])];
  const details = run(claude, ['plugin', 'details', id]);
  steps.push(details);
  const line = details.out.split('\n').find((l) => /^\s*Skills \(\d+\)/.test(l)) || '';
  const seen = new Set((line.replace(/^\s*Skills \(\d+\)\s*/, '').match(/[a-z0-9][a-z0-9-]*/g)) || []);
  const cost = /Always-on:\s*(~?[\d,]+ tok)/.exec(details.out);
  receipt.runtimes['claude-code-cost'] = cost ? cost[1] : 'unknown';
  check('claude-code', steps, seen);
  if (cost) log(`     always-on context cost: ${cost[1]} per session`);
}

// Codex
{
  const steps = [run(codex, ['plugin', 'marketplace', 'add', repo]), run(codex, ['plugin', 'add', id])];
  const prompt = run(codex, ['debug', 'prompt-input', 'hello']);
  steps.push(prompt);
  const seen = new Set();
  const re = new RegExp(`${PLUGIN}:([a-z0-9][a-z0-9-]*):`, 'g');
  for (const m of prompt.out.matchAll(re)) seen.add(m[1]);
  check('codex', steps, seen);
}

receipt.finishedAt = new Date().toISOString();
receipt.pass = Object.entries(receipt.runtimes).filter(([k]) => !k.endsWith('-cost')).every(([, v]) => v.ok);
log(`install-test: ${receipt.pass ? 'PASS' : 'FAIL'} (${pack.skills.length} pack skills expected in each runtime)`);
if (jsonOut) writeFileSync(resolve(jsonOut), JSON.stringify(receipt, null, 2) + '\n');
if (!keepHome) rmSync(home, { recursive: true, force: true });
process.exit(receipt.pass ? 0 : 1);
