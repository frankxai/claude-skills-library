import { test } from 'node:test';
import assert from 'node:assert/strict';
import { analyze, parseRobots, isAllowed, visibleText } from '../bin/studio-scan.mjs';

const words = n => Array.from({ length: n }, (_, i) => `word${i}`).join(' ');

const CLEAN = `<!doctype html><html lang="en"><head>
<title>Field notes for independent product builders</title>
<meta name="description" content="Weekly field notes on shipping small software products, with the numbers behind each launch and what we would change.">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#0b0b0c">
<meta property="og:title" content="Field notes"><meta property="og:description" content="Notes"><meta property="og:image" content="https://x.test/og.png">
<link rel="canonical" href="https://x.test/"><link rel="manifest" href="/manifest.webmanifest"><link rel="apple-touch-icon" href="/apple.png">
<script type="application/ld+json">{"@context":"https://schema.org","@graph":[{"@type":"Organization","name":"X"},{"@type":"WebSite","url":"https://x.test"}]}</script>
</head><body><a href="#main">Skip to content</a><main id="main"><h1>Field notes</h1><h2>Latest</h2><p>${words(200)}</p>
<img src="/a.png" alt="Chart of weekly revenue"></main></body></html>`;

const fetched = { robotsTxt: 'User-agent: *\nAllow: /\nSitemap: https://x.test/sitemap.xml', llmsTxt: '# X\n> notes', llmsContentType: 'text/plain', sitemapOk: true, timing: { ttfbMs: 200 } };

test('a clean page scores full marks and has no findings', () => {
  const r = analyze({ url: 'https://x.test/', html: CLEAN, ...fetched });
  assert.deepEqual(r.findings, []);
  assert.equal(r.score, r.max);
  assert.deepEqual(r.facts.jsonLdTypes, ['Organization', 'WebSite']);
});

test('noindex, missing viewport and lorem ipsum are P0', () => {
  const html = CLEAN.replace('<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">', '<meta name="robots" content="noindex">')
    .replace('<h2>Latest</h2>', '<h2>Latest</h2><p>Lorem ipsum dolor</p>');
  const ids = analyze({ url: 'u', html, ...fetched }).findings.filter(f => f.severity === 'P0').map(f => f.id).sort();
  assert.deepEqual(ids, ['noindex', 'placeholder-copy', 'viewport-missing']);
});

test('content shipped at opacity:0 is flagged for answer engines', () => {
  const hidden = '<div style="opacity:0;transform:translateY(48px)">x</div>'.repeat(4);
  const r = analyze({ url: 'u', html: CLEAN.replace('</main>', `${hidden}</main>`), ...fetched });
  assert.ok(r.findings.some(f => f.id === 'ssr-hidden-content'));
});

test('opacity:0.5 is not mistaken for hidden content', () => {
  const faded = '<div style="opacity:0.5">x</div>'.repeat(4);
  const r = analyze({ url: 'u', html: CLEAN.replace('</main>', `${faded}</main>`), ...fetched });
  assert.ok(!r.findings.some(f => f.id === 'ssr-hidden-content'));
});

test('a client-rendered shell is thin to crawlers that skip JavaScript', () => {
  const shell = CLEAN.replace(`<p>${words(200)}</p>`, '<div id="root"></div>');
  assert.ok(analyze({ url: 'u', html: shell, ...fetched }).findings.some(f => f.id === 'thin-server-text'));
});

test('disabling zoom is flagged, maximum-scale=5 is not', () => {
  const noZoom = CLEAN.replace('viewport-fit=cover', 'viewport-fit=cover, maximum-scale=1');
  const zoom5 = CLEAN.replace('viewport-fit=cover', 'viewport-fit=cover, maximum-scale=5');
  assert.ok(analyze({ url: 'u', html: noZoom, ...fetched }).findings.some(f => f.id === 'zoom-disabled'));
  assert.ok(!analyze({ url: 'u', html: zoom5, ...fetched }).findings.some(f => f.id === 'zoom-disabled'));
});

