#!/usr/bin/env node
// PreToolUse hook: hand a Bash or PowerShell tool call to `rtk hook claude`, which rewrites it to a filtered form.
// Fails open on the rewrite itself: no rtk, a crash or a timeout leaves the command untouched and exits 0.
// Fails closed on policy: if permission settings cannot be read, nothing is rewritten.
// Never grants authorization: RTK's own allow decision is stripped, so Claude Code decides on the rewritten command.
//
// Claude Code evaluates permission rules against the input a hook returns, so a rewrite of `git commit` to
// `rtk git commit` would no longer match an ask or deny rule written for `git commit`. This shim therefore leaves a
// command alone when any ask or deny rule it can read could apply to it. It does not emulate Claude Code's matcher.
// It tests two necessary conditions (see commandHitsRule): every word of a plain rule appears in the command, and every
// literal piece of a glob rule appears in the command text. Both over-match, which costs a skipped rewrite, and neither
// can be fooled by quoting, wrappers, env prefixes, subshells, options between words or a `*` touching other text.
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
        const text = String(rule).trim();
        // A bare tool name (`Bash`, `PowerShell`) is a rule on every command of that tool: treat it as match-all.
        if (/^(?:Bash|PowerShell)$/.test(text)) {
          patterns.push('*');
          continue;
        }
        const match = /^(?:Bash|PowerShell)\((.*)\)$/s.exec(text);
        if (match) patterns.push(match[1]);
      }
    }
  }
  return { patterns, unreadable };
}

const tokens = (text) => String(text).toLowerCase().split(/[^a-z0-9_./-]+/).filter(Boolean);

// For the containment test below: Unicode compatibility form, lower case, and no whitespace, quotes or backslashes,
// so spacing, quoting and case cannot hide a match.
const squash = (text) => String(text).normalize('NFKC').toLowerCase().replace(/[\s"'`\\]+/g, '');

// True when some ask or deny rule could apply to the command. Two necessary conditions, so each is a superset of what
// Claude Code's own matcher accepts:
//  - A rule without a wildcard in its body (`git commit:*`, `git status`) applies to a command only if every word of the
//    rule appears in it.
//  - A glob rule (`cat .env*`, `git log -*`) applies only if every literal piece between its `*` wildcards appears in
//    the command text as a substring. A wildcard can stand for any text, including the rest of a word.
// A rule with no literal text (`*`) matches everything. Over-matching costs a skipped rewrite; under-matching would
// drop a prompt, so ties go to skipping.
function hitsOnce(command, patterns) {
  const present = new Set(tokens(command));
  const haystack = squash(command);
  return patterns.some((raw) => {
    const body = String(raw).replace(/:\*$/, '');
    const wordsHit = tokens(body).every((word) => present.has(word));
    if (!body.includes('*')) return wordsHit;
    return wordsHit || body.split('*').map(squash).filter(Boolean).every((piece) => haystack.includes(piece));
  });
}

// Default PowerShell aliases. Claude Code canonicalizes these before matching a PowerShell rule, so a rule on
// `Remove-Item` also covers `rm`. The test runs on the original text and again with every alias spelled as its
// cmdlet on both sides, so an alias can neither hide a match nor remove one that was there.
const POWERSHELL_ALIASES = {
  'remove-item': ['rm', 'del', 'ri', 'erase', 'rd', 'rmdir'],
  'get-childitem': ['gci', 'ls', 'dir'],
  'get-content': ['gc', 'cat', 'type'],
  'set-content': ['sc'],
  'add-content': ['ac'],
  'clear-content': ['clc'],
  'copy-item': ['cp', 'copy', 'cpi'],
  'move-item': ['mv', 'move', 'mi'],
  'rename-item': ['rni', 'ren'],
  'new-item': ['ni'],
  'set-location': ['sl', 'cd', 'chdir'],
  'invoke-expression': ['iex'],
  'invoke-webrequest': ['iwr', 'curl', 'wget'],
  'invoke-restmethod': ['irm'],
  'select-string': ['sls'],
  'get-process': ['gps', 'ps'],
  'stop-process': ['spps', 'kill'],
  'start-process': ['saps', 'start'],
};
const ALIAS_TO_CMDLET = new Map(Object.entries(POWERSHELL_ALIASES).flatMap(([cmdlet, aliases]) => aliases.map((alias) => [alias, cmdlet])));
const ALIAS_WORD = new RegExp(`(?<![\\w-])(${[...ALIAS_TO_CMDLET.keys()].join('|')})(?![\\w-])`, 'gi');
const spellCmdlets = (text) => String(text).replace(ALIAS_WORD, (word) => ALIAS_TO_CMDLET.get(word.toLowerCase()));

export function commandHitsRule(command, patterns) {
  if (hitsOnce(command, patterns)) return true;
  const expandedCommand = spellCmdlets(command);
  const expandedPatterns = patterns.map(spellCmdlets);
  return hitsOnce(expandedCommand, expandedPatterns);
}

// The shim rewrites commands. It never grants authorization and never lets RTK add fields. RTK adds
// permissionDecision "allow" when its own reading of your allow rules matches, and a rewrite could carry other fields
// (a sandbox override, a decision nested in updatedInput). So the output is rebuilt from scratch: Claude Code's original
// tool input with only `command` replaced by RTK's rewrite, plus RTK's reason text. Output that is not valid is dropped.
export function sanitizeHookOutput(stdout, toolInput) {
  let parsed;
  try {
    parsed = JSON.parse(stdout);
  } catch {
    return '';
  }
  const out = parsed?.hookSpecificOutput;
  const command = out?.updatedInput?.command;
  if (typeof command !== 'string' || !command || typeof toolInput !== 'object' || toolInput === null) return '';
  return JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecisionReason: typeof out.permissionDecisionReason === 'string' ? out.permissionDecisionReason : 'Neutron rewrite',
      updatedInput: { ...toolInput, command },
    },
  });
}

// `cwd` comes from the hook input. The `cwd` option exists for tests only; without either, nothing is rewritten, because
// project settings cannot be located.
export function run(stdin, env = process.env, { home = homedir(), cwd, managed = managedSettingsFiles(process.platform, env), stopAt } = {}) {
  const pass = { stdout: '', status: 0 };
  let input;
  try {
    input = JSON.parse(stdin);
  } catch {
    return pass;
  }
  const command = input?.tool_input?.command;
  if (typeof command !== 'string') return pass;
  const workingDir = typeof input.cwd === 'string' && input.cwd ? input.cwd : cwd;
  if (!workingDir) return pass;
  const policy = loadGuardRules({ home, cwd: workingDir, env, managed, stopAt });
  if (policy.unreadable || commandHitsRule(command, policy.patterns)) return pass;
  const rtk = resolveRtk(env);
  if (!rtk) return pass;
  const res = spawnSync(rtk.command, ['hook', 'claude'], { input: stdin, encoding: 'utf8', timeout: 5000 });
  if (res.error || res.status !== 0) return pass;
  return { stdout: sanitizeHookOutput(res.stdout, input.tool_input), status: 0 };
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
