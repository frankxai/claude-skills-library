// node --test packs/web-excellence/tests/peer-check.test.mjs
// Offline checks for skills/web-steward/peer-check.mjs: the range parser, the
// drift classes, and the pnpm importer reader. No network, no dependencies.

import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { check, classifyDrift, exitCode, readPnpmImporter, satisfies } from '../skills/web-steward/peer-check.mjs';

test('ranges npm peers actually use', () => {
  const cases = [
    ['18.3.1', '>=19 <19.4', false], // the React 18 + R3F 9 case this script exists for
    ['19.3.0', '>=19 <19.4', true],
    ['19.4.0', '>=19 <19.4', false],
    ['18.3.1', '^18.2.0 || ^19.0.0', true],
    ['19.3.0', '^19', true],
    ['20.0.0', '^19', false],
    ['0.186.1', '>=0.156', true],
    ['0.186.1', '>= 0.156.0', true], // space after the operator
    ['0.0.81', '^0.0.80', false], // ^ on 0.0.x pins the patch
    ['0.2.5', '^0.2.1', true],
    ['0.3.0', '^0.2.1', false],
    ['1.2.9', '~1.2.3', true],
    ['1.3.0', '~1.2.3', false],
    ['2.4.0', '2.x', true],
    ['3.0.0', '2.x', false],
    ['5.0.0', '*', true],
    ['1.5.0', '1.2.0 - 1.6.0', true],
    ['1.7.0', '1.2.0 - 1.6.0', false],
    ['20.0.0', '>19', true],
    ['19.9.9', '>19', false],
    ['19.0.0-rc.1', '>=18', false], // a prerelease never satisfies a plain range
    ['19.0.0-rc.0', '>=19.0.0-rc.1', false], // prerelease identifiers are ordered, not equal
    ['19.0.0-rc.0', '19.0.0-rc.1', false],
    ['19.0.0-rc.2', '>=19.0.0-rc.1', true],
    ['19.0.0-rc.10', '>=19.0.0-rc.9', true], // numeric identifiers compare as numbers
    ['19.0.0-beta.1', '>=19.0.0-rc.0', false], // alphanumeric identifiers compare as strings
    ['19.0.0-rc', '>=19.0.0-rc.0', false], // a shorter identifier set sorts first
  ];
  for (const [v, r, want] of cases) assert.equal(satisfies(v, r), want, `${v} vs "${r}"`);
});

test('a range it cannot parse is reported as unknown, never as a pass', () => {
  assert.equal(satisfies('1.0.0', 'latest'), null);
  assert.equal(satisfies('not-a-version', '^1'), null);
});

test('drift classes treat 0.x minors as breaking', () => {
  assert.equal(classifyDrift('18.3.1', '19.3.1'), 'major');
  assert.equal(classifyDrift('0.185.4', '0.186.0'), '0.x minor (breaking)');
  assert.equal(classifyDrift('0.0.80', '0.0.81'), '0.0.x (breaking)');
  assert.equal(classifyDrift('3.14.2', '3.15.0'), 'minor');
  assert.equal(classifyDrift('1.3.26', '1.3.27'), 'patch');
  assert.equal(classifyDrift('2.0.0', '2.0.0'), 'current');
  assert.equal(classifyDrift('2.1.0', '2.0.0'), 'ahead');
  assert.equal(classifyDrift('19.0.0-rc.0', '19.0.0-rc.1'), 'prerelease');
  assert.equal(classifyDrift('19.0.0-rc.1', '19.0.0-rc.1'), 'current');
});

// A fake registry: `peers` per name@version, `latest` per name; anything else is a 404.
function fakeRegistry({ peers = {}, latest = {} }) {
  return async (url) => {
    const [, name, tag] = decodeURIComponent(new URL(url).pathname).match(/^\/(.+)\/([^/]+)$/);
    const body = tag === 'latest'
      ? latest[name] && { version: latest[name] }
      : peers[`${name}@${tag}`] && { version: tag, peerDependencies: peers[`${name}@${tag}`] };
    return body
      ? { status: 200, ok: true, json: async () => body }
      : { status: 404, ok: false, json: async () => ({}) };
  };
}

