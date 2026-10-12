#!/usr/bin/env node
// thrift.mjs: doctor (what is wired) and bench (raw vs RTK-filtered output, in bytes).
//   node thrift.mjs doctor
//   node thrift.mjs bench [--json]
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const RTK = process.env.THRIFT_RTK || 'rtk';

export const BENCH_CASES = [
  { label: 'git log -n 40', raw: ['git', 'log', '-n', '40'], rtk: [RTK, 'git', 'log', '-n', '40'] },
  { label: 'git diff HEAD~5', raw: ['git', 'diff', 'HEAD~5'], rtk: [RTK, 'git', 'diff', 'HEAD~5'] },
  { label: 'git status', raw: ['git', 'status'], rtk: [RTK, 'git', 'status'] },
  { label: 'ls -la .', raw: ['ls', '-la', '.'], rtk: [RTK, 'ls', '.'] },
  { label: 'grep -rn TODO .', raw: ['grep', '-rn', 'TODO', '.'], rtk: [RTK, 'grep', '-rn', 'TODO', '.'] },
];

export function savedPercent(raw, compressed) {
  if (!(raw > 0)) return 0;
  return Math.round((100 * (raw - compressed)) / raw);
}

export function formatTable(rows) {
  const width = Math.max(...rows.map((r) => r.label.length), 7);
  const head = `${'command'.padEnd(width)}  ${'raw'.padStart(8)}  ${'rtk'.padStart(8)}  saved`;
  const lines = rows.map((r) =>
    r.skipped
      ? `${r.label.padEnd(width)}  skipped: ${r.skipped}`
      : `${r.label.padEnd(width)}  ${String(r.raw).padStart(8)}  ${String(r.rtk).padStart(8)}  ${String(r.saved).padStart(4)}%`,
  );
  return [head, ...lines].join('\n');
}

function capture(argv, options = {}) {
  const [cmd, ...args] = argv;
  const res = spawnSync(cmd, args, { encoding: 'buffer', maxBuffer: 256 * 1024 * 1024, ...options });
  if (res.error) return { ok: false, error: res.error.code || res.error.message };
  return { ok: true, bytes: res.stdout.length + res.stderr.length, status: res.status };
}

export function bench(cases = BENCH_CASES) {
  return cases.map(({ label, raw, rtk }) => {
    const base = capture(raw);
    if (!base.ok) return { label, skipped: `${raw[0]} ${base.error}` };
    if (base.status !== 0 && base.bytes === 0) return { label, skipped: `${raw[0]} exited ${base.status}` };
    const filtered = capture(rtk);
    if (!filtered.ok) return { label, skipped: `${rtk[0]} ${filtered.error}` };
    return { label, raw: base.bytes, rtk: filtered.bytes, saved: savedPercent(base.bytes, filtered.bytes) };
  });
}

function version(command) {
  const res = spawnSync(command, ['--version'], { encoding: 'utf8', shell: process.platform === 'win32' });
  if (res.error || res.status !== 0) return null;
  return (res.stdout || res.stderr).trim().split(/\r?\n/)[0];
}

function readText(path) {
  try {
    return existsSync(path) ? readFileSync(path, 'utf8') : '';
  } catch {
    return '';
  }
}

export function doctor(home = homedir()) {
  const settings = readText(join(home, '.claude', 'settings.json'));
  const plugins = readText(join(home, '.claude', 'plugins', 'installed_plugins.json'));
  const cavemanSkill = existsSync(join(home, '.claude', 'skills', 'caveman'));
  const [rtk, headroom, ccusage] = [version(RTK), version('headroom'), version('ccusage')];
  return [
    { name: 'node', detail: process.version, ok: true },
    { name: 'rtk', detail: rtk ?? 'not on PATH (winget install rtk-ai.rtk)', ok: Boolean(rtk) },
    { name: 'rtk hook', detail: /rtk/i.test(settings) ? 'present in settings.json' : 'missing (rtk init -g)', ok: /rtk/i.test(settings) },
    { name: 'headroom', detail: headroom ?? 'not on PATH (uv tool install "headroom-ai[all]")', ok: Boolean(headroom) },
    { name: 'ccusage', detail: ccusage ?? 'not on PATH (npm i -g ccusage)', ok: Boolean(ccusage) },
    {
      name: 'caveman (upstream)',
      detail: cavemanSkill || /caveman/i.test(plugins) ? 'installed' : 'not installed (optional, terse profile)',
      ok: cavemanSkill || /caveman/i.test(plugins),
    },
  ];
}

function main(argv) {
  const [command = 'doctor', ...flags] = argv;
  if (command === 'bench') {
    const rows = bench();
    console.log(flags.includes('--json') ? JSON.stringify({ date: new Date().toISOString(), unit: 'bytes', rows }, null, 2) : formatTable(rows));
    return 0;
  }
  if (command === 'doctor') {
    for (const row of doctor()) console.log(`${row.ok ? 'ok     ' : 'missing'}  ${row.name.padEnd(20)} ${row.detail}`);
    return 0;
  }
  console.error('usage: thrift.mjs doctor | bench [--json]');
  return 2;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exit(main(process.argv.slice(2)));
}