test('robots: a named group beats the wildcard group', () => {
  const robots = parseRobots('User-agent: *\nDisallow: /\n\nUser-agent: OAI-SearchBot\nUser-agent: Claude-SearchBot\nAllow: /\n');
  assert.equal(isAllowed(robots, 'GPTBot', '/'), false);
  assert.equal(isAllowed(robots, 'OAI-SearchBot', '/'), true);
  assert.equal(isAllowed(robots, 'claude-searchbot', '/'), true);
});

test('robots: groups naming the same agent are merged (RFC 9309)', () => {
  const robots = parseRobots('User-agent: OAI-SearchBot\nDisallow: /private\n\nUser-agent: OAI-SearchBot\nDisallow: /\n');
  assert.equal(isAllowed(robots, 'OAI-SearchBot', '/'), false);
});

test('robots: longest match wins, allow wins a tie, wildcards and $ anchor work', () => {
  const robots = parseRobots('User-agent: *\nDisallow: /\nAllow: /blog\nDisallow: /blog/drafts\nDisallow: /*.pdf$\nAllow: /$');
  assert.equal(isAllowed(robots, 'x', '/'), true);
  assert.equal(isAllowed(robots, 'x', '/pricing'), false);
  assert.equal(isAllowed(robots, 'x', '/blog/post'), true);
  assert.equal(isAllowed(robots, 'x', '/blog/drafts/1'), false);
  assert.equal(isAllowed(robots, 'x', '/blog/file.pdf'), false);
  assert.equal(isAllowed(robots, 'x', '/blog/file.pdf?x=1'), true);
  assert.equal(isAllowed(parseRobots('User-agent: *\nDisallow: /a\nAllow: /a'), 'x', '/a'), true);
});

test('robots are evaluated for the scanned page, not only the root', () => {
  const r = analyze({ url: 'https://x.test/pricing', html: CLEAN, ...fetched, robotsTxt: 'User-agent: PerplexityBot\nDisallow: /pricing' });
  assert.deepEqual(r.facts.aiSearchBlocked, ['PerplexityBot']);
});

test('an unreachable robots.txt is reported and treated as disallow-all', () => {
  const r = analyze({ url: 'https://x.test/', html: CLEAN, ...fetched, robotsTxt: null, robotsState: 'unreachable' });
  assert.ok(r.findings.some(f => f.id === 'robots-unreachable'));
  assert.ok(r.facts.aiSearchBlocked.length > 0);
  const missing = analyze({ url: 'https://x.test/', html: CLEAN, ...fetched, robotsTxt: null, robotsState: 'missing' });
  assert.deepEqual(missing.facts.aiSearchBlocked, []);
});

test('an invalid numeric entity does not crash the analysis', () => {
  assert.doesNotThrow(() => analyze({ url: 'u', html: CLEAN.replace('<h2>Latest</h2>', '<h2>Latest &#99999999; &#xD800;</h2>'), ...fetched }));
});

test('tag-like strings inside scripts are not read as tags', () => {
  const html = CLEAN.replace('</body>', `<script>const s='<meta name="robots" content="noindex"><h1>x</h1>'</script></body>`);
  const ids = analyze({ url: 'u', html, ...fetched }).findings.map(f => f.id);
  assert.ok(!ids.includes('noindex'));
  assert.ok(!ids.includes('h1-multiple'));
});

test('robots paths are compared after RFC 9309 normalization', () => {
  const robots = parseRobots('User-agent: *\nDisallow: /private\nDisallow: /café\nAllow: /a%2Fb');
  assert.equal(isAllowed(robots, 'OAI-SearchBot', '/%70rivate'), false);
  assert.equal(isAllowed(robots, 'OAI-SearchBot', '/caf%C3%A9/menu'), false);
  assert.equal(isAllowed(robots, 'OAI-SearchBot', '/a/b'), true);
});

