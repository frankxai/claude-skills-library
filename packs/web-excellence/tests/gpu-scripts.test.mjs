// node --test packs/web-excellence/tests/gpu-scripts.test.mjs
// Checks for skills/gpu-surface/probe.mjs and export.mjs. Each probe check is
// tested in both directions: a page that breaks the rule must fail it, and a
// clean page must pass. The browser tests are skipped, by name, where
// Playwright or Chromium is not available; the usage tests always run.

import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { after, before, test } from 'node:test';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const PROBE = join(HERE, '..', 'skills', 'gpu-surface', 'probe.mjs');
const EXPORT = join(HERE, '..', 'skills', 'gpu-surface', 'export.mjs');

// Asynchronous on purpose: the pages are served from this process, and a
// synchronous child would block the server it is asking.
const run = (script, args) =>
  new Promise((resolve) => {
    const child = spawn('node', [script, ...args], { timeout: 120000 });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => (stdout += chunk));
    child.stderr.on('data', (chunk) => (stderr += chunk));
    child.on('close', (status) => resolve({ status, stdout, stderr }));
  });

// A canvas that draws with WebGL. `animate` keeps it changing; `respectReduced` stops it under reduced motion.
const glCanvas = ({ animate, respectReduced }) => `
  <canvas width="200" height="120" style="width:200px;height:120px"></canvas>
  <script>
    (() => {
      const canvas = document.currentScript.previousElementSibling;
      const gl = canvas.getContext('webgl');
      if (!gl) { canvas.remove(); return; }
      const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
      let n = 0;
      const draw = () => {
        gl.clearColor((n % 10) / 10, 0.4, 0.6, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
        n += 1;
        if (${animate} && !(${respectReduced} && reduced)) requestAnimationFrame(draw);
      };
      draw();
    })();
  </script>`;

const PAGES = {
  '/clean': '<h1>No surface here</h1>',
  '/one': `<h1>One surface</h1>${glCanvas({ animate: true, respectReduced: true })}`,
  '/two': `<h1>Two surfaces</h1>${glCanvas({ animate: false, respectReduced: true })}${glCanvas({ animate: false, respectReduced: true })}`,
  '/ignores-reduced': `<h1>Keeps moving</h1>${glCanvas({ animate: true, respectReduced: false })}`,
  '/keeps-canvas-without-gpu': `<canvas width="200" height="120" style="width:200px;height:120px"></canvas><script>document.currentScript.previousElementSibling.getContext('webgl');</script>`,
  '/logs-error': `<h1>Logs</h1><script>console.error('surface failed to start')</script>`,
  // Stands in for a Paper Shaders surface: a holder with a controller and a canvas drawn from the frame number.
  '/paper': `<div id="holder" style="width:100px;height:60px"><canvas width="100" height="60"></canvas></div>
    <script>
      const holder = document.getElementById('holder');
      const canvas = holder.querySelector('canvas');
      const ctx = canvas.getContext('2d');
      holder.paperShaderMount = {
        setSpeed() {}, setMaxPixelCount() {},
        setMinPixelRatio(ratio) { canvas.width = 100 * ratio; canvas.height = 60 * ratio; },
        setFrame(frame) { ctx.fillStyle = 'hsl(' + (frame % 360) + ' 80% 50%)'; ctx.fillRect(0, 0, canvas.width, canvas.height); },
      };
    </script>`,
};

function browserAvailable() {
  const fromCwd = createRequire(join(process.cwd(), 'package.json'));
  for (const name of ['playwright', '@playwright/test']) {
    try {
      fromCwd.resolve(name);
      return true;
    } catch {
      // Try the next name.
    }
  }
  return false;
}

let server;
let base;
let scratch;
let skip = browserAvailable() ? false : 'Playwright is not installed';

