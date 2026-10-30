#!/usr/bin/env node
// daily.mjs: one row per UTC day of what Claude Code sessions actually cost, read from local transcripts.
//   node neutron.mjs daily [--days 14] [--projects dir] [--out dir] [--heartbeat path] [--json] [--dry-run]
// Turn-0 is the billed input (uncached + cache write + cache read) of a session's first API call: the fixed
// prefix every session pays before doing any work. Interactive means entrypoint claude-desktop or cli; sdk-*
// runs (headless workers, routines) are counted apart because their prefix is much smaller and hides the trend.
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createReadStream, existsSync, mkdirSync, readFileSync, readdirSync, renameSync, statSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { createInterface } from 'node:readline';

const DAY_MS = 86_400_000;
const INTERACTIVE = new Set(['claude-desktop', 'cli']);

export function median(values) {
  if (values.length === 0) return null;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : Math.round((s[mid - 1] + s[mid]) / 2);
}

export function percentile(values, p) {
  if (values.length === 0) return null;
  const s = [...values].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.ceil((p / 100) * s.length) - 1)];
}

// Reads one transcript. A streamed reply is written as several lines sharing one message id with the same usage,
// so usage is counted once per id; counting lines would multiply every total. Each call keeps its own timestamp:
// a session that runs past midnight bills the next day, so usage is bucketed per call, Turn-0 per session start.
const count = (v) => (Number.isFinite(v) && v >= 0 ? v : 0);
const validTs = (v) => typeof v === 'string' && !Number.isNaN(Date.parse(v));
// Measurement probes (neutron floor) are not work sessions. 'Reply' alone is the shell-split form of the probe
// from the first floor runs on 2026-10-30, which also inherited the desktop entrypoint from their parent.
export const PROBE_PROMPTS = new Set(['Reply with the single word ok.', 'Reply']);
const userText = (m) => typeof m?.content === 'string' ? m.content : Array.isArray(m?.content) ? m.content.find(c => c?.type === 'text')?.text ?? null : null;

export async function readSession(file) {
  const rl = createInterface({ input: createReadStream(file), crlfDelay: Infinity });
  const seen = new Set();
  const s = { entrypoint: null, start: null, turn0: null, model: null, sidechain: false, firstPrompt: undefined, calls: [] };
  for await (const line of rl) {
    let j;
    try { j = JSON.parse(line); } catch { continue; }
    if (!j || typeof j !== 'object') continue;
    if (j.isSidechain) s.sidechain = true;
    if (!s.entrypoint && typeof j.entrypoint === 'string') s.entrypoint = j.entrypoint;
    if (s.firstPrompt === undefined && j.type === 'user' && !j.isMeta) s.firstPrompt = userText(j.message);
    const u = j.message?.usage;
    if (j.type !== 'assistant' || !u || typeof u !== 'object' || !validTs(j.timestamp)) continue;
    const id = j.message.id ?? j.uuid;
    if (seen.has(id)) continue;
    seen.add(id);
    const call = { ts: j.timestamp, uncached: count(u.input_tokens), cacheWrite: count(u.cache_creation_input_tokens), cacheRead: count(u.cache_read_input_tokens), output: count(u.output_tokens) };
    if (s.turn0 === null) {
      s.turn0 = call.uncached + call.cacheWrite + call.cacheRead;
      s.start = call.ts;
      s.model = j.message.model ?? null;
    }
    s.calls.push(call);
  }
  return s;
}

// Top-level transcripts only: subagent transcripts sit in <session>/subagents/ and are billed inside their parent.
// A session is kept when any of its calls falls in the window, even if it started before it.
export async function collectSessions(projectsDir, sinceMs) {
  const sessions = [];
  if (!existsSync(projectsDir)) return sessions;
  for (const proj of readdirSync(projectsDir)) {
    const dir = join(projectsDir, proj);
    if (!statSync(dir).isDirectory()) continue;
    for (const f of readdirSync(dir)) {
      if (!f.endsWith('.jsonl')) continue;
      const file = join(dir, f);
      if (statSync(file).mtimeMs < sinceMs) continue;
      const s = await readSession(file);
      if (s.turn0 === null || s.sidechain || PROBE_PROMPTS.has(s.firstPrompt?.trim()) || !s.calls.some(c => Date.parse(c.ts) >= sinceMs)) continue;
      sessions.push(s);
    }
  }
  return sessions;
}