test('a JSON-LD tag written inside a script string is not JSON-LD', () => {
  const html = CLEAN.replace('</body>', `<script>const example = '<script type="application/ld+json">{}';</script></body>`);
  const ids = analyze({ url: 'u', html, ...fetched }).findings.map(f => f.id);
  assert.ok(!ids.includes('jsonld-invalid'));
  assert.ok(!ids.includes('jsonld-no-entity'));
});

test('commented-out tags do not count', () => {
  const html = CLEAN.replace('</head>', '<!-- <meta name="robots" content="noindex"> --></head>')
    .replace('<h2>Latest</h2>', '<h2>Latest</h2><!-- <h1>old</h1> -->');
  const ids = analyze({ url: 'u', html, ...fetched }).findings.map(f => f.id);
  assert.ok(!ids.includes('noindex'));
  assert.ok(!ids.includes('h1-multiple'));
});

test('entities decode as a browser would', () => {
  assert.equal(visibleText('<body><p>&copy; 2026 &#128; &amp;lt; &mdash; &unknown;</p></body>'), '© 2026 € &lt; — &unknown;');
});

test('"<!--" inside a script does not swallow the real tags after it', () => {
  const html = CLEAN.replace('</head>', '<script>const marker="<!--";</script><meta name="robots" content="noindex"><!-- end --></head>');
  assert.ok(analyze({ url: 'u', html, ...fetched }).findings.some(f => f.id === 'noindex'));
});

test('numeric references without a semicolon still decode', () => {
  const html = CLEAN.replace('</head>', '<meta name="robots" content="&#110oindex"></head>');
  assert.ok(analyze({ url: 'u', html, ...fetched }).findings.some(f => f.id === 'noindex'));
});

test('Sitemap lines do not split a robots group', () => {
  const robots = parseRobots('User-agent: OAI-SearchBot\nSitemap: https://a.test/sitemap.xml\nUser-agent: Claude-SearchBot\nDisallow: /');
  assert.equal(isAllowed(robots, 'OAI-SearchBot', '/'), false);
  assert.equal(isAllowed(robots, 'Claude-SearchBot', '/'), false);
  assert.deepEqual(robots.sitemaps, ['https://a.test/sitemap.xml']);
});

test('JSON-LD needs the real type attribute, quoted or not', () => {
  const dataType = CLEAN.replace('type="application/ld+json"', 'data-type="application/ld+json"');
  assert.ok(analyze({ url: 'u', html: dataType, ...fetched }).findings.some(f => f.id === 'jsonld-missing'));
  const unquoted = CLEAN.replace('type="application/ld+json"', 'type=application/ld+json');
  assert.deepEqual(analyze({ url: 'u', html: unquoted, ...fetched }).facts.jsonLdTypes, ['Organization', 'WebSite']);
});

test('noindex in the X-Robots-Tag header, and the "none" directive, are P0', () => {
  const header = analyze({ url: 'u', html: CLEAN, ...fetched, robotsHeader: 'noindex, nofollow' });
  assert.ok(header.findings.some(f => f.id === 'noindex' && /X-Robots-Tag/.test(f.evidence)));
  const scoped = analyze({ url: 'u', html: CLEAN, ...fetched, robotsHeader: 'googlebot: noindex' });
  assert.ok(scoped.findings.some(f => f.id === 'noindex'));
  const none = analyze({ url: 'u', html: CLEAN.replace('</head>', '<meta name="robots" content="none"></head>'), ...fetched });
  assert.ok(none.findings.some(f => f.id === 'noindex'));
  assert.ok(!analyze({ url: 'u', html: CLEAN, ...fetched, robotsHeader: 'noarchive' }).findings.some(f => f.id === 'noindex'));
});

test('preview limits with "none" values are not noindex', () => {
  const meta = analyze({ url: 'u', html: CLEAN.replace('</head>', '<meta name="robots" content="index,follow,max-image-preview:none"></head>'), ...fetched });
  assert.ok(!meta.findings.some(f => f.id === 'noindex'));
  const header = analyze({ url: 'u', html: CLEAN, ...fetched, robotsHeader: 'max-image-preview: none' });
  assert.ok(!header.findings.some(f => f.id === 'noindex'));
  assert.equal(header.score, header.max);
});

