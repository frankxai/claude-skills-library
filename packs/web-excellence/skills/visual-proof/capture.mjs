#!/usr/bin/env node
// capture.mjs — screenshot a URL across breakpoints and themes.
//
//   node capture.mjs --url http://localhost:3000/ --label before
//   node capture.mjs --url https://example.com/x --label after --widths 390,1280 --full
//
// Writes <out>/<label>/<width>-<theme>.png and prints every path it wrote.
// Exits non-zero with a plain-English reason if it cannot capture, so the
// caller can report "not captured" instead of inventing a description.

import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

function arg(name, fallback = null) {
  const i = process.argv.indexOf(`--${name}`);
  if (i === -1) return fallback;
  const next = process.argv[i + 1];
  return next && !next.startsWith('--') ? next : true;
}

const url = arg('url');
const label = arg('label', 'shot');
const widths = String(arg('widths', '375,768,1440')).split(',').map(n => parseInt(n, 10));
const themes = String(arg('themes', 'light,dark')).split(',');
const fullPage = Boolean(arg('full', false));
const outRoot = String(arg('out', '.visual-proof'));

if (!url || url === true) {
  console.error('usage: capture.mjs --url <url> [--label before] [--widths 375,768,1440] [--themes light,dark] [--full] [--out .visual-proof]');
  process.exit(2);
}

let chromium;
try {
  ({ chromium } = await import('playwright'));
} catch {
  try {
    ({ chromium } = await import('@playwright/test'));
  } catch {
    console.error('Cannot capture: Playwright is not available in this project.');
    console.error('Install it (npm i -D playwright) or report that visual proof was not captured.');
    process.exit(3);
  }
}

// Remote Claude Code sessions ship Chromium at /opt/pw-browsers and forbid
// `playwright install`. Honor an explicit executable when one is provided.
const launchOpts = { headless: true };
if (process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE) {
  launchOpts.executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE;
}

let browser;
try {
  browser = await chromium.launch(launchOpts);
} catch (err) {
  console.error(`Cannot capture: Chromium failed to launch — ${err.message}`);
  console.error('If this is a remote session, set PLAYWRIGHT_CHROMIUM_EXECUTABLE=/opt/pw-browsers/chromium.');
  process.exit(4);
}

const written = [];
let failed = 0;

for (const theme of themes) {
  for (const width of widths) {
    const context = await browser.newContext({
      viewport: { width, height: Math.round(width * 1.6) },
      deviceScaleFactor: 2,
      colorScheme: theme === 'dark' ? 'dark' : 'light',
    });
    const page = await context.newPage();
    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 45_000 });

      if (theme === 'dark') {
        // Best effort across the common theme implementations. colorScheme
        // emulation above already covers prefers-color-scheme sites.
        await page.evaluate(() => {
          const html = document.documentElement;
          html.classList.add('dark');
          html.setAttribute('data-theme', 'dark');
        });
        await page.waitForTimeout(400);
      }

      // let entrance animations settle so the shot is the resting state
      await page.waitForTimeout(600);

      const dir = join(outRoot, label);
      mkdirSync(dir, { recursive: true });
      const path = join(dir, `${width}-${theme}.png`);
      await page.screenshot({ path, fullPage });
      written.push(path);

      const overflows = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      );
      if (overflows) console.log(`  ! horizontal scroll at ${width}px (${theme})`);
    } catch (err) {
      failed++;
      console.error(`  x ${width}px ${theme}: ${err.message}`);
    } finally {
      await context.close();
    }
  }
}

await browser.close();

if (!written.length) {
  console.error('Cannot capture: every screenshot attempt failed. Is the server running at that URL?');
  process.exit(5);
}

console.log(`\ncaptured ${written.length} shot(s) for "${label}":`);
for (const p of written) console.log(`  ${p}`);
if (failed) {
  console.log(`\n${failed} shot(s) failed — report them as not captured, do not describe those states.`);
}