before(async () => {
  scratch = mkdtempSync(join(tmpdir(), 'gpu-scripts-'));
  server = createServer((request, response) => {
    const body = PAGES[request.url];
    response.writeHead(body ? 200 : 404, { 'content-type': 'text/html' });
    response.end(body ? `<!doctype html><html><body>${body}</body></html>` : 'not found');
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
  if (!skip) {
    const first = await run(PROBE, ['--url', `${base}/clean`, '--settle', '200']);
    if (first.status === 3 || first.status === 4) skip = `Chromium could not start: ${first.stderr.trim().split('\n')[0]}`;
  }
});

after(() => {
  server?.close();
  rmSync(scratch, { recursive: true, force: true });
});

const probe = async (path) => {
  const result = await run(PROBE, ['--url', `${base}${path}`, '--settle', '400', '--json']);
  const report = result.stdout.trim().startsWith('{') ? JSON.parse(result.stdout) : null;
  const verdict = (name) => report?.checks.find((check) => check.name === name)?.pass;
  return { status: result.status, verdict, report, stderr: result.stderr };
};

test('probe and export print usage and exit 2 without a url', async () => {
  assert.equal((await run(PROBE, [])).status, 2);
  assert.equal((await run(EXPORT, [])).status, 2);
  assert.equal((await run(EXPORT, ['--url', 'http://127.0.0.1:1/'])).status, 2, 'export needs --still or --loop');
  assert.equal((await run(EXPORT, ['--url', 'http://127.0.0.1:1/', '--still', '0', '--background', 'red'])).status, 2, 'background must be #rrggbb');
});

test('probe passes a page with no surface and one with a single well-behaved surface', async (t) => {
  if (skip) return t.skip(skip);
  const clean = await probe('/clean');
  assert.equal(clean.status, 0, clean.stderr);
  const one = await probe('/one');
  assert.equal(one.status, 0, JSON.stringify(one.report?.checks));
  assert.equal(one.report.moving, true, 'the surface is seen moving when motion is allowed');
});

test('probe fails a page with two GPU canvases', async (t) => {
  if (skip) return t.skip(skip);
  const two = await probe('/two');
  assert.equal(two.status, 1);
  assert.equal(two.verdict('one GPU surface at most'), false);
  assert.equal(two.verdict('no console errors'), true);
});

test('probe fails a surface that keeps moving under reduced motion', async (t) => {
  if (skip) return t.skip(skip);
  const moving = await probe('/ignores-reduced');
  assert.equal(moving.status, 1);
  assert.equal(moving.verdict('still under reduced motion'), false);
  assert.equal(moving.verdict('one GPU surface at most'), true);
});

test('probe fails a page that leaves its canvas attached without a GPU', async (t) => {
  if (skip) return t.skip(skip);
  const stuck = await probe('/keeps-canvas-without-gpu');
  assert.equal(stuck.status, 1);
  assert.equal(stuck.verdict('no canvas without a GPU'), false);
  assert.equal(stuck.verdict('one GPU surface at most'), true);
});

test('probe fails a page that logs a console error', async (t) => {
  if (skip) return t.skip(skip);
  const logs = await probe('/logs-error');
  assert.equal(logs.status, 1);
  assert.equal(logs.verdict('no console errors'), false);
});

test('probe reports a page that does not load as exit 5, never as a pass', async (t) => {
  if (skip) return t.skip(skip);
  assert.equal((await run(PROBE, ['--url', 'http://127.0.0.1:1/', '--settle', '200'])).status, 5);
});

test('export writes the same still for the same frame, and the loop starts on it', async (t) => {
  if (skip) return t.skip(skip);
  const a = join(scratch, 'a');
  const b = join(scratch, 'b');
  const first = await run(EXPORT, ['--url', `${base}/paper`, '--still', '120', '--loop', '--from', '120', '--seconds', '0.2', '--fps', '10', '--pingpong', '--out', a]);
  assert.ok(first.status === 0 || first.status === 7, first.stderr);
  assert.equal((await run(EXPORT, ['--url', `${base}/paper`, '--still', '120', '--out', b])).status, 0);
  const still = readFileSync(join(a, 'still-120.png'));
  assert.ok(still.equals(readFileSync(join(b, 'still-120.png'))), 'two runs, one frame number, identical bytes');
  assert.ok(still.equals(readFileSync(join(a, 'frames', '0001.png'))), 'the loop starts on the still');
  assert.ok(!still.equals(readFileSync(join(a, 'frames', '0002.png'))), 'the next frame differs');
  // Two frames out, none back: an out-and-back of two frames has no interior to mirror.
  assert.equal(readdirSync(join(a, 'frames')).length, 2);
});

test('export exits 6 when the page has no Paper surface', async (t) => {
  if (skip) return t.skip(skip);
  const result = await run(EXPORT, ['--url', `${base}/clean`, '--still', '0', '--out', join(scratch, 'none')]);
  assert.equal(result.status, 6);
  assert.match(result.stderr, /no Paper Shaders surface found/);
});
