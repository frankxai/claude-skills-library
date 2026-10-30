#!/usr/bin/env node
// floor.mjs: what a session pays before any work, under each config variant, measured on billed usage.
//   node neutron.mjs floor [--cwd dir]... [--variants a,b] [--out file.json] [--json]
// Each variant starts one headless `claude -p` with a trivial prompt and reads the result event's usage.
// Turn-0 = uncached + cache write + cache read input of that first call. Each run costs real usage
// (about $0.20-0.45 at list price on 2026-10-30), so the default is a handful of variants in one folder.
import { spawnSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';

export const VARIANTS = {
  default: [],
  'no-mcp': ['--strict-mcp-config'],
  'no-mcp-no-skills': ['--strict-mcp-config', '--disable-slash-commands'],
  'core-tools': ['--strict-mcp-config', '--disable-slash-commands', '--tools', 'Bash,Read,Edit,Write,Glob,Grep,Agent,ToolSearch'],
};

const PROMPT = 'Reply with the single word ok.';

// Pure: the row for one run, from the stream-json events `claude -p --output-format json` prints.
export function parseRun(stdout) {
  const events = JSON.parse(stdout);
  const res = events.find(e => e.type === 'result');
  if (!res?.usage) throw new Error('no result event with usage');
  const init = events.find(e => e.type === 'system' && e.subtype === 'init') ?? {};
  const u = res.usage;
  const turn0 = (u.input_tokens ?? 0) + (u.cache_creation_input_tokens ?? 0) + (u.cache_read_input_tokens ?? 0);
  // A run that never reached the model (logged out, refused) bills nothing; zero is a failure, not a floor.
  if (turn0 === 0) throw new Error(`no billed input: ${String(res.result ?? '').slice(0, 120)}`);
  return {
    turn0,
    cacheWrite: u.cache_creation_input_tokens ?? 0,
    cacheRead: u.cache_read_input_tokens ?? 0,
    tools: init.tools?.length ?? null,
    mcpServers: init.mcp_servers?.length ?? null,
    agents: init.agents?.length ?? null,
    skills: init.skills?.length ?? null,
    costUsd: res.total_cost_usd ?? null,
  };
}

export function formatFloor(rows) {
  const base = new Map(rows.filter(r => r.variant === 'default' && r.turn0).map(r => [r.cwd, r.turn0]));
  const lines = ['| Folder | Variant | Turn-0 | vs default | Tools | MCP | Skills |', '|---|---|---|---|---|---|---|'];
  for (const r of rows) {
    if (r.error) { lines.push(`| ${r.cwd} | ${r.variant} | failed: ${r.error.slice(0, 60)} | | | | |`); continue; }
    const b = base.get(r.cwd);
    const delta = b && r.variant !== 'default' ? `${r.turn0 - b > 0 ? '+' : ''}${r.turn0 - b}` : '';
    lines.push(`| ${r.cwd} | ${r.variant} | ${r.turn0} | ${delta} | ${r.tools ?? '-'} | ${r.mcpServers ?? '-'} | ${r.skills ?? '-'} |`);
  }
  return lines.join('\n');
}

export async function floorMain(flags, { run = spawnSync } = {}) {
  const cwds = flags.flatMap((f, i) => (f === '--cwd' && flags[i + 1] ? [flags[i + 1]] : []));
  if (cwds.length === 0) cwds.push(process.cwd());
  const vi = flags.indexOf('--variants');
  const names = vi >= 0 ? flags[vi + 1].split(',') : Object.keys(VARIANTS);
  const unknown = names.filter(n => !VARIANTS[n]);
  if (unknown.length) { console.error(`unknown variant: ${unknown.join(', ')}; known: ${Object.keys(VARIANTS).join(', ')}`); return 2; }
  const { findOnPath } = await import('./neutron.mjs');
  const claude = findOnPath('claude');
  if (!claude) { console.error('claude not found on PATH'); return 1; }

  const rows = [];
  for (const cwd of cwds) {
    for (const variant of names) {
      // No shell: the prompt must reach claude as one argument, and a shell would split it on spaces.
      const r = run(claude, ['-p', PROMPT, '--output-format', 'json', ...VARIANTS[variant]], { cwd, encoding: 'utf8', input: '', timeout: 180_000, maxBuffer: 64 << 20 });
      try { rows.push({ cwd, variant, ...parseRun(r.stdout) }); }
      catch (e) { rows.push({ cwd, variant, error: (e.message || String(r.stderr)).replace(/\s+/g, ' ') }); }
    }
  }
  const oi = flags.indexOf('--out');
  if (oi >= 0) writeFileSync(flags[oi + 1], JSON.stringify({ date: new Date().toISOString(), prompt: PROMPT, rows }, null, 2) + '\n');
  console.log(flags.includes('--json') ? JSON.stringify(rows, null, 2) : formatFloor(rows));
  return rows.some(r => r.error) ? 1 : 0;
}
