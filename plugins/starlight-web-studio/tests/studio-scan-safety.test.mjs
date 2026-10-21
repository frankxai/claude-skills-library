import { test } from 'node:test';
import assert from 'node:assert/strict';
import { analyze, fetchPage, isPublicAddress } from '../bin/studio-scan.mjs';

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
