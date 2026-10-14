#!/usr/bin/env node
// ledger.mjs: a savings claim can only come from measured, quality-checked sessions.
//   node neutron.mjs ledger add --file l.jsonl --date D --harness H --model M --task T --arm A --uncached N --cache-write N --cache-read N --output N --check pass|fail|not-checked [--notes S]
//   node neutron.mjs ledger import-ccusage <session.json> --arm A --harness H [--out l.jsonl]
//   node neutron.mjs ledger compare --baseline a.jsonl --candidate b.jsonl [--prices p.json] [--json]
import { appendFileSync, readFileSync } from 'node:fs';

export const CHECKS = ['pass', 'fail', 'not-checked'];
export const METRICS = ['uncachedInput', 'cacheWrite', 'cacheRead', 'output'];
export const MIN_PAIRS = 5;

const isText = (v) => typeof v === 'string' && v.trim() !== '';
const isCount = (v) => Number.isInteger(v) && v >= 0;

// Returns a list of problems; empty means the row is valid. Token fields may be null (unknown), never negative.
export function validateRow(row) {
  const errors = [];
  if (!row || typeof row !== 'object' || Array.isArray(row)) return ['row must be an object'];
  if (!isText(row.date) || !/^\d{4}-\d{2}-\d{2}/.test(row.date) || Number.isNaN(Date.parse(row.date))) errors.push('date must be an ISO date (YYYY-MM-DD)');
  for (const k of ['harness', 'taskId', 'arm']) if (!isText(row[k])) errors.push(`${k} must be a non-empty string`);
  if (row.model !== null && !isText(row.model)) errors.push('model must be a non-empty string or null');
  for (const k of METRICS) if (row[k] !== null && !isCount(row[k])) errors.push(`${k} must be a non-negative integer or null`);
  if (!CHECKS.includes(row.check)) errors.push(`check must be one of ${CHECKS.join(', ')}`);
  if (row.notes !== null && typeof row.notes !== 'string') errors.push('notes must be a string or null');
  return errors;
}

export function normalizeRow(input) {
  const row = {
    date: input.date,
    harness: input.harness,
    model: input.model ?? null,
    taskId: input.taskId,
    arm: input.arm,
    uncachedInput: input.uncachedInput ?? null,
    cacheWrite: input.cacheWrite ?? null,
    cacheRead: input.cacheRead ?? null,
    output: input.output ?? null,
    check: input.check ?? 'not-checked',
    notes: input.notes ?? null,
  };
  const errors = validateRow(row);
  if (errors.length) throw new Error(`invalid row: ${errors.join('; ')}`);
  return row;
}

export function addRow(file, input) {
  const row = normalizeRow(input);
  appendFileSync(file, `${JSON.stringify(row)}\n`);
  return row;
}

export function readLedger(file) {
  const rows = [];
  readFileSync(file, 'utf8').split(/\r?\n/).forEach((line, i) => {
    if (!line.trim()) return;
    let parsed;
    try {
      parsed = JSON.parse(line);
    } catch {
      throw new Error(`${file}:${i + 1}: not valid JSON`);
    }
    const errors = validateRow(parsed);
    if (errors.length) throw new Error(`${file}:${i + 1}: ${errors.join('; ')}`);
    rows.push(parsed);
  });
  return rows;
}

