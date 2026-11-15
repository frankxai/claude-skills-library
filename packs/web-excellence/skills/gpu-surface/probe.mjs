#!/usr/bin/env node
// probe.mjs — measure the GPU surface on one page, in the three states it must survive.
//
//   node probe.mjs --url http://localhost:3000/
//   node probe.mjs --url http://localhost:3000/ --baseline http://localhost:3000/about --shots .visual-proof/gpu
//   node probe.mjs --url https://<preview>.vercel.app/ --json
//
// Loads the page three times: with motion, with prefers-reduced-motion, and
// with WebGL and WebGPU switched off. Reports what it measured and exits 0
// only when every check it can make mechanically holds:
//
//   - at most one canvas with a GPU context is attached to the page
//   - that canvas does not move under reduced motion
//   - the page logs no console error in any of the three states
//   - without a GPU context, no GPU canvas is attached (the poster carries the page)
//   - the largest contentful paint is not the canvas
//
// It also reports the JavaScript the page transferred, against --baseline when
// one is given. Whether the still and the poster look designed is for a
// person looking at the --shots images; the probe only proves they exist.
//
// Exit codes: 0 pass · 1 a check failed · 2 usage · 3 no Playwright · 4 no Chromium · 5 page did not load

import { mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';

function arg(name, fallback = null) {
  const i = process.argv.indexOf(`--${name}`);
  if (i === -1) return fallback;
  const next = process.argv[i + 1];
  return next && !next.startsWith('--') ? next : true;
}

const url = arg('url');
const baseline = arg('baseline');
const shots = arg('shots');
const asJson = Boolean(arg('json', false));
const width = parseInt(arg('width', '1440'), 10);
const settle = parseInt(arg('settle', '2500'), 10);

if (!url || url === true || baseline === true || shots === true) {
  console.error('usage: probe.mjs --url <url> [--baseline <url>] [--shots <dir>] [--width 1440] [--settle 2500] [--json]');
  process.exit(2);
}

// An ES import resolves from this file and ignores NODE_PATH; a CommonJS
// require from the working directory honours both, which is how a project's
// own Playwright and a globally installed one are each found.
async function loadChromium() {
  const fromCwd = createRequire(join(process.cwd(), 'package.json'));
  for (const name of ['playwright', '@playwright/test']) {
    try {
      return (await import(name)).chromium;
    } catch {
      try {
        return fromCwd(name).chromium;
      } catch {
        // Try the next name.
      }
    }
  }
  return null;
}

const chromium = await loadChromium();
if (!chromium) {
  console.error('Cannot probe: Playwright is not available in this project.');
  console.error('Install it (npm i -D playwright) or report that the GPU surface was not probed.');
  process.exit(3);
}

const launchOpts = { headless: true };
if (process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE) {
  launchOpts.executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE;
}

let browser;
try {
  browser = await chromium.launch(launchOpts);
} catch (err) {
  console.error(`Cannot probe: Chromium failed to launch — ${err.message}`);
  console.error('If this is a remote session, set PLAYWRIGHT_CHROMIUM_EXECUTABLE=/opt/pw-browsers/chromium.');
  process.exit(4);
}

// Runs in the page before any of its scripts. Records which canvases were
// given a GPU context, and refuses to give one when `blockGpu` is set.
function instrument(blockGpu) {
  const GPU = ['webgl', 'webgl2', 'experimental-webgl', 'webgpu'];
  const seen = new Map();
  window.__gpuCanvases = seen;
  const original = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (type, ...rest) {
    if (GPU.includes(type)) {
      if (blockGpu) {
        seen.set(this, type);
        return null;
      }
      const context = original.call(this, type, ...rest);
      if (context) seen.set(this, type);
      return context;
    }
    return original.call(this, type, ...rest);
  };
  if (blockGpu && navigator.gpu) {
    Object.defineProperty(navigator, 'gpu', { value: undefined, configurable: true });
  }
  window.__lcp = null;
  try {
    new PerformanceObserver((list) => {
      const last = list.getEntries().at(-1);
      if (last) window.__lcp = last.element ? last.element.tagName.toLowerCase() : 'unknown';
    }).observe({ type: 'largest-contentful-paint', buffered: true });
  } catch {
    // Not every engine reports LCP; the report then says "not reported".
  }
}

async function visit(target, { reduced = false, blockGpu = false, shotName = null } = {}) {
  const context = await browser.newContext({
    viewport: { width, height: Math.round(width * 0.625) },
    deviceScaleFactor: 1,
    ...(reduced ? { reducedMotion: 'reduce' } : {}),
  });
  await context.addInitScript(instrument, blockGpu);
  const page = await context.newPage();
  const errors = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text().slice(0, 300));
  });
  page.on('pageerror', (error) => errors.push(String(error.message).slice(0, 300)));

  // Transferred bytes per script, from the protocol: what the visitor downloads.
  const cdp = await context.newCDPSession(page);
  await cdp.send('Network.enable');
  const scriptRequests = new Set();
  let jsBytes = 0;
  cdp.on('Network.responseReceived', (event) => {
    if (event.type === 'Script') scriptRequests.add(event.requestId);
  });
  cdp.on('Network.loadingFinished', (event) => {
    if (scriptRequests.has(event.requestId)) jsBytes += event.encodedDataLength;
  });

  const result = { loaded: false, errors, jsBytes: 0, canvases: [], moving: null, lcp: null, shot: null };
  try {
    const response = await page.goto(target, { waitUntil: 'load', timeout: 45000 });
    if (response && !response.ok()) throw new Error(`HTTP ${response.status()}`);
    await page.waitForTimeout(settle);
    result.loaded = true;
  } catch (err) {
    errors.push(`navigation: ${String(err.message).split('\n')[0]}`);
    await context.close();
    return result;
  }

  const attached = await page.evaluate(() => {
    const out = [];
    let index = 0;
    for (const [canvas, type] of window.__gpuCanvases) {
      if (!canvas.isConnected) continue;
      const box = canvas.getBoundingClientRect();
      if (box.width < 2 || box.height < 2) continue;
      canvas.setAttribute('data-gpu-probe', String(index));
      out.push({ index, type, width: Math.round(box.width), height: Math.round(box.height) });
      index += 1;
    }
    return out;
  });
  result.canvases = attached;
  result.lcp = await page.evaluate(() => window.__lcp);

  // Two frames of the first canvas, 700 ms apart: identical bytes means it is still.
  if (attached.length > 0) {
    const first = page.locator('[data-gpu-probe="0"]');
    try {
      await first.scrollIntoViewIfNeeded({ timeout: 3000 });
      const a = await first.screenshot({ timeout: 10000 });
      await page.waitForTimeout(700);
      const b = await first.screenshot({ timeout: 10000 });
      result.moving = !a.equals(b);
    } catch {
      result.moving = null;
    }
  }

  if (shots && shotName) {
    mkdirSync(String(shots), { recursive: true });
    result.shot = join(String(shots), `${shotName}.png`);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: result.shot });
  }

  // Read after the screenshots so late chunks are counted.
  result.jsBytes = jsBytes;
  await context.close();
  return result;
}

