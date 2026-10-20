/**
 * Regression tests for scripts/absorb.mjs — the four inbound gates.
 *
 * The gates are the only thing standing between an external artifact and this
 * library, and until these existed nothing proved they refuse. Two of them
 * provably did not: gate 4 checked the "Built on SIP" footer and never ran the
 * format validator ABSORPTION.md promises, and gate 3 announced
 * "distinctness unchecked" for a short artifact and then passed it. Both have a
 * named test below.
 *
 * Each test runs the real script in a throwaway repo: scripts/ copied verbatim,
 * so REPO resolution, the python validator hand-off and every write path are the
 * production ones. Nothing here touches the checkout.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, copyFileSync, existsSync, readFileSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const SCRIPTS = dirname(dirname(fileURLToPath(import.meta.url)));
const COPIED = ['absorb.mjs', 'validate_skills.py', '_skillmeta.py'];

const VALID = (name, filler) => `---
name: ${name}
description: A staged artifact used by the absorb gate tests.
---

# ${name}

${filler}

Built on SIP.
`;

/** Enough distinct prose to clear MIN_SHINGLES at the 5-word width. */
const LONG = Array.from({ length: 40 }, (_, i) => `step ${i} does a distinct thing worth writing down here`).join('\n');

function fixture({ staged = VALID('absorb-probe', LONG), existing = {} } = {}) {
  const repo = mkdtempSync(join(tmpdir(), 'absorb-'));
  mkdirSync(join(repo, 'scripts'), { recursive: true });
  for (const f of COPIED) copyFileSync(join(SCRIPTS, f), join(repo, 'scripts', f));
  mkdirSync(join(repo, 'free-skills'), { recursive: true });
  for (const [name, text] of Object.entries(existing)) {
    mkdirSync(join(repo, 'free-skills', name), { recursive: true });
    writeFileSync(join(repo, 'free-skills', name, 'SKILL.md'), text);
  }
  if (staged !== null) {
    const dir = join(repo, 'absorbed', '_staging', 'intelligence', 'probe');
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'SKILL.md'), staged);
  }
  return repo;
}

const OK = {
  as: 'intelligence/probe',
  from: 'https://github.com/someone/their-repo',
  commit: 'a'.repeat(40),
  'upstream-path': 'skills/theirs/SKILL.md',
  license: 'MIT',
  changed: 'Dropped their retry loop; kept the three-phase verification sequence.',
};

function absorb(repo, over = {}) {
  const flags = Object.entries({ ...OK, ...over })
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => `--${k}=${v}`);
  const r = spawnSync(process.execPath, [join(repo, 'scripts', 'absorb.mjs'), ...flags], { encoding: 'utf8' });
  return { code: r.status, out: `${r.stdout}${r.stderr}` };
}

/** The verdict line for one gate, e.g. "pass" or "REFUSE". */
const verdict = (out, n) => (out.match(new RegExp(`gate ${n}\\s+\\S+\\s+(pass|REFUSE)`)) || [])[1];
const landed = (repo) => existsSync(join(repo, 'absorbed', 'intelligence', 'probe', 'SKILL.md'));

function withRepo(opts, fn) {
  const repo = fixture(opts);
  try { fn(repo); } finally { rmSync(repo, { recursive: true, force: true }); }
}

test('a complete, distinct, attested artifact lands with provenance and a ledger row', () => {
  withRepo({}, (repo) => {
    const { code, out } = absorb(repo);
    assert.equal(code, 0, out);
    for (const n of [1, 2, 3, 4]) assert.equal(verdict(out, n), 'pass', `gate ${n}\n${out}`);
    assert.ok(landed(repo), 'skill directory was not copied');
    const prov = JSON.parse(readFileSync(join(repo, 'absorbed', 'intelligence', 'probe', 'PROVENANCE.json'), 'utf8'));
    assert.equal(prov.source.commit, OK.commit);
    assert.equal(prov.license, 'MIT');
    assert.match(readFileSync(join(repo, 'ABSORBED.md'), 'utf8'), /intelligence\/probe/);
  });
});

