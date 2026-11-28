import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  parseColor, composite, contrastRatio, isLargeText, clusterEdges, scaleIrregularity,
  gridAdherence, median, judge, score, assertTarget, eyeUrl, toMarkdown, DIMENSIONS,
} from '../bin/studio-eye.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const SITE = join(here, '..', 'examples', 'kade-review', 'pages');

// ------------------------------------------------------------------ pure measures

test('colour parsing handles rgb, rgba, slash alpha and percentages', () => {
  assert.deepEqual(parseColor('rgb(1, 2, 3)'), { r: 1, g: 2, b: 3, a: 1 });
  assert.deepEqual(parseColor('rgba(1,2,3,0.5)'), { r: 1, g: 2, b: 3, a: 0.5 });
  assert.deepEqual(parseColor('rgb(1 2 3 / 25%)'), { r: 1, g: 2, b: 3, a: 0.25 });
  assert.equal(parseColor('transparent'), null);
});

test('contrast matches the WCAG reference values', () => {
  const black = { r: 0, g: 0, b: 0 }, white = { r: 255, g: 255, b: 255 };
  assert.equal(+contrastRatio(black, white).toFixed(1), 21);
  assert.equal(+contrastRatio(white, white).toFixed(1), 1);
  // #777 on white is the classic near-miss: 4.48:1.
  assert.equal(+contrastRatio({ r: 119, g: 119, b: 119 }, white).toFixed(2), 4.48);
});

test('a translucent colour is composited before contrast is measured', () => {
  const half = composite({ r: 0, g: 0, b: 0, a: 0.5 }, { r: 255, g: 255, b: 255, a: 1 });
  assert.ok(Math.abs(half.r - 127.5) < 0.01);
  assert.ok(contrastRatio(half, { r: 255, g: 255, b: 255 }) < 4.5);
});

test('large text follows the WCAG size and weight rule', () => {
  assert.equal(isLargeText(24, 400), true);
  assert.equal(isLargeText(19, 700), true);
  assert.equal(isLargeText(19, 400), false);
  assert.equal(isLargeText(16, 900), false);
});

test('edges within tolerance cluster; strong edges sort first', () => {
  const e = clusterEdges([24, 25, 24, 100, 300, 301, 302, 302], 2);
  assert.deepEqual(e[0], { x: 302 - 1, count: 4 });
  assert.equal(e.length, 3);
});

test('a modular scale is regular; hand-picked sizes are not', () => {
  const modular = scaleIrregularity([16, 20, 25, 31.25, 39.06]);
  assert.ok(modular.cv < 0.05, `cv ${modular.cv}`);
  const picked = scaleIrregularity([13, 15, 17, 19, 22, 72]);
  assert.ok(picked.cv > 0.6, `cv ${picked.cv}`);
  assert.equal(scaleIrregularity([16, 16]).distinct, 1);
});

test('grid adherence counts 4px multiples with subpixel slack', () => {
  assert.equal(gridAdherence([8, 16, 24.4, 32]), 1);
  assert.equal(gridAdherence([13, 27, 8, 16]), 0.5);
  assert.equal(gridAdherence([]), 1);
});

test('median', () => {
  assert.equal(median([3, 1, 2]), 2);
  assert.equal(median([1, 2, 3, 4]), 2.5);
  assert.equal(median([]), null);
});

// ------------------------------------------------------------------ judge rules

function view(over = {}) {
  return {
    text: [], paragraphs: [], edges: [], spacing: [8, 16], hiddenText: [], controls: [],
    landmarks: ['main', 'nav', 'header', 'footer'], h1: 1, lang: 'en', imgNoAlt: [],
    viewportMeta: true, overflowX: 0, overflowers: [],
    fold: { h1Above: true, actions: 1, actionLabels: ['Go'] }, ...over,
  };
}
function measured(over = {}) {
  return {
    views: { phone: view(over.phone), tablet: view(), desktop: view(over.desktop) },
    perf: { lcp: 900, cls: 0, tbt: 0, preFcpBlock: 0, bytes: 1000, ...(over.perf || {}) },
    focus: { tried: 4, invisible: [], ...(over.focus || {}) },
    reduced: { running: 0, hiddenText: 0, ...(over.reduced || {}) },
    dark: { responds: true },
  };
}
const ids = f => f.map(x => `${x.severity}:${x.id}`);

test('a clean page has no findings and scores 25', () => {
  const f = judge(measured());
  assert.deepEqual(f, []);
  assert.equal(score(f).total, 25);
});

