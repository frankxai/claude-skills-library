#!/usr/bin/env node
// export.mjs — render a Paper Shaders surface to a still and to a loop, frame by frame.
//
//   node export.mjs --url http://localhost:3000/brand --still 3200
//   node export.mjs --url http://localhost:3000/brand --loop --from 3200 --seconds 4 --speed 0.6 --pingpong
//   node export.mjs --url http://localhost:3000/ --selector '[data-surface="hero"]' --still 42000 --scale 1
//
// --scale multiplies the surface's CSS size (default 2: a 420 px mark exports at 840 px).
//
// A Paper shader draws from one number: `frame`, milliseconds into the
// animation. The same number gives the same pixels on every machine. This
// script stops the surface, steps that number, and reads each frame straight
// from the canvas, alpha included. So the reduced-motion still on the site,
// the still exported here, and the first frame of the loop are one picture
// when they share a frame number.
//
// Writes <out>/still-<frame>.png, or <out>/frames/0001.png … and, when ffmpeg
// is on PATH, <out>/loop.webm (VP9, alpha kept) and <out>/loop.mp4 (H.264,
// flattened onto --background). Prints every path it wrote.
//
// Works on Paper Shaders surfaces only. A React Three Fiber scene has no frame
// number to step; take its still with visual-proof and record its loop by hand.
//
// Exit codes: 0 written · 2 usage · 3 no Playwright · 4 no Chromium · 5 page did not load
//             6 no Paper surface found · 7 frames written but encoding failed

import { spawnSync } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';

function arg(name, fallback = null) {
  const i = process.argv.indexOf(`--${name}`);
  if (i === -1) return fallback;
  const next = process.argv[i + 1];
  return next && !next.startsWith('--') ? next : true;
}

const url = arg('url');
const selector = arg('selector');
const still = arg('still');
const loop = Boolean(arg('loop', false));
const from = Number(arg('from', '0'));
const seconds = Number(arg('seconds', '4'));
const fps = Number(arg('fps', '30'));
const speed = Number(arg('speed', '1'));
const pingpong = Boolean(arg('pingpong', false));
const scale = Number(arg('scale', '2'));
const width = parseInt(arg('width', '1440'), 10);
const background = String(arg('background', '#000000'));
const out = String(arg('out', '.gpu-export'));

const usage = 'usage: export.mjs --url <url> (--still <frame-ms> | --loop [--from <frame-ms>] [--seconds 4] [--fps 30] [--speed 1] [--pingpong]) [--selector <css>] [--scale 2] [--width 1440] [--background #000000] [--out .gpu-export]';
const numbers = [from, seconds, fps, speed, scale, width];
if (!url || url === true || selector === true || (!loop && (still === null || still === true)) || numbers.some((n) => !Number.isFinite(n)) || !/^#[0-9a-fA-F]{6}$/.test(background) || (still !== null && !Number.isFinite(Number(still))) || seconds <= 0 || fps <= 0 || seconds * fps > 3600) {
  console.error(usage);
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
  console.error('Cannot export: Playwright is not available in this project.');
  console.error('Install it (npm i -D playwright) or report that nothing was exported.');
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
  console.error(`Cannot export: Chromium failed to launch — ${err.message}`);
  console.error('If this is a remote session, set PLAYWRIGHT_CHROMIUM_EXECUTABLE=/opt/pw-browsers/chromium.');
  process.exit(4);
}

const context = await browser.newContext({
  viewport: { width, height: Math.round(width * 0.625) },
  // Resolution comes from the shader's own pixel ratio below, not from an emulated display.
  deviceScaleFactor: 1,
});
const page = await context.newPage();
try {
  await page.goto(url, { waitUntil: 'load', timeout: 45000 });
} catch (err) {
  console.error(`Cannot export: ${url} did not load — ${String(err.message).split('\n')[0]}`);
  await browser.close();
  process.exit(5);
}