async function withRepo(deps, installed, registry, fn) {
  const dir = mkdtempSync(join(tmpdir(), 'peer-check-'));
  const realFetch = globalThis.fetch;
  try {
    writeFileSync(join(dir, 'package.json'), JSON.stringify({ dependencies: deps }));
    for (const [name, version] of Object.entries(installed)) {
      mkdirSync(join(dir, 'node_modules', name), { recursive: true });
      writeFileSync(join(dir, 'node_modules', name, 'package.json'), JSON.stringify({ name, version }));
    }
    globalThis.fetch = fakeRegistry(registry);
    return await fn(dir);
  } finally {
    globalThis.fetch = realFetch;
    rmSync(dir, { recursive: true, force: true });
  }
}

const reactPair = { 'react-dom': '^19.3.1', react: '^18.3.1' };
const registry = { peers: { 'react-dom@19.3.1': { react: '^19.3.1' } }, latest: { 'react-dom': '19.3.1', react: '19.3.1' } };

test('a watched package with no resolved version is not checked, and does not pass', async () => {
  await withRepo(reactPair, {}, registry, async (dir) => {
    const { rows } = await check(dir, ['react-dom', 'react']);
    assert.ok(rows.every((r) => r.unchecked && r.peers.length === 0));
    assert.equal(exitCode(rows), 4);
  });
});

test('a resolved version the registry has no manifest for is not checked', async () => {
  await withRepo(reactPair, { 'react-dom': '19.3.0', react: '18.3.1' }, registry, async (dir) => {
    const { rows } = await check(dir, ['react-dom']);
    assert.match(rows[0].unchecked, /no manifest for react-dom@19\.3\.0/);
    assert.equal(exitCode(rows), 4);
  });
});

test('an unmet peer outranks an unchecked package', async () => {
  await withRepo({ ...reactPair, three: '^0.186.0' }, { 'react-dom': '19.3.1', react: '18.3.1' }, registry, async (dir) => {
    const { rows } = await check(dir, ['react-dom', 'three']);
    assert.equal(rows.find((r) => r.name === 'react-dom').peers[0].ok, false);
    assert.ok(rows.find((r) => r.name === 'three').unchecked);
    assert.equal(exitCode(rows), 1);
  });
});

test('fully checked and satisfied exits 0', async () => {
  await withRepo(reactPair, { 'react-dom': '19.3.1', react: '19.3.1' }, registry, async (dir) => {
    const { rows } = await check(dir, ['react-dom']);
    assert.equal(rows[0].unchecked, null);
    assert.equal(exitCode(rows), 0);
  });
});

test('pnpm importer reader takes the right importer and strips peer suffixes', () => {
  const lock = [
    "lockfileVersion: '9.0'",
    '',
    'importers:',
    '',
    '  .:',
    '    dependencies:',
    "      '@react-three/fiber':",
    '        specifier: ^9.8.1',
    '        version: 9.8.1(@types/react@18.3.28)(react@18.3.1)(three@0.186.1)',
    '      react:',
    '        specifier: ^18.3.1',
    '        version: 18.3.1',
    '      shared:',
    '        specifier: workspace:*',
    '        version: link:packages/shared',
    '    devDependencies:',
    '      typescript:',
    '        specifier: ^5.6.0',
    '        version: 5.6.3',
    '',
    '  apps/web:',
    '    dependencies:',
    '      react:',
    '        specifier: ^19.3.0',
    '        version: 19.3.0',
    '',
    'packages:',
    '',
    '  react@18.3.1:',
    '    resolution: {integrity: sha512-x}',
  ].join('\n');
  assert.deepEqual(readPnpmImporter(lock, '.'), {
    '@react-three/fiber': '9.8.1',
    react: '18.3.1',
    typescript: '5.6.3',
  });
  assert.deepEqual(readPnpmImporter(lock, 'apps/web'), { react: '19.3.0' });
  assert.deepEqual(readPnpmImporter('lockfileVersion: 5.4\n', '.'), {});
});
