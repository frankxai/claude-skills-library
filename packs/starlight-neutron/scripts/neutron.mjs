#!/usr/bin/env node
// neutron.mjs: doctor (what is wired) and bench (raw vs RTK-filtered output, in bytes).
//   node neutron.mjs doctor
//   node neutron.mjs bench [--json | --md]
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, realpathSync } from 'node:fs';
import { homedir } from 'node:os';
import { delimiter, isAbsolute, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { ledgerMain } from './ledger.mjs';

// Same output either side of the filter: no lossy listing commands in this table.
export const BENCH_CASES = (rtk) => [
  { label: 'git log -n 40', raw: ['git', 'log', '-n', '40'], rtk: [rtk, 'git', 'log', '-n', '40'] },
  { label: 'git diff HEAD~5', raw: ['git', 'diff', 'HEAD~5'], rtk: [rtk, 'git', 'diff', 'HEAD~5'] },
  { label: 'git status', raw: ['git', 'status'], rtk: [rtk, 'git', 'status'] },
  { label: 'grep -rn name: free-skills', raw: ['grep', '-rn', 'name:', 'free-skills'], rtk: [rtk, 'grep', '-rn', 'name:', 'free-skills'] },
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

export function formatMarkdown(rows) {
  const body = rows.map((r) =>
    r.skipped ? `| \`${r.label}\` | skipped | ${r.skipped} | |` : `| \`${r.label}\` | ${r.raw.toLocaleString('en-US')} | ${r.rtk.toLocaleString('en-US')} | ${r.saved}% |`,
  );
  return ['| Command | Raw bytes | RTK bytes | Saved |', '|---|---|---|---|', ...body].join('\n');
}

function capture(argv, options = {}) {
  const [name, ...args] = argv;
  const cmd = isAbsolute(name) ? name : findOnPath(name);
  if (!cmd) return { ok: false, error: 'ENOENT' };
  const res = spawnSync(cmd, args, { encoding: 'buffer', maxBuffer: 256 * 1024 * 1024, ...options });
  if (res.error) return { ok: false, error: res.error.code || res.error.message };
  return { ok: true, bytes: res.stdout.length + res.stderr.length, status: res.status };
}

export function bench(cases) {
  return cases.map(({ label, raw, rtk }) => {
    const base = capture(raw);
    if (!base.ok) return { label, skipped: `${raw[0]} ${base.error}` };
    // grep exits 1 on no match, which is a valid empty result; only a failure with no output is skipped.
    if (base.status !== 0 && base.bytes === 0) return { label, skipped: `${raw[0]} exited ${base.status}` };
    const filtered = capture(rtk);
    if (!filtered.ok) return { label, skipped: `${rtk[0]} ${filtered.error}` };
    if (filtered.status !== base.status) {
      return { label, skipped: `exit codes differ (raw ${base.status}, filtered ${filtered.status}); a failed filter is not a saving` };
    }
    return { label, raw: base.bytes, rtk: filtered.bytes, saved: savedPercent(base.bytes, filtered.bytes) };
  });
}

const WINDOWS_EXTENSIONS = ['.exe', '.cmd'];

// Resolve a bare tool name to an absolute path. A bare name handed to spawn can pick up a planted binary from the
// current directory on Windows, and this code runs inside hooks in repositories the user did not write. So only
// absolute PATH entries count, and the working directory itself is skipped even when PATH lists it.
// Compare folders as the file system does: follow links and 8.3 short names, and ignore case where the OS does.
export function samePath(a, b) {
  const real = (p) => {
    let full = resolve(p);
    try {
      full = realpathSync.native(full);
    } catch {
      // folder does not exist; compare the spelled path
    }
    return process.platform === 'win32' || process.platform === 'darwin' ? full.toLowerCase() : full;
  };
  return real(a) === real(b);
}

export function findOnPath(name, env = process.env, cwd = process.cwd()) {
  const extensions = process.platform === 'win32' ? WINDOWS_EXTENSIONS : [''];
  for (const entry of (env.PATH ?? env.Path ?? '').split(delimiter)) {
    if (!entry || !isAbsolute(entry)) continue;
    const dir = resolve(entry);
    if (samePath(dir, cwd)) continue;
    for (const ext of extensions) {
      const candidate = join(dir, name + ext);
      if (existsSync(candidate)) return candidate;
    }
  }
  return null;
}

function versionLine(res) {
  if (res.error || res.status !== 0) return null;
  return (res.stdout || res.stderr).trim().split(/\r?\n/)[0] || null;
}

// Takes an absolute path only. Returns the first line of --version output, or null.
function probeDirect(command) {
  if (!isAbsolute(command)) return null;
  return versionLine(spawnSync(command, ['--version'], { encoding: 'utf8' }));
}

// npm and uv install .cmd shims on Windows, which need a shell. The shell only ever sees an absolute path found on PATH.
function probeShim(name, env = process.env) {
  const found = findOnPath(name, env);
  if (!found) return null;
  const needsShell = /\.(cmd|bat)$/i.test(found);
  return versionLine(spawnSync(needsShell ? `"${found}"` : found, ['--version'], { encoding: 'utf8', shell: needsShell }));
}

// winget on Windows updates PATH only for new shells, so also look in its package folder.
export function resolveRtk(env = process.env, probe = probeDirect) {
  const candidates = [env.NEUTRON_RTK, findOnPath('rtk', env)].filter((c) => c && isAbsolute(c));
  const winget = env.LOCALAPPDATA && isAbsolute(env.LOCALAPPDATA) && join(env.LOCALAPPDATA, 'Microsoft', 'WinGet', 'Packages');
  if (winget && existsSync(winget)) {
    for (const dir of readdirSync(winget).filter((d) => /^rtk-ai\.rtk(_|$)/i.test(d)).sort()) candidates.push(join(winget, dir, 'rtk.exe'));
  }
  for (const command of candidates) {
    const found = probe(command);
    if (found) return { command, version: found };
  }
  return null;
}

function readJson(path) {
  try {
    return existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : null;
  } catch {
    return null;
  }
}

// True when any hook command in the file invokes rtk. A stray mention of "rtk" elsewhere does not count.
export function hasRtkHook(settings) {
  const events = settings?.hooks;
  if (!events || typeof events !== 'object') return false;
  return Object.values(events).flat().some((entry) => (entry?.hooks ?? []).some((h) => /\brtk\b/i.test(h?.command ?? '')));
}

// Managed Claude Code policy can also live in the Windows registry. A hook cannot read it, so report when it exists.
function registryPolicyHives() {
  if (process.platform !== 'win32') return [];
  const reg = join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'reg.exe');
  return ['HKLM', 'HKCU'].filter((hive) => spawnSync(reg, ['query', `${hive}\\SOFTWARE\\Policies\\ClaudeCode`], { encoding: 'utf8' }).status === 0);
}

export function doctor(home = homedir(), probes = { rtk: () => resolveRtk(), shim: probeShim, registry: registryPolicyHives }) {
  const dir = join(home, '.claude');
  const hookWired = ['settings.json', 'settings.local.json'].some((f) => hasRtkHook(readJson(join(dir, f))));
  const plugins = existsSync(join(dir, 'plugins', 'installed_plugins.json')) ? readFileSync(join(dir, 'plugins', 'installed_plugins.json'), 'utf8') : '';
  const cavemanOn = existsSync(join(dir, 'skills', 'caveman')) || /caveman/i.test(plugins);
  const rtk = probes.rtk();
  const [headroom, ccusage] = [probes.shim('headroom'), probes.shim('ccusage')];
  const policyHives = probes.registry?.() ?? [];
  return [
    { name: 'node', detail: process.version, ok: true },
    { name: 'rtk', detail: rtk ? `${rtk.version} (${rtk.command})` : 'not found. Install: winget install rtk-ai.rtk | brew install rtk | cargo install --git https://github.com/rtk-ai/rtk', ok: Boolean(rtk) },
    { name: 'rtk hook', detail: hookWired ? 'a hook command invokes rtk' : 'none in settings.json or settings.local.json (the neutron plugin ships one)', ok: hookWired },
    {
      name: 'registry policy',
      detail: policyHives.length ? `${policyHives.join(' and ')} ClaudeCode policy exists. The hook cannot read it, so rules held only there are not seen` : 'none found',
      ok: policyHives.length === 0,
    },
    { name: 'headroom', detail: headroom ??'not found. Install: uv tool install "headroom-ai[all]"', ok: Boolean(headroom) },
    { name: 'ccusage', detail: ccusage ?? 'not found. Install: npm install -g ccusage', ok: Boolean(ccusage) },
    { name: 'caveman (upstream)', detail: cavemanOn ? 'installed' : 'not installed (optional terse profile)', ok: cavemanOn },
  ];
}

function main(argv) {
  const [command = 'doctor', ...flags] = argv;
  if (command === 'bench') {
    const rtk = resolveRtk();
    if (!rtk) {
      console.error('rtk not found; run `doctor` for install commands');
      return 1;
    }
    const rows = bench(BENCH_CASES(rtk.command));
    if (flags.includes('--json')) {
      const git = spawnSync('git', ['rev-parse', '--short', 'HEAD'], { encoding: 'utf8' });
      console.log(JSON.stringify({ date: new Date().toISOString(), unit: 'bytes', rtk: rtk.version, platform: process.platform, repoHead: git.stdout.trim(), rows }, null, 2));
    } else console.log(flags.includes('--md') ? formatMarkdown(rows) : formatTable(rows));
    return 0;
  }
  if (command === 'ledger') return ledgerMain(flags);
  if (command === 'doctor') {
    for (const row of doctor()) console.log(`${row.ok ? 'ok     ' : 'missing'}  ${row.name.padEnd(20)} ${row.detail}`);
    return 0;
  }
  console.error('usage: neutron.mjs doctor | bench [--json | --md] | ledger <sub>');
  return 2;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exit(main(process.argv.slice(2)));
}
