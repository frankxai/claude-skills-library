#!/usr/bin/env node
// Install test for the skills-with-evals pack: does a fresh install expose exactly the pack's skills
// to Claude Code AND Codex? No model call is made; nothing needs a login.
//
//   node scripts/install-test.mjs [--repo <path-to-clean-clone>] [--json <out.json>] [--keep-home]
//                                 [--claude-source <marketplace source>] [--codex-source <marketplace source>]
//
// It runs with a throwaway HOME so the result reflects a machine that has never seen this
// marketplace. Claude Code: marketplace add -> install -> `plugin details` lists the skills.
// Codex: marketplace add -> plugin add -> `debug prompt-input` shows each skill in the
// model-visible skill list. By default both add the marketplace from --repo (a local clone); the
// --*-source options test a remote source instead, e.g. `owner/repo#branch` for Claude Code and
// `owner/repo@branch` for Codex. Works on Linux, macOS and Windows (a `.cmd`/`.bat` shim is run
// through the shell; a native `.exe` is preferred). Exit 0 = both runtimes see all pack skills;
// 1 = a check failed; 2 = a runtime is missing or bad usage.

import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PLUGIN = 'skills-with-evals';

// Pick how to launch a command from `where`/`which` output. On Windows prefer a native .exe; a .cmd or .bat
// shim cannot be spawned without a shell (Node refuses since 18.20/20.12), so it gets shell: true.
export function pickCommand(lines, platform = process.platform) {
  const found = lines.map((l) => l.trim()).filter(Boolean);
  if (!found.length) return null;
  if (platform !== 'win32') return { cmd: found[0], shell: false };
  const exe = found.find((p) => /\.exe$/i.test(p));
  if (exe) return { cmd: exe, shell: false };
  const shim = found.find((p) => /\.(cmd|bat)$/i.test(p));
  if (shim) return { cmd: shim, shell: true };
  return { cmd: found[0], shell: false };
}

// With a shell, quote anything that is not a plain token so paths and `owner/repo#branch` survive.
export function shellArgs(args) {
  return args.map((a) => (/^[\w.:\\/@+=-]+$/.test(a) ? a : `"${String(a).replace(/"/g, '\\"')}"`));
}

function locate(bin) {
  const r = spawnSync(process.platform === 'win32' ? 'where' : 'which', [bin], { encoding: 'utf8' });
  return r.status === 0 ? pickCommand(r.stdout.split(/\r?\n/)) : null;
}

function main(argv) {
  const arg = (name, def) => { const i = argv.indexOf(name); return i > -1 ? argv[i + 1] : def; };
  const repo = resolve(arg('--repo', HERE));
  const jsonOut = arg('--json', null);
  const keepHome = argv.includes('--keep-home');
  const claudeSource = arg('--claude-source', repo);
  const codexSource = arg('--codex-source', repo);

  const pack = JSON.parse(readFileSync(join(repo, 'products', 'skills-with-evals', 'pack.json'), 'utf8'));
  const marketplace = JSON.parse(readFileSync(join(repo, '.claude-plugin', 'marketplace.json'), 'utf8')).name;
  const id = `${PLUGIN}@${marketplace}`;
  const home = mkdtempSync(join(tmpdir(), 'skills-install-home-'));
  mkdirSync(join(home, '.codex'), { recursive: true });
  const env = { ...process.env, HOME: home, USERPROFILE: home, CODEX_HOME: join(home, '.codex') };
  const receipt = { repo, plugin: id, platform: process.platform, sources: { claude: claudeSource, codex: codexSource },
    startedAt: new Date().toISOString(), home: keepHome ? home : '(deleted)', runtimes: {}, pass: false };
  const log = (s) => process.stdout.write(s + '\n');

  const run = (c, args) => {
    const command = c.shell && /\s/.test(c.cmd) ? `"${c.cmd}"` : c.cmd;
    const r = spawnSync(command, c.shell ? shellArgs(args) : args, { env, encoding: 'utf8', timeout: 180_000, shell: c.shell });
    return { code: r.status, out: `${r.stdout || ''}${r.stderr || ''}${r.error ? String(r.error) : ''}`, cmd: [c.cmd.split(/[\\/]/).pop(), ...args].join(' ') };
  };

  const check = (runtime, steps, seen) => {
    const missing = pack.skills.filter((s) => !seen.has(s));
    const extra = [...seen].filter((s) => !pack.skills.includes(s));
    const ok = steps.every((s) => s.code === 0) && missing.length === 0;
    receipt.runtimes[runtime] = { ok, steps: steps.map(({ cmd, code }) => ({ cmd, code })), skillsSeen: [...seen].sort(), missing, extra };
    log(`${ok ? 'PASS' : 'FAIL'} ${runtime}: ${seen.size} skill(s) visible, ${missing.length} missing${missing.length ? ` (${missing.join(', ')})` : ''}${extra.length ? `, ${extra.length} extra` : ''}`);
    for (const s of steps) if (s.code !== 0) log(`     ${s.cmd} -> exit ${s.code}\n     ${s.out.trim().split('\n').slice(-3).join('\n     ')}`);
    return ok;
  };

  const claude = locate('claude');
  const codex = locate('codex');
  log(`install-test: ${id} (Claude Code from ${claudeSource}; Codex from ${codexSource})`);
  log(`throwaway HOME ${home}`);
  if (!claude || !codex) {
    log(`missing runtime: ${!claude ? 'claude ' : ''}${!codex ? 'codex' : ''}`.trim());
    return 2;
  }
  const ver = (r) => r.out.split('\n').filter((l) => l.trim() && !/^WARNING:/.test(l)).join(' ').trim();
  receipt.versions = { claude: ver(run(claude, ['--version'])), codex: ver(run(codex, ['--version'])) };
  log(`versions: ${receipt.versions.claude} | ${receipt.versions.codex}`);

  // Claude Code
  {
    const steps = [run(claude, ['plugin', 'marketplace', 'add', claudeSource]), run(claude, ['plugin', 'install', id])];
    const details = run(claude, ['plugin', 'details', id]);
    steps.push(details);
    const line = details.out.split('\n').find((l) => /^\s*Skills \(\d+\)/.test(l)) || '';
    const seen = new Set((line.replace(/^\s*Skills \(\d+\)\s*/, '').match(/[a-z0-9][a-z0-9-]*/g)) || []);
    const cost = /Always-on:\s*(~?[\d,]+ tok)/.exec(details.out);
    receipt.runtimes['claude-code-cost'] = cost ? cost[1] : 'unknown';
    check('claude-code', steps, seen);
    if (cost) log(`     always-on context cost: ${cost[1]} per session`);
  }

  // Codex: the skill list the model actually sees
  {
    const steps = [run(codex, ['plugin', 'marketplace', 'add', codexSource]), run(codex, ['plugin', 'add', id])];
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
  return receipt.pass ? 0 : 1;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) process.exit(main(process.argv.slice(2)));