// ccusage prints { type: 'session', data: [...] } in current releases and { sessions: [...] } in older ones.
// Current: session, firstActivity, lastActivity, models[], inputTokens, outputTokens, cacheCreationTokens, cacheReadTokens.
// Older:   sessionId, lastActivity, modelsUsed[], same token names. Missing fields become null, never a guess.
export function importCcusage(json, { arm, harness, check = 'not-checked' } = {}) {
  const sessions = Array.isArray(json) ? json : (json?.data ?? json?.sessions);
  if (!Array.isArray(sessions)) throw new Error('unrecognised ccusage JSON: expected a "data" or "sessions" array');
  const num = (v) => (Number.isInteger(v) && v >= 0 ? v : null);
  return sessions.map((s, i) => {
    const models = s.models ?? s.modelsUsed;
    const stamp = s.lastActivity ?? s.firstActivity;
    const gaps = [];
    const row = {
      date: typeof stamp === 'string' ? stamp.slice(0, 10) : undefined,
      harness,
      model: Array.isArray(models) && models.length === 1 ? models[0] : null,
      taskId: s.session ?? s.sessionId,
      arm,
      uncachedInput: num(s.inputTokens),
      cacheWrite: num(s.cacheCreationTokens),
      cacheRead: num(s.cacheReadTokens),
      output: num(s.outputTokens),
      check,
    };
    if (row.model === null) gaps.push(Array.isArray(models) && models.length > 1 ? 'model: several models in one session' : 'model: not in ccusage output');
    for (const [k, src] of [['uncachedInput', 'inputTokens'], ['cacheWrite', 'cacheCreationTokens'], ['cacheRead', 'cacheReadTokens'], ['output', 'outputTokens']]) {
      if (row[k] === null) gaps.push(`${k}: ${src} missing`);
    }
    row.notes = `imported from ccusage${gaps.length ? `; null fields: ${gaps.join(', ')}` : ''}`;
    try {
      return normalizeRow(row);
    } catch (e) {
      throw new Error(`ccusage session ${i + 1}: ${e.message}`);
    }
  });
}

export function loadPrices(json) {
  for (const k of METRICS) if (typeof json?.[k] !== 'number' || !(json[k] >= 0)) throw new Error(`prices must give a non-negative number for ${k} (per million tokens)`);
  return json;
}

const sum = (xs) => xs.reduce((a, b) => a + b, 0);

// Pairs rows by taskId. Only pairs where both rows have check "pass" count toward any figure.
export function compare(baselineRows, candidateRows, prices = null) {
  const index = (rows, label) => {
    const map = new Map();
    for (const r of rows) {
      if (map.has(r.taskId)) throw new Error(`${label} has more than one row for taskId "${r.taskId}"; keep one run per task`);
      map.set(r.taskId, r);
    }
    return map;
  };
  const base = index(baselineRows, 'baseline');
  const cand = index(candidateRows, 'candidate');
  const unpaired = [...base.keys()].filter((t) => !cand.has(t)).map((t) => ({ taskId: t, side: 'baseline only' }))
    .concat([...cand.keys()].filter((t) => !base.has(t)).map((t) => ({ taskId: t, side: 'candidate only' })));
  const pairs = [...base.keys()].filter((t) => cand.has(t)).map((t) => ({ taskId: t, b: base.get(t), c: cand.get(t) }));
  const counted = pairs.filter((p) => p.b.check === 'pass' && p.c.check === 'pass');
  const excluded = pairs.filter((p) => !counted.includes(p)).map((p) => ({ taskId: p.taskId, baselineCheck: p.b.check, candidateCheck: p.c.check }));
  const n = counted.length;
  const enough = n >= MIN_PAIRS;
  const summarise = (get) => {
    const used = counted.filter((p) => get(p.b) !== null && get(p.c) !== null);
    const baseTotal = sum(used.map((p) => get(p.b)));
    const candTotal = sum(used.map((p) => get(p.c)));
    const out = { n: used.length, baseline: baseTotal, candidate: candTotal, difference: candTotal - baseTotal };
    out.percent = enough && used.length >= MIN_PAIRS && baseTotal > 0 ? Math.round((100 * (baseTotal - candTotal)) / baseTotal) : null;
    return out;
  };
  const metrics = Object.fromEntries(METRICS.map((m) => [m, summarise((r) => r[m])]));
  let weighted = null;
  if (prices) {
    const usable = counted.filter((p) => METRICS.every((m) => p.b[m] !== null && p.c[m] !== null));
    const cost = (r) => sum(METRICS.map((m) => (r[m] * prices[m]) / 1e6));
    const baseTotal = sum(usable.map((p) => cost(p.b)));
    const candTotal = sum(usable.map((p) => cost(p.c)));
    weighted = { n: usable.length, baseline: baseTotal, candidate: candTotal, difference: candTotal - baseTotal, percent: enough && usable.length >= MIN_PAIRS && baseTotal > 0 ? Math.round((100 * (baseTotal - candTotal)) / baseTotal) : null };
  }
  const message = enough ? null : `n=${n}, too few to call this a result`;
  return { n, minPairs: MIN_PAIRS, message, metrics, weighted, excluded, unpaired };
}

