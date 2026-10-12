#!/usr/bin/env node
// PreToolUse hook: hand a Bash or PowerShell tool call to `rtk hook claude`, which rewrites it to a filtered form.
// Fails open: no rtk, a crash, bad input or a timeout leaves the command untouched and exits 0.
//
// Claude Code evaluates permission rules against the input a hook returns, so a rewrite of `git commit` to
// `rtk git commit` would no longer match an ask or deny rule written for `git commit`. RTK passes denied commands
// through itself; this shim also leaves a command alone when it, or any segment of it, matches an ask or deny rule.
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { resolveRtk } from '../scripts/neutron.mjs';

const SETTINGS_FILES = (home, cwd) => [
  join(home, '.claude', 'settings.json'),
  join(home, '.claude', 'settings.local.json'),
  join(cwd, '.claude', 'settings.json'),
  join(cwd, '.claude', 'settings.local.json'),
];

function readJson(path) {
  try {
    return existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : null;
  } catch {
    return null;
  }
}

// Collect Bash and PowerShell patterns from ask and deny lists. Returns bare command patterns such as "git commit:*".
export function loadGuardRules(home = homedir(), cwd = process.cwd()) {
  const patterns = [];
  for (const file of SETTINGS_FILES(home, cwd)) {
    const permissions = readJson(file)?.permissions ?? {};
    for (const rule of [...(permissions.ask ?? []), ...(permissions.deny ?? [])]) {
      const match = /^(?:Bash|PowerShell)\((.*)\)$/s.exec(String(rule));
      if (match) patterns.push(match[1]);
    }
  }
  return patterns;
}

function segmentMatches(segment, pattern) {
  const text = segment.trim();
  if (!text) return false;
  if (pattern.endsWith(':*')) {
    const prefix = pattern.slice(0, -2).trim();
    return text === prefix || text.startsWith(`${prefix} `);
  }
  if (pattern.includes('*')) {
    const source = pattern.split('*').map((part) => part.replace(/[.+?^${}()|[\]\\]/g, '\\$&')).join('.*');
    return new RegExp(`^${source}$`, 's').test(text);
  }
  return text === pattern.trim();
}

// Over-approximates on purpose: a false match only skips a rewrite, a false miss would skip a prompt.
export function commandHitsRule(command, patterns) {
  const segments = String(command).split(/&&|\|\||[;|\n]/);
  return segments.some((segment) => patterns.some((pattern) => segmentMatches(segment, pattern) || segmentMatches(command, pattern)));
}

export function run(stdin, env = process.env, { home = homedir(), cwd = process.cwd() } = {}) {
  const pass = { stdout: '', status: 0 };
  let command;
  try {
    command = JSON.parse(stdin)?.tool_input?.command;
  } catch {
    return pass;
  }
  if (typeof command !== 'string') return pass;
  if (commandHitsRule(command, loadGuardRules(home, cwd))) return pass;
  const rtk = resolveRtk(env);
  if (!rtk) return pass;
  const res = spawnSync(rtk.command, ['hook', 'claude'], { input: stdin, encoding: 'utf8', timeout: 5000 });
  if (res.error || res.status !== 0) return pass;
  return { stdout: res.stdout, status: 0 };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  let input = '';
  try {
    input = readFileSync(0, 'utf8');
  } catch {
    process.exit(0);
  }
  const { stdout } = run(input);
  if (stdout) process.stdout.write(stdout);
  process.exit(0);
}