test('Core Web Vitals bands map to severities', () => {
  assert.ok(ids(judge(measured({ perf: { lcp: 4200 } }))).includes('P0:lcp-poor'));
  assert.ok(ids(judge(measured({ perf: { lcp: 3000 } }))).includes('P1:lcp-slow'));
  assert.ok(ids(judge(measured({ perf: { cls: 0.3 } }))).includes('P0:cls-poor'));
  assert.ok(ids(judge(measured({ perf: { cls: 0.15 } }))).includes('P1:cls-high'));
  assert.ok(ids(judge(measured({ perf: { tbt: 700 } }))).includes('P1:tbt-high'));
  assert.ok(ids(judge(measured({ perf: { preFcpBlock: 400 } }))).includes('P2:blocked-before-paint'));
  assert.ok(ids(judge(measured({ perf: { lcp: null } }))).includes('P2:lcp-missing'), 'an unmeasured LCP is never a pass');
});

test('contrast on a solid background fails below AA; text over imagery is unverified, not passed', () => {
  const f = judge(measured({ desktop: { text: [
    { sel: 'p', sample: 'grey', size: 16, large: false, contrast: 2.8 },
    { sel: 'h2', sample: 'big', size: 30, large: true, contrast: 3.2 },
    { sel: 'h1', sample: 'over photo', size: 60, large: true, contrast: null },
  ] } }));
  const c = f.find(x => x.id === 'contrast');
  assert.equal(c.severity, 'P1');
  assert.equal(c.evidence.length, 1, 'large text at 3.2:1 passes');
  assert.equal(f.find(x => x.id === 'contrast-unverified').severity, 'info');
});

test('dark scheme contrast is judged on its own, not inherited from the light pass', () => {
  const f = judge({ ...measured(), dark: { responds: true, text: [
    { sel: 'a.btn', sample: 'Request a viewing', size: 16, large: false, contrast: 3.76 },
    { sel: 'p', sample: 'fine', size: 16, large: false, contrast: 12 },
  ] } });
  const d = f.find(x => x.id === 'contrast-dark');
  assert.equal(d.severity, 'P1');
  assert.equal(d.dim, 'access');
  assert.equal(d.evidence.length, 1);
  assert.ok(!f.some(x => x.id === 'contrast'), 'light pass stays clean');
});

test('keyboard focus: none visible is P1, some missing is P2, untested is never a pass', () => {
  assert.ok(ids(judge(measured({ focus: { tried: 3, invisible: ['a', 'b', 'c'] } }))).includes('P1:focus-invisible'));
  assert.ok(ids(judge(measured({ focus: { tried: 3, invisible: ['a'] } }))).includes('P2:focus-invisible'));
  assert.ok(ids(judge(measured({ focus: { tried: 0, invisible: [] } }))).includes('P2:focus-untested'));
});

test('mobile: sideways scroll is P0; tap targets use the 24px floor and 44px aim; inline links are exempt', () => {
  assert.ok(ids(judge(measured({ phone: { overflowX: 120 } }))).includes('P0:overflow-x'));
  const tiny = judge(measured({ phone: { controls: [{ sel: 'a', w: 18, h: 18, visible: true, inline: false, name: 'x' }] } }));
  assert.ok(ids(tiny).includes('P1:target-tiny'));
  const small = judge(measured({ phone: { controls: [{ sel: 'a', w: 40, h: 40, visible: true, inline: false, name: 'x' }] } }));
  assert.ok(ids(small).includes('P2:target-small'));
  const inline = judge(measured({ phone: { controls: [{ sel: 'a', w: 30, h: 18, visible: true, inline: true, name: 'x' }] } }));
  assert.deepEqual(inline, []);
});

test('type: wide measure, too many sizes and tiny phone text', () => {
  assert.ok(ids(judge(measured({ desktop: { paragraphs: [{ sel: 'p', cpl: 140 }] } }))).includes('P1:measure-wide'));
  assert.ok(ids(judge(measured({ desktop: { paragraphs: [{ sel: 'p', cpl: 85 }] } }))).includes('P2:measure'));
  const many = [10, 11, 12, 13, 14, 15, 16, 18, 20, 24].map(size => ({ sel: 'p', sample: '', size, large: false, contrast: 10 }));
  assert.ok(ids(judge(measured({ desktop: { text: many } }))).includes('P2:too-many-sizes'));
  assert.ok(ids(judge(measured({ phone: { text: [{ sel: 'small', size: 11, chars: 40, contrast: 10 }] } }))).includes('P1:text-tiny'));
});