test('crawler-specific and repeated robots tags combine', () => {
  const googlebot = analyze({ url: 'u', html: CLEAN.replace('</head>', '<meta name="googlebot" content="noindex"></head>'), ...fetched });
  assert.ok(googlebot.findings.some(f => f.id === 'noindex' && /googlebot/.test(f.evidence)));
  const twice = CLEAN.replace('</head>', '<meta name="robots" content="index,follow"><meta name="robots" content="noindex"></head>');
  assert.ok(analyze({ url: 'u', html: twice, ...fetched }).findings.some(f => f.id === 'noindex'));
});

test('attribute text inside another quoted attribute is not an attribute', () => {
  const fake = CLEAN.replace('type="application/ld+json"', `data-note=' type="application/ld+json"'`);
  assert.ok(analyze({ url: 'u', html: fake, ...fetched }).findings.some(f => f.id === 'jsonld-missing'));
  const gt = CLEAN.replace('type="application/ld+json"', `data-note='>' type="application/ld+json"`);
  assert.deepEqual(analyze({ url: 'u', html: gt, ...fetched }).facts.jsonLdTypes, ['Organization', 'WebSite']);
});

test('opacity:0.0 and opacity: .0 count as hidden', () => {
  const hidden = '<p style="opacity:0.0">a</p><p style="opacity: .0">b</p><p style="opacity:0">c</p>';
  assert.ok(analyze({ url: 'u', html: CLEAN.replace('</main>', `${hidden}</main>`), ...fetched }).findings.some(f => f.id === 'ssr-hidden-content'));
});

test('blocking AI search agents costs points, blocking training crawlers only reports', () => {
  const training = analyze({ url: 'u', html: CLEAN, ...fetched, robotsTxt: 'User-agent: GPTBot\nDisallow: /\nUser-agent: CCBot\nDisallow: /' });
  assert.deepEqual(training.facts.aiTrainingBlocked, ['GPTBot', 'CCBot']);
  assert.equal(training.score, training.max);
  const search = analyze({ url: 'u', html: CLEAN, ...fetched, robotsTxt: 'User-agent: PerplexityBot\nDisallow: /' });
  assert.ok(search.findings.some(f => f.id === 'ai-search-blocked' && f.severity === 'P1'));
});

test('a missing llms.txt is informational, an HTML fallback is a defect', () => {
  const missing = analyze({ url: 'u', html: CLEAN, ...fetched, llmsTxt: null });
  assert.equal(missing.findings.find(f => f.id === 'llms-txt-missing').severity, 'info');
  assert.equal(missing.score, missing.max);
  const fallback = analyze({ url: 'u', html: CLEAN, ...fetched, llmsTxt: '<!DOCTYPE html><html>404</html>', llmsContentType: 'text/html' });
  assert.ok(fallback.findings.some(f => f.id === 'llms-txt-html'));
  assert.equal(fallback.facts.llmsTxt, false);
});

test('invalid JSON-LD is reported, not thrown', () => {
  const html = CLEAN.replace('{"@context"', '{oops "@context"');
  assert.ok(analyze({ url: 'u', html, ...fetched }).findings.some(f => f.id === 'jsonld-invalid'));
});

test('stock vocabulary and shouting are craft findings', () => {
  const html = CLEAN.replace('<h2>Latest</h2>', '<h2>Latest</h2><p>Unleash seamless, revolutionary tools.</p>' + '<span class="text-xs uppercase">x</span>'.repeat(9));
  const ids = analyze({ url: 'u', html, ...fetched }).findings.map(f => f.id);
  assert.ok(ids.includes('stock-vocabulary'));
  assert.ok(ids.includes('all-caps'));
});

test('visible text skips scripts, styles and svg', () => {
  assert.equal(visibleText('<body><script>var a=1</script><style>p{}</style><svg><text>x</text></svg><p>Hello &amp; welcome</p></body>'), 'Hello & welcome');
});
