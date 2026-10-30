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
// so usage is counted once per id; counting lines would multiply every total.
export async function readSession(file) {
  const rl = createInterface({ input: createReadStream(file), crlfDelay: Infinity });
  const seen = new Set();
  const s = { entrypoint: null, start: null, turn0: null, calls: 0, uncached: 0, cacheWrite: 0, cacheRead: 0, output: 0, model: null, sidechain: false };
  for await (const line of rl) {
    let j;
    try { j = JSON.parse(line); } catch { continue; }
    if (j.isSidechain) s.sidechain = true;
    if (!s.entrypoint && typeof j.entrypoint === 'string') s.entrypoint = j.entrypoint;
    const u = j.message?.usage;
    if (j.type !== 'assistant' || !u) continue;
    const id = j.message.id ?? j.uuid;
    if (seen.has(id)) continue;
    seen.add(id);
    const uncached = u.input_tokens ?? 0, cacheWrite = u.cache_creation_input_tokens ?? 0, cacheRead = u.cache_read_input_tokens ?? 0;
    if (s.turn0 === null) {
      s.turn0 = uncached + cacheWrite + cacheRead;
      s.start = j.timestamp ?? null;
      s.model = j.message.model ?? null;
    }
    s.calls++;
    s.uncached += uncached;
    s.cacheWrite += cacheWrite;
    s.cacheRead += cacheRead;
    s.output += u.output_tokens ?? 0;
  }
  return s;
}

// Top-level transcripts only: subagent transcripts sit in <session>/subagents/ and are billed inside their parent.
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
      if (s.turn0 === null || s.sidechain || !s.start || Date.parse(s.start) < sinceMs) continue;
      sessions.push(s);
    }
  }
  return sessions;
}

export function aggregate(sessions) {
  const byDay = new Map();
  for (const s of sessions) {
    const day = s.start.slice(0, 10);
    if (!byDay.has(day)) byDay.set(day, []);
    byDay.get(day).push(s);
  }
  return [...byDay.keys()].sort().map(date => {
    const all = byDay.get(date);
    const inter = all.filter(s => INTERACTIVE.has(s.entrypoint));
    const sum = (k) => all.reduce((a, s) => a + s[k], 0);
    return {
      date,
      sessions: all.length,
      interactive: inter.length,
      headless: all.length - inter.length,
      turn0Median: median(inter.map(s => s.turn0)),
      turn0P90: percentile(inter.map(s => s.turn0), 90),
      headlessTurn0Median: median(all.filter(s => !INTERACTIVE.has(s.entrypoint)).map(s => s.turn0)),
      callsMedian: median(inter.map(s => s.calls)),
      // Desktop and CLI load different prefixes (about 240k against 110-150k on 2026-10-30), so a day's mix of
      // the two moves the interactive median more than any instruction change does. The trend reads desktop.
      byEntrypoint: Object.fromEntries([...INTERACTIVE].map(e => {
        const t0 = inter.filter(s => s.entrypoint === e).map(s => s.turn0);
        return [e, { sessions: t0.length, turn0Median: median(t0) }];
      })),
      uncachedInput: sum('uncached'),
      cacheWrite: sum('cacheWrite'),
      cacheRead: sum('cacheRead'),
      output: sum('output'),
    };
  });
}

async function rtkDaily() {
  const { resolveRtk } = await import('./neutron.mjs');
  const rtk = resolveRtk();
  if (!rtk) return new Map();
  const r = spawnSync(rtk.command, ['gain', '--daily', '--format', 'json'], { encoding: 'utf8', timeout: 30_000 });
  if (r.status !== 0) return new Map();
  try {
    return new Map(JSON.parse(r.stdout).daily.map(d => [d.date, { commands: d.commands, savedTokens: d.saved_tokens }]));
  } catch { return new Map(); }
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

// Rows already in the ledger outside the window stay as written; rows inside it are recomputed from transcripts.
export function mergeLedger(existing, fresh, today, snap) {
  const rows = new Map(existing.map(r => [r.date, r]));
  for (const r of fresh) rows.set(r.date, { ...r, snapshot: rows.get(r.date)?.snapshot ?? null });
  if (rows.has(today)) rows.get(today).snapshot = snap;
  else rows.set(today, { date: today, sessions: 0, interactive: 0, headless: 0, snapshot: snap });
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

  const fresh = aggregate(await collectSessions(projects, since));
  const rtk = await rtkDaily();
  for (const r of fresh) if (rtk.has(r.date)) r.rtk = rtk.get(r.date);

  const ledgerPath = join(out, 'daily.jsonl');
  const existing = existsSync(ledgerPath) ? readFileSync(ledgerPath, 'utf8').split('\n').filter(Boolean).map(l => JSON.parse(l)) : [];
  const rows = mergeLedger(existing, fresh, today, snapshot(home));
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
    writeAtomic(heartbeat, JSON.stringify({ ts: now.toISOString(), source: 'neutron-daily', status: fresh.length ? 'ok' : 'no-sessions', days: fresh.length, todaySessions: todayRow.sessions, ledger: ledgerPath }) + '\n');
  }
  return 0;
}
