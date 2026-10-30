#!/usr/bin/env node
// install.mjs: copy the neutron skills, scripts and RTK hook shim into a repo's .claude, or into ~/.claude with --user.
//   node install.mjs <repo-path>            dry run, prints the plan
//   node install.mjs <repo-path> --apply    copy
//   node install.mjs --user [--apply]       target ~/.claude
// Skills go to .claude/skills/<name>, scripts to .claude/neutron/scripts, the hook shim to .claude/neutron/hooks.
// An existing copy is moved to .claude/neutron/backup first. It never edits settings.json and never installs RTK,
// headroom or caveman: it prints the one hooks entry to add. As a plugin, hooks/hooks.json wires the same shim.
import { cpSync, existsSync, mkdirSync, readdirSync, renameSync, statSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const PACK_DIR = dirname(fileURLToPath(import.meta.url));

export function planInstall(targetRoot, packDir = PACK_DIR) {
  const claude = join(targetRoot, '.claude');
  const skillsSrc = join(packDir, 'skills');
  const steps = readdirSync(skillsSrc)
    .filter((name) => /^[A-Za-z0-9][A-Za-z0-9_-]*$/.test(name) && statSync(join(skillsSrc, name)).isDirectory())
    .map((name) => ({ name, from: join(skillsSrc, name), to: join(claude, 'skills', name) }));
  steps.push({ name: 'scripts', from: join(packDir, 'scripts'), to: join(claude, 'neutron', 'scripts') });
  // The shim imports ../scripts/neutron.mjs, so hooks/ must sit beside scripts/.
  steps.push({ name: 'hooks', from: join(packDir, 'hooks'), to: join(claude, 'neutron', 'hooks') });
  return steps.map((s) => ({ ...s, exists: existsSync(s.to), backupDir: join(claude, 'neutron', 'backup') }));
}

export function applyPlan(plan, stamp = Date.now()) {
  for (const step of plan) {
    mkdirSync(dirname(step.to), { recursive: true });
    if (step.exists) {
      mkdirSync(step.backupDir, { recursive: true });
      renameSync(step.to, join(step.backupDir, `${step.name}-${stamp}`));
    }
    cpSync(step.from, step.to, { recursive: true });
  }
}

// The settings.json entry that wires the installed shim, printed for the user to add.
export function hookEntry(targetRoot) {
  const shim = join(targetRoot, '.claude', 'neutron', 'hooks', 'rtk-rewrite.mjs').replace(/\\/g, '/');
  return {
    PreToolUse: [{ matcher: 'Bash|PowerShell', hooks: [{ type: 'command', command: `node "${shim}"`, timeout: 10 }] }],
  };
}

const nextSteps = (targetRoot) => `
To enable the RTK rewrite, add this under "hooks" in ${join(targetRoot, '.claude', 'settings.json')}:
${JSON.stringify(hookEntry(targetRoot), null, 2)}

Use this shim, not \`rtk init -g\`. RTK's raw hook returns permissionDecision "allow" whenever its own reading of
your allow list matches, so a compressor decides permissions; it also rewrites commands your ask and deny rules
cover. The shim strips the allow, skips ruled commands, and leaves alone commands the rewrite breaks.

This script does not install the compressors. Pick what you want:
  rtk       winget install rtk-ai.rtk | brew install rtk | cargo install --git https://github.com/rtk-ai/rtk
  headroom  uv tool install --python 3.13 "headroom-ai[all]"     (measure first, see neutron-log)
  ccusage   npm install -g ccusage
  caveman   /plugin marketplace add JuliusBrussee/caveman         (optional terse profile)
Check what is wired:  node .claude/neutron/scripts/neutron.mjs doctor`;

export function main(argv) {
  const apply = argv.includes('--apply');
  const user = argv.includes('--user');
  const positional = argv.filter((a) => !a.startsWith('--'));
  if (user ? positional.length > 0 : positional.length !== 1) {
    console.error('usage: install.mjs <repo-path> [--apply] | install.mjs --user [--apply]   (a path and --user are exclusive)');
    return 2;
  }
  const targetRoot = user ? homedir() : resolve(positional[0]);
  if (!existsSync(targetRoot)) {
    console.error(`target not found: ${targetRoot}`);
    return 2;
  }
  const plan = planInstall(targetRoot);
  for (const step of plan) {
    const verb = apply ? 'copy' : 'would copy';
    console.log(`${verb} ${step.name} -> ${step.to}${step.exists ? ' (existing copy moves to .claude/neutron/backup)' : ''}`);
  }
  if (apply) applyPlan(plan);
  else console.log('\ndry run, nothing written. Re-run with --apply.');
  console.log(nextSteps(targetRoot));
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exit(main(process.argv.slice(2)));
}