test('gate 1 refuses copyleft, non-commercial, and unlisted licenses', () => {
  for (const license of ['GPL-3.0', 'AGPL-3.0', 'LGPL-2.1', 'MPL-2.0', 'CC-BY-NC-4.0', 'SEE LICENSE IN FILE', 'UNLICENSED']) {
    withRepo({}, (repo) => {
      const { code, out } = absorb(repo, { license });
      assert.equal(code, 1, `${license} was not refused\n${out}`);
      assert.equal(verdict(out, 1), 'REFUSE', `${license}\n${out}`);
      assert.ok(!landed(repo), `${license} landed anyway`);
    });
  }
});

test('gate 2 refuses a short SHA, a non-GitHub source, and a lazy change statement', () => {
  for (const over of [
    { commit: 'abc1234' },
    { commit: 'main' },
    { from: 'https://gitlab.com/someone/their-repo' },
    { changed: 'reformatted' },
    { changed: 'copied' },
    { changed: 'tidied up a bit' },
  ]) {
    withRepo({}, (repo) => {
      const { code, out } = absorb(repo, over);
      assert.equal(code, 1, `${JSON.stringify(over)} was not refused\n${out}`);
      assert.equal(verdict(out, 2), 'REFUSE', `${JSON.stringify(over)}\n${out}`);
      assert.ok(!landed(repo), 'landed anyway');
    });
  }
});

test('gate 3 refuses an artifact that is >=85% identical to an existing skill', () => {
  const dup = VALID('absorb-probe', LONG);
  withRepo({ staged: dup, existing: { 'already-here': dup } }, (repo) => {
    const { code, out } = absorb(repo);
    assert.equal(code, 1, out);
    assert.equal(verdict(out, 3), 'REFUSE', out);
    assert.match(out, /identical to free-skills\/already-here/);
    assert.ok(!landed(repo), 'duplicate landed');
  });
});

test('gate 3 refuses an artifact too short to compare, instead of passing it unchecked', () => {
  // Regression: this returned "distinctness unchecked" and PASSED, so a near
  // duplicate short enough to dodge the shingle floor could land unexamined.
  const tiny = '---\nname: absorb-probe\ndescription: Tiny.\n---\n\nUse it well.\n\nBuilt on SIP.\n';
  withRepo({ staged: tiny }, (repo) => {
    const { code, out } = absorb(repo);
    assert.equal(code, 1, `a 3-word skill was allowed through\n${out}`);
    assert.equal(verdict(out, 3), 'REFUSE', out);
    assert.match(out, /too small to compare/);
    assert.doesNotMatch(out, /unchecked/);
    assert.ok(!landed(repo), 'unchecked artifact landed');
  });
});

// A body sized to land between the two widths: 22 words gives 18 five-word
// shingles (under MIN_SHINGLES, so the wide window is not usable) and 20
// three-word shingles (just enough to compare). This is the band the old code
// skipped outright. Changing the word count moves the fixture out of the band.
const BAND = (n, head) =>
  `---\nname: ${n}\ndescription: Short but real.\n---\n\n${head} alpha bravo charlie delta echo foxtrot golf hotel india juliet kilo lima mike november oscar papa quebec romeo\n\nBuilt on SIP.\n`;

test('gate 3 compares a short-but-real artifact on the narrow window and clears it', () => {
  // Regression: 18 five-word shingles fell under the old floor of 40, so this
  // artifact was passed with "distinctness unchecked" — cleared without a
  // comparison ever running. It must now be compared and shown distinct.
  withRepo({ staged: BAND('absorb-probe', 'unmistakably'), existing: { 'unrelated': VALID('unrelated', LONG) } }, (repo) => {
    const { code, out } = absorb(repo);
    assert.equal(verdict(out, 3), 'pass', out);
    assert.match(out, /compared on 3-word shingles/, `the narrow window did not run\n${out}`);
    assert.doesNotMatch(out, /unchecked/, `gate 3 still reports an unchecked pass\n${out}`);
    assert.equal(code, 0, out);
    assert.ok(landed(repo), 'a distinct short artifact should land');
  });
});

