#!/usr/bin/env node
// install.mjs: copy the thrift skills into a repo's .claude/skills, or into ~/.claude/skills with --user.
//   node install.mjs <repo-path>            dry run, prints the plan
//   node install.mjs <repo-path> --apply    copy
//   node install.mjs --user [--apply]       target ~/.claude/skills
// It never edits settings.json and never installs RTK, headroom or caveman. It prints those commands.
import { cpSync, existsSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const PACK_DIR = dirname(fileURLToPath(import.meta.url));

export function planInstall(targetRoot, packDir = PACK_DIR) {
  const skillsSrc = join(packDir, 'skills');
  const skillsDst = join(targetRoot, '.claude', 'skills');
  return readdirSync(skillsSrc)
    .filter((name) => statSync(join(skillsSrc, name)).isDirectory())
    .map((name) => ({ name, from: join(skillsSrc, name), to: join(skillsDst, name), exists: existsSync(join(skillsDst, name)) }));
}

export function applyPlan(plan) {
  for (const step of plan) {
    mkdirSync(dirname(step.to), { recursive: true });
    cpSync(step.from, step.to, { recursive: true });
  }
}

const NEXT_STEPS = `
Next, install the compressors you want (this script does not):
  rtk       winget install rtk-ai.rtk     then: rtk init -g    (edits your Claude Code hooks)
  headroom  uv tool install --python 3.13 "headroom-ai[all]"
  ccusage   npm install -g ccusage
  caveman   /plugin marketplace add JuliusBrussee/caveman   (optional terse profile)
Check what is wired:  node packs/starlight-thrift/scripts/thrift.mjs doctor
Measure before you trust a number:  see skills/thrift-ledger/SKILL.md`;

function main(argv) {
  const apply = argv.includes('--apply');
  const user = argv.includes('--user');
  const positional = argv.filter((a) => !a.startsWith('--'));
  if (!user && positional.length !== 1) {
    console.error('usage: install.mjs <repo-path> [--apply] | install.mjs --user [--apply]');
    return 2;
  }
  const targetRoot = user ? homedir() : resolve(positional[0]);
  if (!existsSync(targetRoot)) {
    console.error(`target not found: ${targetRoot}`);
    return 2;
  }
  const plan = planInstall(targetRoot);
  for (const step of plan) console.log(`${apply ? 'copy ' : 'would copy '}${step.name} -> ${step.to}${step.exists ? ' (replaces existing)' : ''}`);
  if (apply) applyPlan(plan);
  else console.log('\ndry run, nothing written. Re-run with --apply.');
  console.log(NEXT_STEPS);
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exit(main(process.argv.slice(2)));
}
