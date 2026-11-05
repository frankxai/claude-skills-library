#!/usr/bin/env node
// Says what the team can and cannot do in this environment before any command
// relies on it. Exit 1 when no second provider exists, because then no score
// produced here can count as independent.
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

export const SECOND_PROVIDERS = ['codex', 'gemini', 'agy'];

function onPath(cmd) {
  const finder = process.platform === 'win32' ? 'where' : 'which';
  try {
    execFileSync(finder, [cmd], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function ghAuthed() {
  try {
    execFileSync('gh', ['auth', 'status'], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

export function readConfig(cwd) {
  const file = join(cwd, '.studio', 'config.json');
  if (!existsSync(file)) return null;
  try {
    return JSON.parse(readFileSync(file, 'utf8'));
  } catch {
    return { invalid: true };
  }
}

export function summarize({ providers, gh, prGate, config, envRulings }) {
  const missing = [];
  if (!providers.length) missing.push('no second provider on PATH (codex, gemini or agy): scores cannot be independent');
  if (!gh) missing.push('gh is not signed in: /ship and /harvest cannot read GitHub');
  if (!prGate) missing.push('tools/pr-gate.mjs not found: /ship stops at "ready for human merge"');
  if (config && config.invalid) missing.push('.studio/config.json is not valid JSON');
  if (!envRulings && !(config && config.rulingsSource)) missing.push('no rulings source: /today treats every pending decision as not approved');
  return missing;
}

function main() {
  const cwd = process.cwd();
  const report = {
    providers: SECOND_PROVIDERS.filter(onPath),
    gh: ghAuthed(),
    prGate: existsSync(join(cwd, 'tools', 'pr-gate.mjs')),
    config: readConfig(cwd),
    envRulings: Boolean(process.env.STUDIO_RULINGS_URL),
  };
  const missing = summarize(report);
  const notes = report.providers.length
    ? [`found on PATH, not verified signed in: ${report.providers.join(', ')}; the critic confirms one answers before scoring`]
    : [];
  console.log(JSON.stringify({ ...report, missing, notes }, null, 2));
  return report.providers.length ? 0 : 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = main();
}
