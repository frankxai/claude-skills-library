// validate_skills.py says it checks the Agent Skills spec. These cases are the
// spec rules it must enforce (https://agentskills.io/specification): a skill
// that passes here must also pass `skills-ref validate` on every other client.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const VALIDATOR = join(ROOT, 'scripts', 'validate_skills.py');

function skillTree(dir, frontmatter) {
  const root = mkdtempSync(join(tmpdir(), 'validate-skills-'));
  mkdirSync(join(root, dir), { recursive: true });
  writeFileSync(join(root, dir, 'SKILL.md'), `---\n${frontmatter}\n---\n\nBody.\n`);
  return root;
}

function validate(root) {
  const r = spawnSync('python3', [VALIDATOR, root], { encoding: 'utf8' });
  return { code: r.status, out: `${r.stdout}${r.stderr}` };
}

function check(dir, frontmatter, fn) {
  const root = skillTree(dir, frontmatter);
  try {
    fn(validate(root));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

const DESC = 'description: Does one thing. Use when that thing is needed.';

test('a spec-valid skill with every optional field passes', () => {
  check('pdf-tools', [
    'name: pdf-tools', DESC, 'license: Apache-2.0',
    'compatibility: Needs Python 3.11 and network access.',
    'metadata:', '  author: example', '  version: "1.0"',
    'allowed-tools: Bash(python3:*) Read',
  ].join('\n'), ({ code, out }) => {
    assert.equal(code, 0, out);
    assert.doesNotMatch(out, /not in the Agent Skills spec/);
  });
});

test('name must match the parent directory', () => {
  check('pdf-tools', `name: pdf-toolkit\n${DESC}`, ({ code, out }) => {
    assert.equal(code, 1, out);
    assert.match(out, /must match its directory/);
  });
});

test('name must not end with a hyphen', () => {
  check('pdf-', `name: pdf-\n${DESC}`, ({ code, out }) => {
    assert.equal(code, 1, out);
    assert.match(out, /hyphen/);
  });
});

test('name must not contain consecutive hyphens', () => {
  check('pdf--tools', `name: pdf--tools\n${DESC}`, ({ code, out }) => {
    assert.equal(code, 1, out);
    assert.match(out, /consecutive hyphens/);
  });
});

test('compatibility is capped at 500 characters', () => {
  check('pdf-tools', `name: pdf-tools\n${DESC}\ncompatibility: ${'x'.repeat(501)}`, ({ code, out }) => {
    assert.equal(code, 1, out);
    assert.match(out, /compatibility/);
  });
});

test('Claude Code extension keys pass without a warning', () => {
  check('pdf-tools', `name: pdf-tools\n${DESC}\nargument-hint: <file>\nmodel: sonnet\ndisable-model-invocation: true`,
    ({ code, out }) => {
      assert.equal(code, 0, out);
      assert.doesNotMatch(out, /not in the Agent Skills spec/);
    });
});

test('an unknown top-level key warns and points at metadata, without failing', () => {
  check('pdf-tools', `name: pdf-tools\n${DESC}\nversion: 2.0\ntriggers: pdf, document`, ({ code, out }) => {
    assert.equal(code, 0, out);
    assert.match(out, /not in the Agent Skills spec/);
    assert.match(out, /metadata/);
    assert.match(out, /triggers/);
  });
});
