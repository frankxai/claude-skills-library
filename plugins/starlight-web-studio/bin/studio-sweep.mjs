#!/usr/bin/env node
// Scan every property in a targets file and rank where the studio should work next.
// Targets: a JSON array of {id, url, tier}, or a Starlight properties graph ({properties:[...]}).
// Writes <out>/machine-<date>.jsonl (one scan per line) and <out>/board-<date>.md (the ranking).
//
// Exit codes: 0 swept · 1 at least one property has a P0 · 2 bad arguments · 3 every fetch failed.

import { readFile, writeFile, mkdir, rename } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { pathToFileURL } from 'node:url';
import { scanUrl } from './studio-scan.mjs';

const TIER_WEIGHT = { 'tier-1': 3, 'tier-2': 2, 'tier-3': 1 };
const CONCURRENCY = 4;

function arg(args, name, fallback = null) {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : fallback;
}

export function loadTargets(json) {
  const list = Array.isArray(json) ? json : json && Array.isArray(json.properties) ? json.properties : null;
  if (!list) throw new Error('targets must be an array or an object with a "properties" array');
  const targets = list
    .filter(p => p && typeof p.url === 'string' && /^https?:\/\//.test(p.url) && (p.status === undefined || p.status === 'live'))
    .map(p => ({ id: String(p.id ?? new URL(p.url).hostname), url: p.url, tier: p.tier ?? 'tier-3', repo: p.repo ?? null }));
  const seen = new Set();
  for (const t of targets) {
    if (!/^[a-z0-9][a-z0-9._-]*$/i.test(t.id)) throw new Error(`target id "${t.id}" is not a safe folder name`);
    if (seen.has(t.id)) throw new Error(`duplicate target id "${t.id}"; evidence folders would collide`);
    seen.add(t.id);
  }
  return targets;
}

// A finding someone has confirmed as intended (for example noindex on a redirect utility) is kept
// on record but stops counting, so a deliberate choice does not fail the run every day.
export function applyAccepted(report, targetId, accepted) {
  const keys = new Set(accepted.filter(a => a.startsWith(`${targetId}:`)).map(a => a.slice(targetId.length + 1)));
  if (!keys.size) return report;
  const findings = report.findings.map(f => (keys.has(f.id) ? { ...f, severity: 'info', accepted: true } : f));
  const PENALTY = { P0: 3, P1: 1, P2: 0.5, info: 0 };
  const scores = Object.fromEntries(Object.keys(report.scores).map(d => [d,
    Math.max(0, 5 - findings.filter(f => f.dimension === d).reduce((n, f) => n + PENALTY[f.severity], 0))]));
  return { ...report, findings, scores, score: Object.values(scores).reduce((a, b) => a + b, 0) };
}

// Any P0 outranks every property without one; within each band, opportunity is how much
// is missing weighted by how much the property matters.
export function rank(results) {
  return results
    .filter(r => r.report)
    .map(r => {
      const p0 = r.report.findings.filter(f => f.severity === 'P0').length;
      const opportunity = (TIER_WEIGHT[r.target.tier] ?? 1) * (r.report.max - r.report.score);
      return { ...r, p0, opportunity: Math.round(opportunity * 10) / 10 };
    })
    .sort((a, b) => (b.p0 > 0) - (a.p0 > 0) || b.opportunity - a.opportunity);
}

export function board(ranked, failed, date) {
  const lines = [`# Studio board — ${date}`, '',
    'Machine layer only: what a crawler sees in server HTML. Taste, layout and motion need the visual pass (rubric in `skills/studio-audit`).', '',
    '| Rank | Property | Tier | Machine score | P0 | Opportunity | Top finding |', '|---|---|---|---|---|---|---|'];
  ranked.forEach((r, i) => {
    const top = r.report.findings.find(f => f.severity !== 'info');
    lines.push(`| ${i + 1} | [${r.target.id}](${r.target.url}) | ${r.target.tier} | ${r.report.score}/${r.report.max} | ${r.p0} | ${r.opportunity} | ${top ? `${top.severity} ${top.dimension}/${top.id}` : '—'} |`);
  });
  if (failed.length) {
    lines.push('', '## Could not fetch', '', ...failed.map(f => `- ${f.target.id} (${f.target.url}): ${f.error}`));
  }
  lines.push('', '## Findings by property', '');
  for (const r of ranked.slice(0, 10)) {
    const real = r.report.findings.filter(f => f.severity !== 'info');
    if (!real.length) continue;
    lines.push(`### ${r.target.id}${r.target.repo ? ` — \`${r.target.repo}\`` : ''}`, '');
    for (const f of real.slice(0, 5)) lines.push(`- **${f.severity} ${f.dimension}/${f.id}** — ${f.evidence} ${f.fix}`);
    lines.push('');
  }
  return lines.join('\n');
}

// Status is derived from what the run produced, never from the exit code alone: a sweep that
// scanned nothing is failed, one that lost some properties is degraded.
export function heartbeatStatus(scanned, failed) {
  if (!scanned) return 'failed';
  return failed ? 'degraded' : 'ok';
}

async function writeHeartbeat(path, { ranked, failed, board }) {
  const body = {
    ts: new Date().toISOString(),
    source: 'studio-sweep',
    status: heartbeatStatus(ranked.length, failed.length),
    scanned: ranked.length,
    failed: failed.map(f => f.target.id),
    p0: ranked.filter(r => r.p0).map(r => r.target.id),
    board,
  };
  await mkdir(dirname(path), { recursive: true });
  const tmp = `${path}.tmp`;
  await writeFile(tmp, JSON.stringify(body, null, 2) + '\n');
  await rename(tmp, path);
}

async function pool(items, worker) {
  const out = new Array(items.length);
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, items.length) }, async () => {
    while (next < items.length) {
      const i = next++;
      out[i] = await worker(items[i]);
    }
  }));
  return out;
}

async function main(argv) {
  const args = argv.slice(2);
  const targetsPath = arg(args, '--targets');
  const outDir = arg(args, '--out', '.studio');
  if (!targetsPath) {
    console.error('usage: studio-sweep.mjs --targets <targets.json|properties.graph.json> [--out <dir>] [--only tier-1] [--heartbeat <file.json>] [--accept <id>:<finding>[,...]]');
    return 2;
  }
  const only = arg(args, '--only');
  let targets;
  try {
    targets = loadTargets(JSON.parse(await readFile(targetsPath, 'utf8'))).filter(t => !only || t.tier === only);
  } catch (err) {
    console.error(`bad targets file ${targetsPath}: ${err.message}`);
    return 2;
  }
  if (!targets.length) {
    console.error(`no live targets in ${targetsPath}`);
    return 2;
  }
  const accepted = args.flatMap((a, i) => (a === '--accept' && args[i + 1] ? args[i + 1].split(',') : []));
  const results = await pool(targets, async target => {
    try { return { target, report: applyAccepted(await scanUrl(target.url), target.id, accepted) }; }
    catch (err) { return { target, error: err.message }; }
  });
  const failed = results.filter(r => r.error);
  const ranked = rank(results);
  // Each run keeps its own files so same-day sweeps can be compared; latest.json points at the newest.
  const runId = new Date().toISOString().slice(0, 16).replace(':', '');
  await mkdir(outDir, { recursive: true });
  const machine = `machine-${runId}.jsonl`;
  const boardFile = `board-${runId}.md`;
  await writeFile(join(outDir, machine), results.filter(r => r.report)
    .map(r => JSON.stringify({ id: r.target.id, tier: r.target.tier, ...r.report })).join('\n') + '\n');
  const md = board(ranked, failed, runId);
  await writeFile(join(outDir, boardFile), md);
  await writeFile(join(outDir, 'latest.json'), JSON.stringify({ runId, machine, board: boardFile, scanned: ranked.length, failed: failed.length }, null, 2) + '\n');
  console.log(md.split('\n## Findings')[0]);
  console.log(`\nwrote ${join(outDir, boardFile)} and ${machine} (${ranked.length} scanned, ${failed.length} failed)`);
  const heartbeat = arg(args, '--heartbeat');
  if (heartbeat) await writeHeartbeat(heartbeat, { ranked, failed, board: join(outDir, boardFile) });
  if (!ranked.length) return 3;
  return ranked.some(r => r.p0) ? 1 : 0;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main(process.argv).then(code => { process.exitCode = code; });
}