test('composition: first screen, competing actions, hidden content and reduced motion', () => {
  assert.ok(ids(judge(measured({ desktop: { fold: { h1Above: false, actions: 1, actionLabels: [] } } }))).includes('P1:h1-below-fold-1440'));
  assert.ok(ids(judge(measured({ phone: { fold: { h1Above: true, actions: 3, actionLabels: ['a', 'b', 'c'] } } }))).includes('P2:competing-actions-375'));
  assert.ok(ids(judge(measured({ phone: { hiddenText: ['p "x"'] } }))).includes('P1:hidden-at-rest'));
  assert.ok(ids(judge(measured({ reduced: { running: 2, examples: ['bob'] } }))).includes('P1:reduced-motion-ignored'));
  assert.ok(ids(judge(measured({ desktop: { spacing: [13, 27, 37, 9] } }))).includes('P2:off-grid'));
  const lone = [3, 17, 41, 77, 133, 199, 260, 333, 410];
  assert.ok(ids(judge(measured({ desktop: { edges: lone } }))).includes('P2:ragged-edges'));
});

test('scoring floors at zero per dimension and totals over five dimensions', () => {
  const f = Array.from({ length: 4 }, () => ({ dim: 'access', severity: 'P0' }));
  const s = score(f);
  assert.equal(s.access, 0);
  assert.equal(s.total, 20);
  assert.deepEqual(Object.keys(s).filter(k => k !== 'total'), DIMENSIONS);
});

// ------------------------------------------------------------------ report format

test('a committed report names its target as code, not a live link a link checker will follow', async () => {
  const { toMarkdown: scanMd } = await import('../bin/studio-scan.mjs');
  const url = 'http://127.0.0.1:8765/after.html';
  const eye = toMarkdown({ url, scores: score([]), findings: [], shots: [], metrics: {
    perf: {}, measure: { medianCpl: null, paragraphs: 0 }, typeScale: { distinct: 0, cv: 0 }, edges: [], gridAdherence: 1,
    fold: { phone: { h1Above: true, actions: 1 }, desktop: { h1Above: true, actions: 1 } }, focus: { tried: 0, invisible: [] }, reduced: {}, dark: {} } });
  const scan = scanMd({ url, score: 30, max: 30, scannedAt: 'now', status: 200, facts: { htmlKB: 1, ttfbMs: 1, words: 1 },
    scores: { search: 5, answer: 5, mobile: 5, access: 5, craft: 5, speed: 5 }, findings: [] });
  for (const md of [eye, scan]) {
    const head = md.split('\n')[0];
    assert.ok(head.includes('`' + url + '`'), head);
    assert.equal(head.replaceAll('`' + url + '`', '').includes('http'), false, head);
  }
});

// ------------------------------------------------------------------ target safety

test('private, loopback and file targets need --allow-private; other schemes are refused', async () => {
  await assert.rejects(assertTarget('http://127.0.0.1:8080/'), /private/);
  await assert.rejects(assertTarget('http://[::1]/'), /private/);
  await assert.rejects(assertTarget('http://10.1.2.3/'), /private/);
  await assert.rejects(assertTarget('file:///etc/hosts'), /allow-private/);
  await assert.rejects(assertTarget('ftp://example.com/'), /protocol/);
  await assert.rejects(assertTarget('not a url'), /not a URL/);
  assert.ok(await assertTarget('http://127.0.0.1:8080/', { allowPrivate: true }));
});

// ------------------------------------------------------------------ integration (real Chromium)

function havePlaywright() {
  for (const base of [join(process.cwd(), 'package.json'), import.meta.url]) {
    try { const pw = createRequire(base)('playwright'); return !!pw.chromium; } catch {}
  }
  return false;
}
const browserSkip = havePlaywright() ? false : 'playwright is not installed here; the browser layer cannot be exercised';

function serve() {
  const types = { '.html': 'text/html; charset=utf-8', '.svg': 'image/svg+xml' };
  const srv = createServer((req, res) => {
    const name = new URL(req.url, 'http://x').pathname.replace(/^\/+/, '') || 'after.html';
    if (!/^[a-z]+\.(html|svg)$/.test(name)) { res.writeHead(404).end(); return; }
    try { res.writeHead(200, { 'content-type': types[extname(name)] }).end(readFileSync(join(SITE, name))); }
    catch { res.writeHead(404).end(); }
  });
  return new Promise(r => srv.listen(0, '127.0.0.1', () => r(srv)));
}