// One row per UTC day from sinceMs: session counts and Turn-0 on the day a session started, usage totals on the day
// each call was made. Days before sinceMs are dropped; they are outside the window being recomputed.
export function aggregate(sessions, sinceMs = 0) {
  const days = new Map();
  const day = (d) => {
    if (!days.has(d)) days.set(d, { starts: [], uncachedInput: 0, cacheWrite: 0, cacheRead: 0, output: 0 });
    return days.get(d);
  };
  for (const s of sessions) {
    if (Date.parse(s.start) >= sinceMs) day(s.start.slice(0, 10)).starts.push(s);
    for (const c of s.calls) {
      if (Date.parse(c.ts) < sinceMs) continue;
      const d = day(c.ts.slice(0, 10));
      d.uncachedInput += c.uncached; d.cacheWrite += c.cacheWrite; d.cacheRead += c.cacheRead; d.output += c.output;
    }
  }
  return [...days.keys()].sort().map(date => {
    const { starts: all, ...totals } = days.get(date);
    const inter = all.filter(s => INTERACTIVE.has(s.entrypoint));
    return {
      date,
      sessions: all.length,
      interactive: inter.length,
      headless: all.length - inter.length,
      turn0Median: median(inter.map(s => s.turn0)),
      turn0P90: percentile(inter.map(s => s.turn0), 90),
      headlessTurn0Median: median(all.filter(s => !INTERACTIVE.has(s.entrypoint)).map(s => s.turn0)),
      callsMedian: median(inter.map(s => s.calls.length)),
      // Desktop and CLI load different prefixes (about 240k against 110-150k on 2026-10-30), so a day's mix of
      // the two moves the interactive median more than any instruction change does. The trend reads desktop.
      byEntrypoint: Object.fromEntries([...INTERACTIVE].map(e => {
        const t0 = inter.filter(s => s.entrypoint === e).map(s => s.turn0);
        return [e, { sessions: t0.length, turn0Median: median(t0) }];
      })),
      ...totals,
    };
  });
}

async function rtkDaily() {
  const { resolveRtk } = await import('./neutron.mjs');
  const rtk = resolveRtk();
  if (!rtk) return null;
  const r = spawnSync(rtk.command, ['gain', '--daily', '--format', 'json'], { encoding: 'utf8', timeout: 30_000 });
  if (r.status !== 0) return null;
  try {
    return new Map(JSON.parse(r.stdout).daily.map(d => [d.date, { commands: d.commands, savedTokens: d.saved_tokens }]));
  } catch { return null; }
}

function fileFact(path) {
  if (!existsSync(path)) return null;
  const buf = readFileSync(path);
  return { bytes: buf.length, sha: createHash('sha256').update(buf).digest('hex').slice(0, 12) };
}

// What the always-loaded prefix and the eval estate look like today. Recorded on today's row only: a snapshot
// cannot be backfilled, so older rows keep the values that were true when they were written.
export function snapshot(home) {
  const claude = join(home, '.claude');
  const skillsDir = join(claude, 'skills');
  let skills = 0, withEvals = 0;
  if (existsSync(skillsDir)) {
    for (const name of readdirSync(skillsDir)) {
      const dir = join(skillsDir, name);
      if (!existsSync(join(dir, 'SKILL.md'))) continue;
      skills++;
      if (existsSync(join(dir, 'evals'))) withEvals++;
    }
  }
  return {
    nucleus: fileFact(join(claude, 'CLAUDE.md')),
    nucleusOnDemand: fileFact(join(claude, 'NUCLEUS-ON-DEMAND.md')),
    skills,
    skillsWithEvalSuite: withEvals,
  };
}

// Every date inside the window is replaced, including days that now have no sessions, so a stale count cannot
// survive a recompute. Rows before the window stay as written. Snapshots are never recomputed, and an RTK figure
// already recorded is kept when RTK could not be read this run (rtk === null), never wiped.
export function mergeLedger(existing, fresh, { since, today, snap, rtk }) {
  const rows = new Map(existing.map(r => [r.date, r]));
  const freshByDate = new Map(fresh.map(r => [r.date, r]));
  for (let t = Date.parse(since); t <= Date.parse(today); t += DAY_MS) {
    const date = new Date(t).toISOString().slice(0, 10);
    const old = rows.get(date);
    const row = freshByDate.get(date) ?? { date, sessions: 0, interactive: 0, headless: 0, uncachedInput: 0, cacheWrite: 0, cacheRead: 0, output: 0 };
    const rtkRow = rtk === null ? old?.rtk : rtk.get(date);
    rows.set(date, { ...row, ...(rtkRow ? { rtk: rtkRow } : {}), snapshot: date === today ? snap : old?.snapshot ?? null });
  }
  return [...rows.values()].sort((a, b) => a.date.localeCompare(b.date));
}

const desktop = (r) => r.byEntrypoint?.['claude-desktop']?.turn0Median ?? null;

