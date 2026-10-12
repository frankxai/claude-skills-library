#!/usr/bin/env node
// PreToolUse hook: hand a Bash or PowerShell tool call to `rtk hook claude`, which rewrites it to a filtered form.
// Fails open on the rewrite itself: no rtk, a crash or a timeout leaves the command untouched and exits 0.
// Fails closed on policy: if permission settings cannot be read, nothing is rewritten.
// Never grants authorization: RTK's own allow decision is stripped, so Claude Code decides on the rewritten command.
//
// Claude Code evaluates permission rules against the input a hook returns, so a rewrite of `git commit` to
// `rtk git commit` would no longer match an ask or deny rule written for `git commit`. This shim therefore leaves a
// command alone when any ask or deny rule it can read could apply to it. Matching is by tokens, not by shell parsing:
// a rule applies when every word of the rule appears somewhere in the command. That over-matches (a skipped rewrite)
// and cannot be fooled by quoting, wrappers, env prefixes, subshells or options placed between the words.
//
// Limit: server-managed settings, MDM policy and the --settings flag cannot be read from a hook. Rules that live only
// there are not seen. RTK also passes denied commands through, from the settings it can read.
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { resolveRtk } from '../scripts/neutron.mjs';

// Documented system locations for managed-settings.json and its managed-settings.d drop-in folder.
export function managedSettingsFiles(platform = process.platform, env = process.env) {
  const dir =
    platform === 'win32' ? join(env.ProgramFiles || 'C:\\Program Files', 'ClaudeCode')
    : platform === 'darwin' ? '/Library/Application Support/ClaudeCode'
    : '/etc/claude-code';
  const files = [join(dir, 'managed-settings.json')];
  try {
    for (const name of readdirSync(join(dir, 'managed-settings.d'))) if (name.endsWith('.json')) files.push(join(dir, 'managed-settings.d', name));
  } catch {
    // no drop-in folder
  }
  return files;
}

// Every directory from `start` up to the filesystem root, or up to and including the first of `stopAt` (a path or a
// list of paths) that it reaches. Tests use stopAt to keep a temporary folder from inheriting the real user's settings.
function ancestors(start, stopAt) {
  const dirs = [];
  const stops = new Set([].concat(stopAt ?? []).map((dir) => resolve(dir)));
  let current = resolve(start);
  for (;;) {
    dirs.push(current);
    const parent = dirname(current);
    if (parent === current || stops.has(current)) return dirs;
    current = parent;
  }
}

export function settingsFiles({ home, roots, env, managed, stopAt }) {
  const userDir = env.CLAUDE_CONFIG_DIR ? resolve(env.CLAUDE_CONFIG_DIR) : join(home, '.claude');
  const projectDirs = roots.flatMap((root) => ancestors(root, stopAt));
  return [
    ...managed,
    join(userDir, 'settings.json'),
    join(userDir, 'settings.local.json'),
    ...projectDirs.flatMap((dir) => [join(dir, '.claude', 'settings.json'), join(dir, '.claude', 'settings.local.json')]),
  ];
}

// Returns the Bash and PowerShell patterns from every ask and deny list that can be read. `unreadable` is true when a
// settings file exists but cannot be read or parsed, or holds a permissions list of the wrong shape.
// Project settings are read from the working directory and from CLAUDE_PROJECT_DIR (the folder Claude Code reports as
// the project, which can differ from the working directory), each with all of its parent folders.
export function loadGuardRules({ home = homedir(), cwd = process.cwd(), env = process.env, managed = managedSettingsFiles(), stopAt } = {}) {
  const roots = [...new Set([cwd, env.CLAUDE_PROJECT_DIR].filter((dir) => typeof dir === 'string' && dir))];
  const patterns = [];
  let unreadable = false;
  for (const file of new Set(settingsFiles({ home, roots, env, managed, stopAt }))) {
    if (!existsSync(file)) continue;
    let settings;
    try {
      settings = JSON.parse(readFileSync(file, 'utf8'));
    } catch {
      unreadable = true;
      continue;
    }
    const permissions = settings?.permissions;
    if (permissions === undefined || permissions === null) continue;
    for (const key of ['ask', 'deny']) {
      const list = permissions[key];
      if (list === undefined) continue;
      if (!Array.isArray(list)) {
        unreadable = true;
        continue;
      }
      for (const rule of list) {
        const match = /^(?:Bash|PowerShell)\((.*)\)$/s.exec(String(rule));
        if (match) patterns.push(match[1]);
      }
    }
  }
  return { patterns, unreadable };
}

const tokens = (text) => String(text).toLowerCase().split(/[^a-z0-9_./-]+/).filter(Boolean);

// True when every word of some rule appears in the command. A rule with no words (such as "*") matches everything.
export function commandHitsRule(command, patterns) {
  const present = new Set(tokens(command));
  return patterns.some((pattern) => tokens(String(pattern).replace(/:\*$/, '')).every((word) => present.has(word)));
}

// The shim rewrites commands. It never grants authorization. RTK adds permissionDecision "allow" when its own reading
// of your allow rules matches, and that would auto-approve a command on the strength of a third-party parser. Only the
// rewritten command and RTK's reason pass through; anything else, or output that is not valid, is dropped.
export function sanitizeHookOutput(stdout) {
  let parsed;
  try {
    parsed = JSON.parse(stdout);
  } catch {
    return '';
  }
  const out = parsed?.hookSpecificOutput;
  const command = out?.updatedInput?.command;
  if (typeof command !== 'string' || !command) return '';
  return JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecisionReason: typeof out.permissionDecisionReason === 'string' ? out.permissionDecisionReason : 'Neutron rewrite',
      updatedInput: { ...out.updatedInput },
    },
  });
}

export function run(stdin, env = process.env, { home = homedir(), cwd = process.cwd(), managed = managedSettingsFiles(process.platform, env), stopAt } = {}) {
  const pass = { stdout: '', status: 0 };
  let input;
  try {
    input = JSON.parse(stdin);
  } catch {
    return pass;
  }
  const command = input?.tool_input?.command;
  if (typeof command !== 'string') return pass;
  const policy = loadGuardRules({ home, cwd: typeof input.cwd === 'string' && input.cwd ? input.cwd : cwd, env, managed, stopAt });
  if (policy.unreadable || commandHitsRule(command, policy.patterns)) return pass;
  const rtk = resolveRtk(env);
  if (!rtk) return pass;
  const res = spawnSync(rtk.command, ['hook', 'claude'], { input: stdin, encoding: 'utf8', timeout: 5000 });
  if (res.error || res.status !== 0) return pass;
  return { stdout: sanitizeHookOutput(res.stdout), status: 0 };
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
