#!/usr/bin/env node
// Capability preflight: says before a run which parts of the studio this machine can do,
// so a missing browser or second provider is known up front instead of discovered mid-run.
//
// Exit codes: 0 everything the studio uses is present · 1 degraded (it can run, some
// evidence or independence will be missing) · 2 the scanner itself cannot run.

import { existsSync, readdirSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

const MIN_NODE = 20;

function onPath(cmd) {
  try {
    execFileSync(process.platform === 'win32' ? 'where' : 'which', [cmd], { stdio: 'ignore' });
    return true;
  } catch { return false; }
}

function skillInstalled(name, cwd) {
  const roots = [join(cwd, '.claude', 'skills'), join(homedir(), '.claude', 'skills')];
  return roots.some(r => existsSync(join(r, name, 'SKILL.md')));
}

const BROWSER_BINARY = /^(chrome|chrome\.exe|chromium|headless_shell|headless_shell\.exe|chrome-headless-shell(\.exe)?|Chromium)$/;

// Looks a few levels down a Playwright revision folder for the browser binary itself, so an empty
// or half-downloaded revision does not count.
function hasBrowserBinary(dir, depth = 4) {
  if (depth < 0 || !existsSync(dir)) return false;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isFile() && BROWSER_BINARY.test(entry.name)) return true;
    if (entry.isDirectory() && hasBrowserBinary(join(dir, entry.name), depth - 1)) return true;
  }
  return false;
}

// A Playwright package without a downloaded browser cannot take a screenshot, so both must exist.
export function chromiumInstalled(env = process.env) {
  if (env.PLAYWRIGHT_CHROMIUM_EXECUTABLE) {
    const path = env.PLAYWRIGHT_CHROMIUM_EXECUTABLE;
    return existsSync(path) && /chrom|headless_shell/i.test(path.split(/[\\/]/).pop());
  }
  const caches = [
    env.PLAYWRIGHT_BROWSERS_PATH,
    env.LOCALAPPDATA && join(env.LOCALAPPDATA, 'ms-playwright'),
    join(homedir(), '.cache', 'ms-playwright'),
    join(homedir(), 'Library', 'Caches', 'ms-playwright'),
  ].filter(Boolean);
  // A remote layout can put the executable straight in the cache root (/opt/pw-browsers/chromium).
  return caches.some(dir => existsSync(dir) && statSync(dir).isDirectory() && readdirSync(dir)
    .filter(name => /^chromium/.test(name))
    .some(name => (statSync(join(dir, name)).isDirectory()
      ? hasBrowserBinary(join(dir, name))
      : /^chromium(?:-browser)?(?:\.exe)?$/i.test(name))));
}

function playwrightAvailable(cwd) {
  const req = createRequire(join(cwd, 'package.json'));
  const hasPackage = ['playwright', '@playwright/test', 'playwright-core'].some(pkg => {
    try { req.resolve(pkg); return true; } catch { return false; }
  }) || onPath('playwright');
  return hasPackage && chromiumInstalled();
}

export function check(cwd = process.cwd()) {
  const nodeMajor = Number(process.versions.node.split('.')[0]);
  const providers = ['codex', 'gemini', 'agy', 'grok'].filter(onPath);
  const items = [
    { need: 'core', name: 'Node.js >= 20 (scanner, sweep)', ok: nodeMajor >= MIN_NODE, fix: `Install Node ${MIN_NODE} or newer.` },
    { need: 'evidence', name: 'Playwright + Chromium (screenshots)', ok: playwrightAvailable(cwd), fix: 'pnpm add -D playwright && pnpm exec playwright install chromium, or set PLAYWRIGHT_CHROMIUM_EXECUTABLE.' },
    { need: 'evidence', name: 'visual-proof skill (capture runner)', ok: skillInstalled('visual-proof', cwd), fix: 'Install the web-excellence pack: packs/web-excellence/install.sh <repo>.' },
    { need: 'independence', name: `second-provider CLI for the critic${providers.length ? ` (${providers.join(', ')})` : ''}`, ok: providers.length > 0, fix: 'Install and sign in to one of: codex, gemini, agy, grok. Without it every critique is recorded as same-model.' },
    { need: 'craft', name: 'web-release-gate skill (build contract)', ok: skillInstalled('web-release-gate', cwd), fix: 'Install the web-excellence pack.' },
    { need: 'craft', name: 'humanizer skill (copy pass)', ok: skillInstalled('humanizer', cwd), fix: 'Optional: install a humanizer skill for the final copy pass.' },
    { need: 'craft', name: 'gpu-surface skill (WebGL decisions)', ok: skillInstalled('gpu-surface', cwd), fix: 'Optional: the gpu-artist agent carries its own rules without it.' },
  ];
  const coreOk = items.filter(i => i.need === 'core').every(i => i.ok);
  const allOk = items.filter(i => i.need !== 'craft').every(i => i.ok);
  return { items, providers, exit: !coreOk ? 2 : allOk ? 0 : 1 };
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const result = check();
  if (process.argv.includes('--json')) console.log(JSON.stringify(result, null, 2));
  else {
    for (const i of result.items) console.log(`${i.ok ? 'ok  ' : 'MISS'}  [${i.need}] ${i.name}${i.ok ? '' : `\n        ${i.fix}`}`);
    console.log(result.exit === 0 ? '\nThe full studio can run here.' : result.exit === 1
      ? '\nThe studio can run, but some evidence or independence will be reported as missing.'
      : '\nThe scanner cannot run on this machine.');
  }
  process.exitCode = result.exit;
}