// Paper hangs its controller on the element that holds the canvas.
const found = await page
  .waitForFunction(
    (scope) => {
      const root = scope ? document.querySelector(scope) : document;
      if (!root) return false;
      const holders = [...(root.matches?.('*') ? [root] : []), ...root.querySelectorAll('*')];
      const holder = holders.find((node) => 'paperShaderMount' in node && node.querySelector('canvas'));
      if (!holder) return false;
      window.__exportHolder = holder;
      return true;
    },
    selector || null,
    { timeout: 20000 },
  )
  .then(() => true)
  .catch(() => false);

if (!found) {
  console.error(`Cannot export: no Paper Shaders surface found${selector ? ` inside ${selector}` : ''} on ${url}.`);
  console.error('The surface must be mounted (WebGL2 available, component rendered) for a frame to be read.');
  await browser.close();
  process.exit(6);
}

// An image-based shader (liquid metal on a mark) prepares its image after mount.
await page.waitForTimeout(1500);
await page.evaluate((ratio) => {
  const mount = window.__exportHolder.paperShaderMount;
  mount.setSpeed(0);
  // Render at `ratio` times the surface's CSS size, up to 4096 × 4096 pixels.
  mount.setMaxPixelCount(4096 * 4096);
  mount.setMinPixelRatio(ratio);
}, scale);

// setFrame renders synchronously while the shader is stopped, so the pixels are read in the same task.
async function frameAt(ms) {
  const dataUrl = await page.evaluate((frame) => {
    const holder = window.__exportHolder;
    holder.paperShaderMount.setFrame(frame);
    return holder.querySelector('canvas').toDataURL('image/png');
  }, ms);
  return Buffer.from(dataUrl.slice(dataUrl.indexOf(',') + 1), 'base64');
}

mkdirSync(out, { recursive: true });
const written = [];

if (still !== null) {
  const path = join(out, `still-${Number(still)}.png`);
  writeFileSync(path, await frameAt(Number(still)));
  written.push(path);
}

let encodeFailed = false;
if (loop) {
  const framesDir = join(out, 'frames');
  rmSync(framesDir, { recursive: true, force: true });
  mkdirSync(framesDir, { recursive: true });
  const count = Math.round(seconds * fps);
  // Visitors see time advance at `speed`; the export steps the same distance per frame.
  const step = (1000 / fps) * speed;
  const forward = Array.from({ length: count }, (_, i) => from + i * step);
  // Out and back: the last frame meets the first, so the loop has no cut.
  const sequence = pingpong ? [...forward, ...forward.slice(1, -1).reverse()] : forward;
  for (const [i, ms] of sequence.entries()) {
    writeFileSync(join(framesDir, `${String(i + 1).padStart(4, '0')}.png`), await frameAt(ms));
  }
  written.push(`${framesDir}/ (${sequence.length} frames, ${fps} fps${pingpong ? ', out and back' : ''})`);

  const input = ['-y', '-loglevel', 'error', '-framerate', String(fps), '-i', join(framesDir, '%04d.png')];
  const even = 'scale=trunc(iw/2)*2:trunc(ih/2)*2';
  const jobs = [
    { path: join(out, 'loop.webm'), args: [...input, '-vf', even, '-c:v', 'libvpx-vp9', '-pix_fmt', 'yuva420p', '-b:v', '0', '-crf', '30'] },
    { path: join(out, 'loop.mp4'), args: [...input, '-filter_complex', `color=c=${background.replace('#', '0x')}:s=16x16[c];[0:v]${even}[v];[c][v]scale2ref[bg][fg];[bg][fg]overlay=shortest=1,format=yuv420p`, '-c:v', 'libx264', '-crf', '18', '-movflags', '+faststart'] },
  ];
  if (spawnSync('ffmpeg', ['-version']).error) {
    written.push('ffmpeg is not on PATH: frames written, no video encoded');
  } else {
    for (const job of jobs) {
      const run = spawnSync('ffmpeg', [...job.args, job.path], { encoding: 'utf8' });
      if (run.status === 0) {
        written.push(job.path);
      } else {
        encodeFailed = true;
        console.error(`ffmpeg failed for ${job.path}: ${String(run.stderr).trim().split('\n').at(-1)}`);
      }
    }
  }
}

await browser.close();
for (const line of written) console.log(line);
process.exit(encodeFailed ? 7 : 0);
