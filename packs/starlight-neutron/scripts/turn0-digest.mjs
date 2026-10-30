#!/usr/bin/env node
// turn0-digest.mjs: one JSONL row per day of measured token facts, so a context change
// (Nucleus, memory cuts, MCP pruning) is judged on numbers instead of on how it felt.
//   node turn0-digest.mjs [--starlight <root>] [--projects <dir>] [--days 14] [--refresh-foundry] [--dry-run] [--json]
//
// Turn-0 = billed input of the first assistant message in a transcript (what a fresh session
// costs before any work). Sidechains (subagents) are skipped; sessions are split by the
// `entrypoint` field because headless SDK runs start at ~10-25k and drown the interactive
// median (~240k) if they are mixed in.
import { spawnSync } from 'node:child_process';
import { createReadStream, existsSync, mkdirSync, readFileSync, readdirSync, renameSync, statSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { createInterface } from 'node:readline';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const SOURCE = 'token-digest';
export const MARK_START = '<!-- token-digest:start -->';
export const MARK_END = '<!-- token-digest:end -->';
// Files whose size is the always-loaded instruction cost. Measured in bytes; tokens are bytes/4.
export const INSTRUCTION_FILES = (home, starlight) => [
  { label: '~/.claude/CLAUDE.md', path: join(home, '.claude', 'CLAUDE.md') },
  { label: '~/.claude/NUCLEUS-ON-DEMAND.md', path: join(home, '.claude', 'NUCLEUS-ON-DEMAND.md') },
  { label: 'starlight/AGENTS.md', path: join(starlight, 'AGENTS.md') },
  { label: 'starlight/repos/CLAUDE.md', path: join(starlight, 'repos', 'CLAUDE.md') },
  { label: 'memory/MEMORY.md', path: join(home, '.claude', 'projects', 'C--Users-frank-starlight-repos', 'memory', 'MEMORY.md') },
];

export function classifyEntrypoint(entrypoint) {
  if (!entrypoint) return 'unknown';
  if (entrypoint === 'claude-desktop' || entrypoint === 'cli') return 'interactive';
  if (entrypoint.startsWith('sdk')) return 'headless';
  return 'unknown';
}

export function median(values) {
  const s = values.filter((v) => Number.isFinite(v)).sort((a, b) => a - b);
  if (!s.length) return null;
  return s[Math.floor(s.length / 2)];
}

// Reads one transcript; returns null when it holds no assistant usage or is a sidechain.
export async function readSession(file) {
  const rl = createInterface({ input: createReadStream(file) });
  let first = null, day = null, entrypoint = null, calls = 0, input = 0, output = 0;
  for await (const line of rl) {
    let j;
    try { j = JSON.parse(line); } catch { continue; }
    if (j.isSidechain === true) { rl.close(); return null; }
    if (!entrypoint && j.entrypoint) entrypoint = j.entrypoint;
    const u = j.message?.usage;
    if (j.type !== 'assistant' || !u) continue;
    const billed = (u.input_tokens || 0) + (u.cache_creation_input_tokens || 0) + (u.cache_read_input_tokens || 0);
    // An aborted first call can log all-zero usage; Turn-0 is the first call that was billed.
    if (first === null && billed > 0) { first = billed; day = String(j.timestamp || '').slice(0, 10); }
    calls += 1;
    input += billed;
    output += u.output_tokens || 0;
  }
  if (first === null || !day) return null;
  return { file: basename(file), day, kind: classifyEntrypoint(entrypoint), entrypoint, turn0: first, calls, input, output };
}

// Top-level *.jsonl under each project dir only: subagent transcripts live one level deeper.
export async function scanTranscripts(projectsRoot, { sinceMs }) {
  const sessions = [];
  if (!existsSync(projectsRoot)) return sessions;
  for (const proj of readdirSync(projectsRoot)) {
    const dir = join(projectsRoot, proj);
    let st;
    try { st = statSync(dir); } catch { continue; }
    if (!st.isDirectory()) continue;
    for (const f of readdirSync(dir)) {
      if (!f.endsWith('.jsonl')) continue;
      const p = join(dir, f);
      const fst = statSync(p);
      if (fst.mtimeMs < sinceMs || fst.size < 2000) continue;
      const s = await readSession(p);
      // mtime is only a cheap pre-filter: a July session reopened yesterday must not land in this window.
      if (s && Date.parse(s.day) >= sinceMs) sessions.push({ ...s, project: proj });
    }
  }
  return sessions;
}

function bucket(rows) {
  if (!rows.length) return { n: 0, turn0Median: null, callsMedian: null, inputPerCallMedian: null, inputTotal: 0, outputTotal: 0 };
  return {
    n: rows.length,
    turn0Median: median(rows.map((r) => r.turn0)),
    callsMedian: median(rows.map((r) => r.calls)),
    inputPerCallMedian: median(rows.map((r) => Math.round(r.input / r.calls))),
    inputTotal: rows.reduce((a, r) => a + r.input, 0),
    outputTotal: rows.reduce((a, r) => a + r.output, 0),
  };
}

export function summarize(sessions) {
  const days = {};
  for (const s of sessions) (days[s.day] ??= []).push(s);
  const perDay = Object.keys(days).sort().map((day) => ({
    day,
    interactive: bucket(days[day].filter((s) => s.kind === 'interactive')),
    headless: bucket(days[day].filter((s) => s.kind === 'headless')),
    unknown: bucket(days[day].filter((s) => s.kind === 'unknown')),
  }));
  return {
    sessions: sessions.length,
    interactive: bucket(sessions.filter((s) => s.kind === 'interactive')),
    headless: bucket(sessions.filter((s) => s.kind === 'headless')),
    unknown: bucket(sessions.filter((s) => s.kind === 'unknown')),
    perDay,
  };
}

// `rtk gain` has no --json; the two header lines are stable across 0.50.x.
export function parseRtkGain(text) {
  const cmds = /Total commands:\s+([\d,]+)/.exec(text);
  const saved = /Tokens saved:\s+([\d.]+)([KMG]?)\s+\(([\d.]+)%\)/.exec(text);
  if (!cmds || !saved) return null;
  const mult = { '': 1, K: 1e3, M: 1e6, G: 1e9 }[saved[2]];
  return { commands: Number(cmds[1].replace(/,/g, '')), tokensSaved: Math.round(Number(saved[1]) * mult), savedPercent: Number(saved[3]), estimate: 'bytes/4' };
}

export function rtkGain() {
  const res = spawnSync('rtk', ['gain'], { encoding: 'utf8', shell: process.platform === 'win32' });
  if (res.error || res.status !== 0) return null;
  return parseRtkGain(res.stdout || '');
}

// The foundry graph is the one place eval coverage is counted. Reading its last output is cheap;
// regenerating it rescans every transcript, so that is opt-in.
export function skillEvals(home, { refresh, foundry } = {}) {
  const graphPath = join(home, '.claude', 'skill-foundry', 'estate-skills.graph.json');
  if (refresh && foundry && existsSync(foundry)) spawnSync(process.execPath, [foundry, 'graph'], { encoding: 'utf8', timeout: 300_000 });
  if (!existsSync(graphPath)) return null;
  const g = JSON.parse(readFileSync(graphPath, 'utf8'));
  const brands = Object.values(g.byBrand || {});
  const sum = (k) => brands.reduce((a, b) => a + (b[k] || 0), 0);
  return { generatedAt: g.generatedAt || null, skills: sum('skills'), used: sum('used'), withEvals: sum('withEvals') };
}

export function instructionBytes(files) {
  const rows = files.map(({ label, path }) => ({ label, bytes: existsSync(path) ? statSync(path).size : null }));
  const total = rows.reduce((a, r) => a + (r.bytes || 0), 0);
  return { files: rows, totalBytes: total, estTokens: Math.round(total / 4) };
}

const fmt = (n) => (n === null || n === undefined ? '-' : Number(n).toLocaleString('en-US'));

export function renderMarkdown(row, history) {
  const lines = [
    '# Token digest',
    '',
    `Generated ${row.ts} by \`packs/starlight-neutron/scripts/turn0-digest.mjs\`. Do not hand-edit between the markers; re-run the script.`,
    '',
    MARK_START,
    `## Window: last ${row.windowDays} days (${row.sessions.sessions} sessions, sidechains excluded)`,
    '',
    '| Bucket | Sessions | Turn-0 median | Calls median | Input/call median |',
    '|---|---|---|---|---|',
  ];
  for (const k of ['interactive', 'headless', 'unknown']) {
    const b = row.sessions[k];
    lines.push(`| ${k} | ${b.n} | ${fmt(b.turn0Median)} | ${fmt(b.callsMedian)} | ${fmt(b.inputPerCallMedian)} |`);
  }
  lines.push('', '## Always-loaded instruction files', '', '| File | Bytes |', '|---|---|');
  for (const f of row.instructions.files) lines.push(`| ${f.label} | ${fmt(f.bytes)} |`);
  lines.push(`| **total** | **${fmt(row.instructions.totalBytes)}** (~${fmt(row.instructions.estTokens)} tokens at bytes/4) |`);
  lines.push('', '## RTK', '');
  lines.push(row.rtk ? `${fmt(row.rtk.commands)} commands, ${fmt(row.rtk.tokensSaved)} tokens saved (${row.rtk.savedPercent}%, ${row.rtk.estimate} estimate).` : 'rtk not on PATH or `rtk gain` failed.');
  lines.push('', '## Skill evals', '');
  lines.push(row.skillEvals ? `${row.skillEvals.withEvals} of ${row.skillEvals.skills} skills carry an eval (${row.skillEvals.used} used; graph generated ${row.skillEvals.generatedAt}).` : 'No foundry graph found; run `foundry.mjs graph` or pass --refresh-foundry.');
  lines.push('', '## Interactive Turn-0 median per day', '', '| Day | n | Turn-0 median | Headless n | Headless Turn-0 |', '|---|---|---|---|---|');
  for (const d of row.sessions.perDay) lines.push(`| ${d.day} | ${d.interactive.n} | ${fmt(d.interactive.turn0Median)} | ${d.headless.n} | ${fmt(d.headless.turn0Median)} |`);
  if (history.length) {
    lines.push('', '## Digest history (one row per run day)', '', '| Date | Interactive Turn-0 | Instruction bytes | RTK saved | Evals |', '|---|---|---|---|---|');
    for (const h of history) lines.push(`| ${h.date} | ${fmt(h.sessions?.interactive?.turn0Median)} | ${fmt(h.instructions?.totalBytes)} | ${fmt(h.rtk?.tokensSaved)} | ${h.skillEvals ? `${h.skillEvals.withEvals}/${h.skillEvals.skills}` : '-'} |`);
  }
  lines.push(MARK_END, '');
  return lines.join('\n');
}

export function writeAtomic(path, text) {
  mkdirSync(dirname(path), { recursive: true });
  const tmp = `${path}.tmp-${process.pid}`;
  writeFileSync(tmp, text);
  renameSync(tmp, path);
}

// One row per date: a re-run on the same day replaces that day's row instead of stacking.
export function upsertRow(file, row) {
  const rows = existsSync(file)
    ? readFileSync(file, 'utf8').split(/\r?\n/).filter(Boolean).map((l) => JSON.parse(l)).filter((r) => r.date !== row.date)
    : [];
  rows.push(row);
  writeAtomic(file, `${rows.map((r) => JSON.stringify(r)).join('\n')}\n`);
  return rows;
}

function flag(argv, name, fallback) {
  const i = argv.indexOf(`--${name}`);
  return i === -1 ? fallback : argv[i + 1];
}

export async function main(argv = process.argv.slice(2)) {
  const home = homedir();
  const starlight = resolve(flag(argv, 'starlight', join(home, 'starlight')));
  const projects = resolve(flag(argv, 'projects', join(home, '.claude', 'projects')));
  const windowDays = Number(flag(argv, 'days', 14));
  const dryRun = argv.includes('--dry-run');
  const now = new Date();
  const sinceMs = now.getTime() - windowDays * 86_400_000;

  const sessions = summarize(await scanTranscripts(projects, { sinceMs }));
  const row = {
    date: now.toISOString().slice(0, 10),
    ts: now.toISOString(),
    windowDays,
    sessions,
    instructions: instructionBytes(INSTRUCTION_FILES(home, starlight)),
    rtk: rtkGain(),
    skillEvals: skillEvals(home, { refresh: argv.includes('--refresh-foundry'), foundry: join(starlight, 'repos', 'claude-code-config', 'scripts', 'skill-foundry', 'foundry.mjs') }),
  };
  // Zero sessions means the transcript root moved or the filter broke; the heartbeat must say so.
  const status = sessions.sessions > 0 ? 'ok' : 'fail';

  if (argv.includes('--json')) console.log(JSON.stringify(row, null, 2));
  if (dryRun) {
    if (!argv.includes('--json')) console.log(renderMarkdown(row, []));
    return { row, status };
  }
  const ledger = join(starlight, 'logs', 'token-digest.jsonl');
  const history = upsertRow(ledger, row);
  const md = join(starlight, 'logs', 'digests', 'token-digest.md');
  writeAtomic(md, renderMarkdown(row, history));
  writeAtomic(join(starlight, 'logs', 'heartbeats', `heartbeat-${SOURCE}.json`), `${JSON.stringify({
    ts: row.ts, source: SOURCE, status, detail: `${sessions.sessions} sessions; interactive Turn-0 median ${sessions.interactive.turn0Median ?? 'n/a'}`, staleAfterMs: 2 * 86_400_000,
  }, null, 2)}\n`);
  if (!argv.includes('--json')) console.log(`${status}: ${sessions.sessions} sessions, interactive Turn-0 median ${fmt(sessions.interactive.turn0Median)}, wrote ${ledger} and ${md}`);
  return { row, status };
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  main().then(({ status }) => process.exit(status === 'ok' ? 0 : 1)).catch((e) => { console.error(e.message); process.exit(1); });
}

export const HERE = dirname(fileURLToPath(import.meta.url));
