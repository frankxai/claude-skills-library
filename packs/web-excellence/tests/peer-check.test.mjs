// node --test packs/web-excellence/tests/peer-check.test.mjs
// Offline checks for skills/web-steward/peer-check.mjs: the range parser, the
// drift classes, and the pnpm importer reader. No network, no dependencies.

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { classifyDrift, readPnpmImporter, satisfies } from '../skills/web-steward/peer-check.mjs';

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
