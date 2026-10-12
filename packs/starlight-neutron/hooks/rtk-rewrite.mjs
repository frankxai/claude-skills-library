#!/usr/bin/env node
// PreToolUse hook: hand a Bash tool call to `rtk hook claude`, which rewrites it to a filtered form.
// Fails open: no rtk, a crash or a timeout leaves the command untouched and exits 0.
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { resolveRtk } from '../scripts/neutron.mjs';

export function run(stdin, env = process.env) {
  const rtk = resolveRtk(env);
  if (!rtk) return { stdout: '', status: 0 };
  const res = spawnSync(rtk.command, ['hook', 'claude'], { input: stdin, encoding: 'utf8', timeout: 5000 });
  if (res.error || res.status !== 0) return { stdout: '', status: 0 };
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