export function formatCompare(r) {
  const lines = [];
  lines.push(`pairs counted (both rows pass): n=${r.n}`);
  if (r.message) lines.push(r.message);
  const head = `${'metric'.padEnd(14)}  ${'n'.padStart(3)}  ${'baseline'.padStart(12)}  ${'candidate'.padStart(12)}  ${'diff'.padStart(12)}  saved`;
  lines.push(head);
  for (const m of METRICS) {
    const s = r.metrics[m];
    lines.push(`${m.padEnd(14)}  ${String(s.n).padStart(3)}  ${String(s.baseline).padStart(12)}  ${String(s.candidate).padStart(12)}  ${String(s.difference).padStart(12)}  ${s.percent === null ? '-' : `${s.percent}%`}`);
  }
  if (r.weighted) {
    const w = r.weighted;
    lines.push(`${'weighted'.padEnd(14)}  ${String(w.n).padStart(3)}  ${w.baseline.toFixed(4).padStart(12)}  ${w.candidate.toFixed(4).padStart(12)}  ${w.difference.toFixed(4).padStart(12)}  ${w.percent === null ? '-' : `${w.percent}%`}`);
  }
  for (const e of r.excluded) lines.push(`excluded ${e.taskId}: baseline ${e.baselineCheck}, candidate ${e.candidateCheck}`);
  for (const u of r.unpaired) lines.push(`unpaired ${u.taskId}: ${u.side}`);
  return lines.join('\n');
}

function parseFlags(args) {
  const flags = {};
  const positional = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--json') flags.json = true;
    else if (args[i].startsWith('--')) flags[args[i].slice(2)] = args[++i];
    else positional.push(args[i]);
  }
  return { flags, positional };
}

const USAGE = 'usage: neutron.mjs ledger add | import-ccusage <file> | compare --baseline a.jsonl --candidate b.jsonl [--prices p.json] [--json]';

export function ledgerMain(argv) {
  const [sub, ...rest] = argv;
  const { flags, positional } = parseFlags(rest);
  try {
    if (sub === 'add') {
      if (!flags.file) throw new Error('--file is required');
      const count = (v) => (v === undefined ? null : /^\d+$/.test(v) ? Number(v) : v);
      const row = addRow(flags.file, {
        date: flags.date, harness: flags.harness, model: flags.model ?? null, taskId: flags.task, arm: flags.arm,
        uncachedInput: count(flags.uncached), cacheWrite: count(flags['cache-write']), cacheRead: count(flags['cache-read']), output: count(flags.output),
        check: flags.check, notes: flags.notes ?? null,
      });
      console.log(JSON.stringify(row));
      return 0;
    }
    if (sub === 'import-ccusage') {
      if (!positional[0]) throw new Error('give the ccusage JSON file');
      const rows = importCcusage(JSON.parse(readFileSync(positional[0], 'utf8')), { arm: flags.arm, harness: flags.harness, check: flags.check });
      const text = rows.map((r) => JSON.stringify(r)).join('\n');
      if (flags.out) appendFileSync(flags.out, `${text}\n`);
      else console.log(text);
      console.error(`${rows.length} rows${flags.out ? ` appended to ${flags.out}` : ''}; check is "${flags.check ?? 'not-checked'}" until you set it per task`);
      return 0;
    }
    if (sub === 'compare') {
      if (!flags.baseline || !flags.candidate) throw new Error('--baseline and --candidate are required');
      const prices = flags.prices ? loadPrices(JSON.parse(readFileSync(flags.prices, 'utf8'))) : null;
      const result = compare(readLedger(flags.baseline), readLedger(flags.candidate), prices);
      console.log(flags.json ? JSON.stringify(result, null, 2) : formatCompare(result));
      return 0;
    }
  } catch (e) {
    console.error(`ledger: ${e.message}`);
    return 1;
  }
  console.error(USAGE);
  return 2;
}

import { pathToFileURL } from 'node:url';
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) process.exit(ledgerMain(process.argv.slice(2)));
