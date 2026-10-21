import { test } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import zlib from 'node:zlib';
import { analyze, fetchPage, isPublicAddress, pinnedFetch } from '../bin/studio-scan.mjs';

const words = n => Array.from({ length: n }, (_, i) => `word${i}`).join(' ');
const page = (body, head = '') => `<!doctype html><html lang="en"><head><title>Field notes for independent builders</title>
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">${head}</head><body>${body}</body></html>`;
const ids = html => analyze({ url: 'https://x.test/', html, robotsTxt: '', sitemapOk: true }).findings.map(f => f.id);

// A fetch stub that records every URL and answers from a table; anything unlisted is a 404.
function stubFetch(table) {
  const calls = [];
  const fn = async (url) => {
    calls.push(String(url));
    const hit = table[String(url)] ?? { status: 404, body: '' };
    return new Response(hit.body ?? '', { status: hit.status ?? 200, headers: hit.headers ?? { 'content-type': 'text/html' } });
  };
  return { fn, calls };
}
const publicLookup = async () => [{ address: '93.184.216.34', family: 4 }];

test('isPublicAddress refuses loopback, private, link-local, reserved and mapped forms', () => {
  for (const ip of ['127.0.0.1', '10.1.2.3', '172.16.0.1', '172.31.255.255', '192.168.1.1', '169.254.169.254', '100.64.0.1',
    '0.0.0.0', '224.0.0.1', '240.0.0.1', '198.18.0.1', '::1', '::', 'fe80::1', 'fc00::1', 'fd12::1', 'ff02::1', '::ffff:127.0.0.1', '::ffff:7f00:1']) {
    assert.equal(isPublicAddress(ip), false, ip);
  }
  for (const ip of ['93.184.216.34', '1.1.1.1', '172.32.0.1', '2606:4700::1111']) assert.equal(isPublicAddress(ip), true, ip);
});

test('a robots.txt Sitemap pointing at localhost is never fetched', async () => {
  const { fn, calls } = stubFetch({
    'https://site.test/': { body: page(`<p>${words(10)}</p>`) },
    'https://site.test/robots.txt': { body: 'User-agent: *\nAllow: /\nSitemap: http://127.0.0.1:8080/admin/run', headers: { 'content-type': 'text/plain' } },
  });
  const r = await fetchPage('https://site.test/', { fetch: fn, lookup: publicLookup });
  assert.ok(!calls.some(u => u.includes('127.0.0.1')), calls.join(' '));
  assert.equal(r.sitemapOk, false);
});

test('a redirect into a private network is refused, not followed', async () => {
  const { fn, calls } = stubFetch({
    'https://site.test/': { status: 302, headers: { location: 'http://10.0.0.5/internal' } },
  });
  await assert.rejects(fetchPage('https://site.test/', { fetch: fn, lookup: publicLookup }), /refused/);
  assert.ok(!calls.some(u => u.includes('10.0.0.5')));
});

test('a public redirect is followed hop by hop and the final URL is reported', async () => {
  const { fn } = stubFetch({
    'https://site.test/': { status: 301, headers: { location: '/en/' } },
    'https://site.test/en/': { body: page(`<p>${words(10)}</p>`) },
  });
  const r = await fetchPage('https://site.test/', { fetch: fn, lookup: publicLookup });
  assert.equal(r.url, 'https://site.test/en/');
  assert.equal(r.status, 200);
});

test('a hostname that resolves to a private address is refused', async () => {
  const { fn, calls } = stubFetch({});
  const lookup = async () => [{ address: '192.168.1.20', family: 4 }];
  await assert.rejects(fetchPage('https://intranet.test/', { fetch: fn, lookup }), /refused/);
  assert.equal(calls.length, 0);
});

test('a private target needs explicit permission', async () => {
  const { fn } = stubFetch({ 'http://localhost:3000/': { body: page(`<p>${words(10)}</p>`) } });
  const lookup = async () => [{ address: '127.0.0.1', family: 4 }];
  await assert.rejects(fetchPage('http://localhost:3000/', { fetch: fn, lookup }), /refused.*--allow-private/);
  const r = await fetchPage('http://localhost:3000/', { fetch: fn, lookup, allowPrivate: true });
  assert.equal(r.status, 200);
});

test('only http and https are fetched', async () => {
  await assert.rejects(fetchPage('file:///etc/passwd', { fetch: stubFetch({}).fn, lookup: publicLookup }), /refused/);
});

test('an empty link with only data-aria-label or data-title has no accessible name', () => {
  assert.ok(ids(page('<a href="#main">Skip</a><main id="main"><a href="/x" data-aria-label="tracking"></a><a href="/y" data-title="tip"></a></main>')).includes('link-no-name'));
  assert.ok(!ids(page('<a href="#main">Skip</a><main id="main"><a href="/x" aria-label="Home"></a></main>')).includes('link-no-name'));
});

