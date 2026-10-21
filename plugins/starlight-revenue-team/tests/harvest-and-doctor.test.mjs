import test from 'node:test';
import assert from 'node:assert/strict';
import { classify, isRepoSlug } from '../bin/harvest-license.mjs';
import { summarize } from '../bin/team-doctor.mjs';

test('permissive licences allow adapting with attribution', () => {
  for (const id of ['MIT', 'Apache-2.0', 'BSD-3-Clause', 'ISC', 'CC0-1.0']) {
    const r = classify(id);
    assert.equal(r.class, 'permissive', id);
    assert.equal(r.copy, true, id);
  }
});

test('copyleft licences forbid copying', () => {
  for (const id of ['GPL-3.0', 'AGPL-3.0', 'LGPL-2.1', 'MPL-2.0', 'CC-BY-SA-4.0']) {
    const r = classify(id);
    assert.equal(r.class, 'copyleft', id);
    assert.equal(r.copy, false, id);
  }
});

test('no licence, NOASSERTION or an unknown id means no copying', () => {
  for (const id of [null, '', 'NOASSERTION', 'NONE', 'Custom-Thing']) {
    const r = classify(id);
    assert.equal(r.class, 'none-unknown', String(id));
    assert.equal(r.copy, false, String(id));
  }
});

test('repo slugs are validated before any network call', () => {
  assert.equal(isRepoSlug('owner/repo'), true);
  assert.equal(isRepoSlug('owner/repo.name-2'), true);
  assert.equal(isRepoSlug('owner'), false);
  assert.equal(isRepoSlug('owner/repo; rm -rf /'), false);
  assert.equal(isRepoSlug('../etc/passwd'), false);
});

test('doctor names every missing capability', () => {
  const missing = summarize({ providers: [], gh: false, prGate: false, config: null, envRulings: false });
  assert.equal(missing.length, 4);
  assert.match(missing[0], /independent/);
});

test('doctor is quiet when everything is present', () => {
  const missing = summarize({ providers: ['codex'], gh: true, prGate: true, config: { rulingsSource: 'x' }, envRulings: false });
  assert.deepEqual(missing, []);
});