test('the first draft is caught on every planted defect', { skip: browserSkip, timeout: 120000 }, async () => {
  const srv = await serve();
  try {
    const r = await eyeUrl(`http://127.0.0.1:${srv.address().port}/before.html`, { allowPrivate: true, throttle: false });
    const got = new Set(r.findings.map(f => f.id));
    for (const id of ['overflow-x', 'contrast', 'no-name', 'lang', 'img-alt', 'focus-invisible', 'target-tiny',
      'measure-wide', 'text-tiny', 'hidden-at-rest', 'reduced-motion-ignored', 'h1-count', 'competing-actions-375',
      'no-action-1440', 'off-grid']) {
      assert.ok(got.has(id), `expected ${id}; got ${[...got].join(', ')}`);
    }
    // The 350 ms loop sits at the end of <body>. Chromium may paint before or after it runs, so the
    // same blocked main thread lands either before first paint or inside TBT; either must be caught.
    assert.ok(['blocked-before-paint', 'tbt-raised', 'tbt-high'].some(id => got.has(id)), `main-thread block missed; got ${[...got].join(', ')}`);
    assert.ok(r.findings.some(f => f.severity === 'P0'));
    assert.ok(r.scores.total < 12, `first draft scored ${r.scores.total}`);
    assert.match(toMarkdown(r), /overflow-x/);
  } finally { srv.close(); }
});

// Five navigations in a fixed order: phone, tablet, desktop, reduced motion, dark scheme.
// A server that fails only the nth page request proves every one of them fails closed.
function serveFailingAt(n, mode) {
  let pageHits = 0;
  const srv = createServer((req, res) => {
    const name = new URL(req.url, 'http://x').pathname.replace(/^\/+/, '');
    if (name === 'hero.svg') { res.writeHead(200, { 'content-type': 'image/svg+xml' }).end(readFileSync(join(SITE, 'hero.svg'))); return; }
    pageHits += 1;
    if (pageHits === n && mode === 'hang') return; // never answers
    if (pageHits === n) { res.writeHead(503, { 'content-type': 'text/html' }).end('<h1>Service unavailable</h1>'); return; }
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }).end(readFileSync(join(SITE, 'after.html')));
  });
  return new Promise(r => srv.listen(0, '127.0.0.1', () => r(srv)));
}

for (const [n, where] of [[1, 'phone'], [2, 'tablet'], [3, 'desktop'], [4, 'reduced motion'], [5, 'dark scheme']]) {
  test(`a 503 on the ${where} load makes the layer not run, never a score`, { skip: browserSkip, timeout: 120000 }, async () => {
    const srv = await serveFailingAt(n, '503');
    try {
      await assert.rejects(
        eyeUrl(`http://127.0.0.1:${srv.address().port}/after.html`, { allowPrivate: true, throttle: false }),
        e => e.notRun === true && /503/.test(e.message),
      );
    } finally { srv.close(); srv.closeAllConnections?.(); }
  });
}

test('a load that never answers makes the layer not run', { skip: browserSkip, timeout: 120000 }, async () => {
  const srv = await serveFailingAt(4, 'hang');
  try {
    await assert.rejects(
      eyeUrl(`http://127.0.0.1:${srv.address().port}/after.html`, { allowPrivate: true, throttle: false, navTimeoutMs: 2000 }),
      e => e.notRun === true && /reduced motion/.test(e.message),
    );
  } finally { srv.close(); srv.closeAllConnections?.(); }
});

test('the revision clears every P0 and P1 and answers dark mode', { skip: browserSkip, timeout: 120000 }, async () => {
  const srv = await serve();
  try {
    const r = await eyeUrl(`http://127.0.0.1:${srv.address().port}/after.html`, { allowPrivate: true, throttle: false });
    const blocking = r.findings.filter(f => f.severity === 'P0' || f.severity === 'P1');
    assert.deepEqual(blocking.map(f => f.id), []);
    assert.equal(r.metrics.dark.responds, true);
    assert.equal(r.metrics.reduced.running, 0);
    assert.ok(r.metrics.focus.tried > 0 && r.metrics.focus.invisible.length === 0);
    assert.ok(r.scores.total >= 23, `revision scored ${r.scores.total}`);
    // The floor plan's SVG labels are artwork: they must not register as ragged layout edges.
    assert.ok(!r.findings.some(f => f.id === 'ragged-edges'), 'svg text counted as layout');
  } finally { srv.close(); }
});