test('a #main link at the bottom of the page is not a skip link', () => {
  assert.ok(ids(page('<nav><a href="/a">A</a></nav><main id="main"><p>x</p></main><a href="#main">Back to main</a>')).includes('skip-link-missing'));
  assert.ok(ids(page('<a href="#main">Skip</a><main><p>no target id</p></main>')).includes('skip-link-missing'));
  assert.ok(ids(page('<link href="#main"><main id="main"><a href="/a">A</a></main>')).includes('skip-link-missing'));
  assert.ok(!ids(page('<a class="skip" href="#content">Skip</a><nav><a href="/a">A</a></nav><div id="content"></div>')).includes('skip-link-missing'));
});

test('maximum-scale=1.00 disables zoom like 1 does; 1.5 does not', () => {
  const vp = v => page('<p>x</p>').replace('viewport-fit=cover', `viewport-fit=cover, maximum-scale=${v}`);
  assert.ok(ids(vp('1.00')).includes('zoom-disabled'));
  assert.ok(ids(vp('1.000')).includes('zoom-disabled'));
  assert.ok(ids(vp('0.5')).includes('zoom-disabled'));
  assert.ok(!ids(vp('1.5')).includes('zoom-disabled'));
});

test('a publisher nested inside an Article counts as the publishing entity', () => {
  const ld = '<script type="application/ld+json">{"@type":"Article","publisher":{"@type":"Organization","name":"X"}}</script>';
  assert.ok(!ids(page('<p>x</p>', ld)).includes('jsonld-no-entity'));
  const bare = '<script type="application/ld+json">{"@type":"Article","headline":"x"}</script>';
  assert.ok(ids(page('<p>x</p>', bare)).includes('jsonld-no-entity'));
});

// --- connection pinning (DNS rebinding) ---------------------------------------------------------


async function localServer(handler) {
  const server = http.createServer(handler);
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  return { server, port: server.address().port };
}

test('the connection goes to the checked address and never re-resolves the name', async () => {
  const hosts = [];
  const { server, port } = await localServer((req, res) => {
    hosts.push(req.headers.host);
    res.writeHead(req.url === '/' ? 200 : 404, { 'content-type': 'text/html' });
    res.end(req.url === '/' ? '<html lang="en"><title>pinned</title><body>ok</body></html>' : '');
  });
  let lookups = 0;
  // ".test" never resolves through system DNS, so success proves only the checked address was used.
  const lookup = async () => { lookups += 1; return [{ address: '127.0.0.1', family: 4 }]; };
  try {
    const r = await fetchPage(`http://rebind.test:${port}/`, { lookup, allowPrivate: true });
    assert.equal(r.status, 200);
    assert.match(r.html, /pinned/);
    assert.ok(hosts.every(h => h === `rebind.test:${port}`), hosts.join(' '));
    assert.equal(lookups, hosts.length, 'one lookup per request, none inside the connection');
  } finally { server.close(); }
});

test('a pinned request decodes gzip and reports joined repeated headers', async () => {
  const { server, port } = await localServer((req, res) => {
    res.writeHead(200, { 'content-encoding': 'gzip', 'x-robots-tag': ['noindex', 'nofollow'] });
    res.end(zlib.gzipSync('hello gzip'));
  });
  try {
    const res = await pinnedFetch(`http://anything.test:${port}/`, { pin: { address: '127.0.0.1', family: 4 } });
    assert.equal(await res.text(), 'hello gzip');
    assert.equal(res.headers.get('X-Robots-Tag'), 'noindex, nofollow');
  } finally { server.close(); }
});

test('an interrupted gzip, deflate or brotli body rejects instead of hanging', async () => {
  for (const encoding of ['gzip', 'deflate', 'br']) {
    const { server, port } = await localServer((req, res) => {
      res.writeHead(200, { 'content-encoding': encoding });
      res.write(Buffer.from([0x1f, 0x8b, 0x08, 0x00]));
      setTimeout(() => res.destroy(), 20);
    });
    try {
      const started = Date.now();
      await assert.rejects(pinnedFetch(`http://x.test:${port}/`, { pin: { address: '127.0.0.1', family: 4 }, timeoutMs: 2000 }));
      assert.ok(Date.now() - started < 1500, `${encoding} took ${Date.now() - started} ms`);
    } finally { server.close(); }
  }
});

test('a body that trickles past the deadline is cut off', async () => {
  const { server, port } = await localServer((req, res) => {
    res.writeHead(200, { 'content-type': 'text/html' });
    const tick = setInterval(() => res.write('.'), 30);
    res.on('close', () => clearInterval(tick));
  });
  try {
    const started = Date.now();
    await assert.rejects(pinnedFetch(`http://x.test:${port}/`, { pin: { address: '127.0.0.1', family: 4 }, timeoutMs: 300 }), /timed out/);
    assert.ok(Date.now() - started < 1500);
  } finally { server.close(); }
});
