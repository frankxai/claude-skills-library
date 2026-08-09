#!/usr/bin/env node
/**
 * Visual QA — responsive screenshots + Core Web Vitals via the Performance API.
 *
 * gstack-style measurement: no Lighthouse. CWV (LCP / FCP / TTFB / bundle) is read
 * from the browser's own performance.getEntriesByType(...) — robust in CI, no extra deps.
 *
 * Resolves Playwright from the repo's @playwright/test, falling back to a global
 * `playwright`. Honors PLAYWRIGHT_BROWSERS_PATH (preinstalled Chromium) — never
 * downloads a browser itself.
 *
 * Usage:
 *   node scripts/visual-qa.mjs <base-url> [route1 route2 ...]
 * Env:
 *   PREVIEW_URL                     fallback base url if no arg
 *   VQA_ROUTES                      comma-separated routes (default: /, /design-lab/web-os)
 *   VQA_OUT                         output dir (default: ./screenshots)
 *   VERCEL_AUTOMATION_BYPASS_SECRET sends x-vercel-protection-bypass header
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

const WIDTHS = [
  { name: 'mobile', width: 375, height: 812 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1440, height: 900 },
];

async function loadChromium() {
  // ESM import resolves the repo's @playwright/test (CI); createRequire honors
  // NODE_PATH, resolving a global `playwright` (local proof runs).
  for (const mod of ['@playwright/test', 'playwright']) {
    try {
      const pw = await import(mod);
      if (pw.chromium) return pw.chromium;
    } catch {
      /* try next */
    }
    try {
      const pw = require(mod);
      if (pw.chromium) return pw.chromium;
    } catch {
      /* try next */
    }
  }
  throw new Error(
    "Cannot resolve Playwright. Install with `pnpm install` (repo declares @playwright/test) " +
      'or run with a global `playwright` on NODE_PATH.',
  );
}

// Collect Core Web Vitals from the Performance Timeline (gstack /benchmark mechanism).
async function collectVitals(page) {
  return page.evaluate(async () => {
    const nav = performance.getEntriesByType('navigation')[0] || {};
    const paint = performance.getEntriesByType('paint');
    const fcp = paint.find((p) => p.name === 'first-contentful-paint');

    // LCP: observe, then resolve on the next frame (buffered captures the pre-load entry).
    const lcp = await new Promise((resolve) => {
      let val = 0;
      try {
        const po = new PerformanceObserver((list) => {
          for (const e of list.getEntries()) val = e.startTime;
        });
        po.observe({ type: 'largest-contentful-paint', buffered: true });
        requestAnimationFrame(() => requestAnimationFrame(() => { po.disconnect(); resolve(val); }));
      } catch {
        resolve(0);
      }
    });

    const res = performance.getEntriesByType('resource');
    const sum = (f) => res.filter(f).reduce((a, r) => a + (r.transferSize || 0), 0);
    const isJS = (r) => r.initiatorType === 'script' || /\.js(\?|$)/.test(r.name);
    const isCSS = (r) => r.initiatorType === 'link' || /\.css(\?|$)/.test(r.name);

    return {
      ttfb: Math.round(nav.responseStart || 0),
      fcp: Math.round(fcp ? fcp.startTime : 0),
      lcp: Math.round(lcp),
      domContentLoaded: Math.round(nav.domContentLoadedEventEnd || 0),
      loadComplete: Math.round(nav.loadEventEnd || 0),
      requests: res.length,
      jsBytes: sum(isJS),
      cssBytes: sum(isCSS),
      totalBytes: res.reduce((a, r) => a + (r.transferSize || 0), 0),
    };
  });
}

async function main() {
  const base = (process.argv[2] || process.env.PREVIEW_URL || '').replace(/\/$/, '');
  const outDir = process.env.VQA_OUT || 'screenshots';
  const routes =
    process.argv.slice(3).length > 0
      ? process.argv.slice(3)
      : (process.env.VQA_ROUTES || '/,/design-lab/web-os').split(',').map((r) => r.trim());

  if (!base) {
    await mkdir(outDir, { recursive: true });
    await writeFile(join(outDir, 'SKIPPED.txt'), 'No base URL provided — visual QA skipped.\n');
    console.log('visual-qa: no base URL, skipped.');
    return;
  }

  const chromium = await loadChromium();
  await mkdir(outDir, { recursive: true });

  const bypass = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
  // Optional egress proxy (some sandboxes route outbound HTTPS through one). CI leaves this unset.
  const proxy = process.env.VQA_PROXY ? { server: process.env.VQA_PROXY } : undefined;
  const browser = await chromium.launch({ headless: true, proxy });
  const report = { base, generatedAt: new Date().toISOString(), routes: [] };

  try {
    for (const route of routes) {
      const url = base + (route.startsWith('/') ? route : `/${route}`);
      const slug = route === '/' ? 'home' : route.replace(/^\//, '').replace(/\//g, '-');
      const routeEntry = { route, url, shots: [], vitals: null, error: null };

      const context = await browser.newContext(
        bypass ? { extraHTTPHeaders: { 'x-vercel-protection-bypass': bypass } } : {},
      );
      const page = await context.newPage();

      try {
        await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
        for (const vp of WIDTHS) {
          await page.setViewportSize({ width: vp.width, height: vp.height });
          await page.waitForTimeout(400);
          const file = join(outDir, `${slug}-${vp.name}.png`);
          await page.screenshot({ path: file, fullPage: true });
          routeEntry.shots.push({ width: vp.width, file });
        }
        routeEntry.vitals = await collectVitals(page);
        console.log(`visual-qa: ${route} OK — LCP ${routeEntry.vitals.lcp}ms, ${routeEntry.shots.length} shots`);
      } catch (err) {
        routeEntry.error = String(err && err.message ? err.message : err);
        await writeFile(join(outDir, `${slug}-FAILED.txt`), routeEntry.error + '\n');
        console.error(`visual-qa: ${route} FAILED — ${routeEntry.error}`);
      } finally {
        await context.close();
      }
      report.routes.push(routeEntry);
    }
  } finally {
    await browser.close();
  }

  await writeFile(join(outDir, 'metrics.json'), JSON.stringify(report, null, 2));
  const failed = report.routes.filter((r) => r.error).length;
  console.log(`visual-qa: wrote ${outDir}/metrics.json (${report.routes.length} routes, ${failed} failed)`);
  // Non-fatal: the workflow's downstream vision step still runs and posts the report.
}

main().catch((err) => {
  console.error('visual-qa fatal:', err);
  process.exit(1);
});