export function trend(rows, today) {
  const t = Date.parse(today);
  const window = (from, to) => rows.filter(r => { const d = Date.parse(r.date); return d > t - from * DAY_MS && d <= t - to * DAY_MS && desktop(r); });
  const avg = (rs) => rs.length ? Math.round(rs.reduce((a, r) => a + desktop(r), 0) / rs.length) : null;
  const last = avg(window(7, 0)), prior = avg(window(14, 7));
  return { last7: last, prior7: prior, changePct: last && prior ? Math.round(((last - prior) / prior) * 1000) / 10 : null };
}

const k = (n) => n === null || n === undefined ? '-' : n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${Math.round(n / 1e3)}k` : String(n);

export function formatDigest(rows, tr, days, today) {
  const recent = rows.slice(-days);
  const snap = rows.find(r => r.date === today)?.snapshot;
  const lines = [
    `# Neutron daily: ${today}`,
    '',
    'Generated by `neutron.mjs daily` from local Claude Code transcripts (UTC days). Turn-0 = billed input of a session\'s first call.',
    '',
    `Desktop Turn-0, mean of daily medians: last 7 days ${k(tr.last7)}, prior 7 days ${k(tr.prior7)}` + (tr.changePct === null ? '.' : ` (${tr.changePct > 0 ? '+' : ''}${tr.changePct}%).`),
    '',
  ];
  if (snap) {
    lines.push(`Nucleus CLAUDE.md: ${snap.nucleus ? `${snap.nucleus.bytes} B (sha ${snap.nucleus.sha})` : 'missing'}. Skills: ${snap.skills}, with an evals/ suite: ${snap.skillsWithEvalSuite}.`, '');
  }
  lines.push('| Day | Desktop n | Desktop Turn-0 | CLI n | CLI Turn-0 | Headless | Cache read | Output | RTK saved |', '|---|---|---|---|---|---|---|---|---|');
  for (const r of recent) {
    const e = r.byEntrypoint ?? {};
    lines.push(`| ${r.date} | ${e['claude-desktop']?.sessions ?? 0} | ${k(e['claude-desktop']?.turn0Median)} | ${e.cli?.sessions ?? 0} | ${k(e.cli?.turn0Median)} | ${r.headless} | ${k(r.cacheRead)} | ${k(r.output)} | ${k(r.rtk?.savedTokens)} |`);
  }
  return lines.join('\n') + '\n';
}

function writeAtomic(path, text) {
  mkdirSync(dirname(path), { recursive: true });
  const tmp = `${path}.tmp`;
  writeFileSync(tmp, text);
  renameSync(tmp, path);
}

function flag(flags, name, fallback) {
  const i = flags.indexOf(name);
  return i >= 0 && flags[i + 1] ? flags[i + 1] : fallback;
}

export async function dailyMain(flags, { home = homedir(), now = new Date() } = {}) {
  const days = Number(flag(flags, '--days', '14'));
  if (!Number.isInteger(days) || days < 1) { console.error('--days must be a positive integer'); return 2; }
  const projects = flag(flags, '--projects', join(home, '.claude', 'projects'));
  const out = flag(flags, '--out', join(home, '.starlight', 'neutron'));
  const heartbeat = flag(flags, '--heartbeat', null);
  const today = now.toISOString().slice(0, 10);
  const since = Date.parse(today) - (days - 1) * DAY_MS;

  const sessions = await collectSessions(projects, since);
  const fresh = aggregate(sessions, since);
  const rtk = await rtkDaily();

  const ledgerPath = join(out, 'daily.jsonl');
  const existing = existsSync(ledgerPath) ? readFileSync(ledgerPath, 'utf8').split('\n').filter(Boolean).map(l => JSON.parse(l)) : [];
  const rows = mergeLedger(existing, fresh, { since: new Date(since).toISOString().slice(0, 10), today, snap: snapshot(home), rtk });
  const tr = trend(rows, today);
  const digest = formatDigest(rows, tr, days, today);

  if (flags.includes('--json')) console.log(JSON.stringify({ today, trend: tr, rows: rows.slice(-days) }, null, 2));
  else process.stdout.write(digest);
  if (flags.includes('--dry-run')) return 0;

  writeAtomic(ledgerPath, rows.map(r => JSON.stringify(r)).join('\n') + '\n');
  writeAtomic(join(out, 'DAILY.md'), digest);
  // The heartbeat is derived from the artifact: a day with zero sessions read is reported, not called green.
  const todayRow = rows.find(r => r.date === today);
  if (heartbeat) {
    writeAtomic(heartbeat, JSON.stringify({ ts: now.toISOString(), source: 'neutron-daily', status: sessions.length ? 'ok' : 'no-sessions', sessions: sessions.length, rtk: rtk === null ? 'unavailable' : 'ok', todaySessions: todayRow.sessions, ledger: ledgerPath }) + '\n');
  }
  return 0;
}
