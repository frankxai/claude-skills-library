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

const TREE = (paths, truncated = false) => JSON.stringify({ truncated, paths });
const gh = (extra = {}) => fakeGh({ 'repos/o/r/commits/HEAD': 'abc123', 'repos/o/r/license?ref=abc123': 'MIT', ...extra });
const treeKey = 'repos/o/r/git/trees/abc123?recursive=1';

test('a permissive verdict is bound to the resolved commit and a named path', () => {
  const r = harvest('o/r', 'skills/edit', gh({ [treeKey]: TREE(['LICENSE', 'skills/edit/SKILL.md']) }));
  assert.equal(r.sha, 'abc123');
  assert.equal(r.copy, true);
});

test('no resolvable commit means copy nothing', () => {
  const r = harvest('o/r', 'skills/edit', fakeGh({ 'repos/o/r/license?ref=abc123': 'MIT' }));
  assert.equal(r.sha, null);
  assert.equal(r.copy, false);
});

test('without a path a permissive root is not enough', () => {
  assert.equal(harvest('o/r', undefined, gh()).class, 'needs-path');
});

test('licence files above or inside the path need review', () => {
  const above = harvest('o/r', 'vendor/lib/x', gh({ [treeKey]: TREE(['LICENSE', 'vendor/LICENSE', 'vendor/lib/x/a.js']) }));
  assert.equal(above.class, 'needs-review');
  assert.deepEqual(above.pathLicenceFiles, ['vendor/LICENSE']);
  const inside = harvest('o/r', 'skills', gh({ [treeKey]: TREE(['skills/a/SKILL.md', 'skills/b/COPYING']) }));
  assert.deepEqual(inside.pathLicenceFiles, ['skills/b/COPYING']);
  const sibling = harvest('o/r', 'skills/a', gh({ [treeKey]: TREE(['skills/a/SKILL.md', 'skills/b/LICENSE']) }));
  assert.equal(sibling.copy, true);
});

test('a truncated tree, an unreadable tree or a missing path is not approved', () => {
  assert.equal(harvest('o/r', 'skills/a', gh({ [treeKey]: TREE(['skills/a/x'], true) })).copy, false);
  assert.equal(harvest('o/r', 'skills/a', gh()).copy, false);
  assert.equal(harvest('o/r', 'skills/zzz', gh({ [treeKey]: TREE(['skills/a/x']) })).copy, false);
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

test('doctor cli prints its report as JSON', () => {
  let out;
  let status = 0;
  try {
    out = execFileSync(process.execPath, [fileURLToPath(new URL('../bin/team-doctor.mjs', import.meta.url))], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  } catch (err) {
    out = String(err.stdout);
    status = err.status;
  }
  const r = JSON.parse(out.slice(out.indexOf('{')));
  assert.ok(Array.isArray(r.providers) && Array.isArray(r.missing) && Array.isArray(r.notes));
  assert.equal(status, r.providers.length ? 0 : 1);
});

test('doctor names every missing capability and is quiet when all are present', () => {
  const missing = summarize({ providers: [], gh: false, prGate: false, config: null, envRulings: false });
  assert.equal(missing.length, 4);
  assert.match(missing[0], /independent/);
  assert.deepEqual(summarize({ providers: ['codex'], gh: true, prGate: true, config: { rulingsSource: 'x' }, envRulings: false }), []);
});
