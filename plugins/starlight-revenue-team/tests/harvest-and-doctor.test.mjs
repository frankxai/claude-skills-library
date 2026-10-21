import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { classify, isRepoSlug, isSafePath, harvest } from '../bin/harvest-license.mjs';
import { summarize } from '../bin/team-doctor.mjs';

const CLI = fileURLToPath(new URL('../bin/harvest-license.mjs', import.meta.url));
const fakeGh = (answers) => (args) => {
  const key = args[1];
  return key in answers ? answers[key] : null;
};

test('permissive licences allow adapting; copyleft and unknown do not', () => {
  for (const id of ['MIT', 'Apache-2.0', 'BSD-3-Clause', 'ISC', 'CC0-1.0']) assert.equal(classify(id).copy, true, id);
  for (const id of ['GPL-3.0', 'AGPL-3.0', 'LGPL-2.1', 'MPL-2.0', 'CC-BY-SA-4.0']) assert.equal(classify(id).class, 'copyleft', id);
  for (const id of [null, '', 'NOASSERTION', 'NONE', 'Custom-Thing']) assert.equal(classify(id).copy, false, String(id));
});

test('repo slugs and paths are validated', () => {
  assert.equal(isRepoSlug('owner/repo.name-2'), true);
  for (const bad of ['owner', 'owner/repo; rm -rf /', '../etc/passwd']) assert.equal(isRepoSlug(bad), false, bad);
  assert.equal(isSafePath('skills/video-edit'), true);
  for (const bad of ['../x', 'skills/../secrets', '/abs', 'a b', 'x?ref=evil']) assert.equal(isSafePath(bad), false, bad);
});

test('the verdict is bound to the resolved commit', () => {
  const r = harvest('o/r', undefined, fakeGh({ 'repos/o/r/commits/HEAD': 'abc123', 'repos/o/r/license?ref=abc123': 'MIT' }));
  assert.equal(r.sha, 'abc123');
  assert.equal(r.copy, true);
});

test('no resolvable commit means copy nothing', () => {
  const r = harvest('o/r', undefined, fakeGh({ 'repos/o/r/license?ref=abc123': 'MIT' }));
  assert.equal(r.sha, null);
  assert.equal(r.copy, false);
});

test('a path with its own licence file needs review even under a permissive root', () => {
  const r = harvest('o/r', 'vendor/thing', fakeGh({
    'repos/o/r/commits/HEAD': 'abc123',
    'repos/o/r/license?ref=abc123': 'MIT',
    'repos/o/r/contents/vendor/thing?ref=abc123': 'index.js\nLICENSE.txt',
  }));
  assert.equal(r.class, 'needs-review');
  assert.equal(r.copy, false);
  assert.deepEqual(r.pathLicenceFiles, ['LICENSE.txt']);
});

test('a path that cannot be listed is not approved', () => {
  const r = harvest('o/r', 'missing', fakeGh({ 'repos/o/r/commits/HEAD': 'abc123', 'repos/o/r/license?ref=abc123': 'MIT' }));
  assert.equal(r.copy, false);
});

test('cli rejects bad input with exit 1 before any network call', () => {
  for (const args of [['bad;slug'], ['o/r', '../up']]) {
    let status = 0;
    try {
      execFileSync(process.execPath, [CLI, ...args], { stdio: 'pipe' });
    } catch (err) {
      status = err.status;
    }
    assert.equal(status, 1, args.join(' '));
  }
});

test('doctor names every missing capability and is quiet when all are present', () => {
  const missing = summarize({ providers: [], gh: false, prGate: false, config: null, envRulings: false });
  assert.equal(missing.length, 4);
  assert.match(missing[0], /independent/);
  assert.deepEqual(summarize({ providers: ['codex'], gh: true, prGate: true, config: { rulingsSource: 'x' }, envRulings: false }), []);
});