test('gate 3 catches a duplicate that only the narrow window can see', () => {
  withRepo({ staged: BAND('absorb-probe', 'identical'), existing: { 'near-twin': BAND('near-twin', 'identical') } }, (repo) => {
    const { code, out } = absorb(repo);
    assert.equal(verdict(out, 3), 'REFUSE', out);
    assert.match(out, /identical to free-skills\/near-twin/, out);
    assert.equal(code, 1, `a short duplicate was landed\n${out}`);
    assert.ok(!landed(repo), 'short duplicate landed');
  });
});

test('gate 4 refuses a missing attestation footer', () => {
  withRepo({ staged: VALID('absorb-probe', LONG).replace('Built on SIP.', '') }, (repo) => {
    const { code, out } = absorb(repo);
    assert.equal(code, 1, out);
    assert.equal(verdict(out, 4), 'REFUSE', out);
    assert.match(out, /Built on SIP/);
    assert.ok(!landed(repo), 'unattested artifact landed');
  });
});

test('gate 4 refuses a malformed SKILL.md that carries the footer', () => {
  // Regression: gate 4 was a 'Built on SIP' substring check only, so each of
  // these reported "all gates pass" and landed, despite ABSORPTION.md gate 4
  // promising the format validator.
  const malformed = {
    'no frontmatter': `# absorb probe\n\n${LONG}\n\nBuilt on SIP.\n`,
    'missing name': `---\ndescription: No name key at all.\n---\n\n${LONG}\n\nBuilt on SIP.\n`,
    'missing description': `---\nname: absorb-probe\n---\n\n${LONG}\n\nBuilt on SIP.\n`,
    'name not kebab-case': `---\nname: Absorb_Probe\ndescription: Bad name.\n---\n\n${LONG}\n\nBuilt on SIP.\n`,
    'unterminated frontmatter': `---\nname: absorb-probe\ndescription: Never closed.\n\n${LONG}\n\nBuilt on SIP.\n`,
  };
  for (const [label, staged] of Object.entries(malformed)) {
    withRepo({ staged }, (repo) => {
      const { code, out } = absorb(repo);
      assert.equal(code, 1, `${label} was not refused\n${out}`);
      assert.equal(verdict(out, 4), 'REFUSE', `${label}\n${out}`);
      assert.match(out, /format validator/, `${label}: gate 4 did not name the validator\n${out}`);
      assert.ok(!landed(repo), `${label} landed anyway`);
    });
  }
});

test('gate 4 fails closed when the format validator cannot be run', () => {
  withRepo({}, (repo) => {
    rmSync(join(repo, 'scripts', 'validate_skills.py'));
    const { code, out } = absorb(repo);
    assert.equal(code, 1, `a missing validator waved the artifact through\n${out}`);
    assert.equal(verdict(out, 4), 'REFUSE', out);
    assert.ok(!landed(repo), 'landed with no format check');
  });
});

test('a refusal writes nothing at all', () => {
  withRepo({}, (repo) => {
    absorb(repo, { license: 'GPL-3.0' });
    assert.ok(!existsSync(join(repo, 'absorbed', 'intelligence', 'probe')), 'destination directory created on refusal');
    assert.ok(!existsSync(join(repo, 'ABSORBED.md')), 'ledger written on refusal');
  });
});

test('--dry-run reports the verdicts and writes nothing', () => {
  withRepo({}, (repo) => {
    const r = spawnSync(process.execPath, [
      join(repo, 'scripts', 'absorb.mjs'),
      ...Object.entries(OK).map(([k, v]) => `--${k}=${v}`),
      '--dry-run',
    ], { encoding: 'utf8' });
    assert.equal(r.status, 0, r.stdout + r.stderr);
    assert.match(r.stdout, /dry run, nothing written/);
    assert.ok(!landed(repo), 'dry run landed the artifact');
  });
});

test('nothing staged is refused before any gate is reported', () => {
  withRepo({ staged: null }, (repo) => {
    const { code, out } = absorb(repo);
    assert.equal(code, 2, out);
    assert.match(out, /nothing staged/);
  });
});

test('--as must be <domain>/<name> in kebab-case', () => {
  for (const as of ['probe', 'Intelligence/Probe', 'intelligence/probe/extra', 'intelligence/pro_be']) {
    withRepo({}, (repo) => {
      const { code, out } = absorb(repo, { as });
      assert.equal(code, 2, `${as} was accepted\n${out}`);
    });
  }
});