const motion = await visit(url, { shotName: 'motion' });
if (!motion.loaded) {
  console.error(`Cannot probe: ${url} did not load — ${motion.errors.at(-1) ?? 'unknown reason'}`);
  await browser.close();
  process.exit(5);
}
const still = await visit(url, { reduced: true, shotName: 'reduced-motion' });
const noGpu = await visit(url, { blockGpu: true, shotName: 'no-gpu' });
const base = baseline ? await visit(String(baseline)) : null;
if (base && !base.loaded) {
  console.error(`Cannot probe: baseline ${baseline} did not load — ${base.errors.at(-1) ?? 'unknown reason'}`);
  await browser.close();
  process.exit(5);
}
await browser.close();

const kb = (bytes) => `${(bytes / 1024).toFixed(1)} kB`;
const checks = [
  {
    name: 'one GPU surface at most',
    pass: motion.canvases.length <= 1,
    detail: `${motion.canvases.length} GPU canvas(es): ${motion.canvases.map((c) => `${c.type} ${c.width}×${c.height}`).join(', ') || 'none'}`,
  },
  {
    name: 'still under reduced motion',
    pass: still.loaded && (still.canvases.length === 0 || still.moving === false),
    detail: !still.loaded ? 'reduced-motion visit did not load' : still.canvases.length === 0 ? 'no canvas under reduced motion' : still.moving === false ? 'canvas present and still' : still.moving === null ? 'canvas present; movement could not be measured' : 'canvas keeps moving',
  },
  {
    name: 'no console errors',
    pass: motion.errors.length + still.errors.length + noGpu.errors.length === 0,
    detail: [...new Set([...motion.errors, ...still.errors, ...noGpu.errors])].slice(0, 3).join(' | ') || 'none in motion, reduced motion, or no-GPU',
  },
  {
    name: 'no canvas without a GPU',
    pass: noGpu.loaded && noGpu.canvases.length === 0,
    detail: !noGpu.loaded ? 'no-GPU visit did not load' : noGpu.canvases.length === 0 ? 'poster carries the page' : `${noGpu.canvases.length} canvas(es) still attached`,
  },
  {
    name: 'canvas is not the LCP',
    pass: motion.lcp !== 'canvas',
    detail: motion.lcp ? `LCP element: <${motion.lcp}>` : 'LCP not reported',
  },
];

const report = {
  url,
  moving: motion.moving,
  jsBytes: motion.jsBytes,
  baselineJsBytes: base ? base.jsBytes : null,
  checks,
  shots: [motion.shot, still.shot, noGpu.shot].filter(Boolean),
};

if (asJson) {
  console.log(JSON.stringify(report, null, 2));
} else {
  console.log(`GPU surface probe — ${url}`);
  for (const check of checks) console.log(`  ${check.pass ? 'ok  ' : 'FAIL'} ${check.name} — ${check.detail}`);
  console.log(`  info motion state — ${motion.canvases.length === 0 ? 'no GPU canvas on this page' : motion.moving === true ? 'canvas is moving' : motion.moving === false ? 'canvas is still' : 'canvas movement could not be measured'}`);
  console.log(`  info JavaScript transferred — ${kb(motion.jsBytes)}${base ? ` (baseline ${kb(base.jsBytes)}, surface costs ${kb(motion.jsBytes - base.jsBytes)})` : ''}`);
  for (const shot of report.shots) console.log(`  shot ${shot}`);
}

process.exit(checks.every((check) => check.pass) ? 0 : 1);
