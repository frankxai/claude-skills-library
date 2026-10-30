import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const INSTALL_SCRIPT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../install.sh');

function runInstall(target, args = []) {
  return execFileSync(INSTALL_SCRIPT, [target, ...args], { encoding: 'utf8' });
}

function repo() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'eg-install-'));
  execFileSync('git', ['-C', root, 'init', '-q']);
  return root;
}

test('fresh install', () => {
  const root = repo();
  const out = runInstall(root);

  // Check files are created
  assert.equal(fs.existsSync(path.join(root, '.claude/ci/estate-guard-scan.mjs')), true);
  assert.equal(fs.existsSync(path.join(root, '.claude/ci/estate-guard/config.json')), true);
  assert.equal(fs.existsSync(path.join(root, '.claude/skills/estate-guard/SKILL.md')), true);
  assert.equal(fs.existsSync(path.join(root, '.claude/hooks/estate-guard-gate.py')), true);
  assert.equal(fs.existsSync(path.join(root, '.github/workflows/estate-guard.yml')), true);
  assert.equal(fs.existsSync(path.join(root, '.claude/settings.json')), true);

  assert.match(out, /ci\s+.github\/workflows\/estate-guard.yml/);
});

test('re-install is idempotent', () => {
  const root = repo();
  runInstall(root);

  // Save state
  const beforeYaml = fs.readFileSync(path.join(root, '.github/workflows/estate-guard.yml'), 'utf8');

  // Run again
  const out = runInstall(root);

  // Check that the file was not changed
  const afterYaml = fs.readFileSync(path.join(root, '.github/workflows/estate-guard.yml'), 'utf8');
  assert.equal(beforeYaml, afterYaml);
  assert.match(out, /ci\s+.github\/workflows\/estate-guard.yml \(exists, skipping to preserve customizations\)/);
});

test('existing customized workflow is not silently overwritten', () => {
  const root = repo();
  runInstall(root);

  // Customize workflow
  const customContent = 'name: custom-workflow\n';
  fs.writeFileSync(path.join(root, '.github/workflows/estate-guard.yml'), customContent);

  // Run again
  runInstall(root);

  // Verify it wasn't overwritten
  const currentContent = fs.readFileSync(path.join(root, '.github/workflows/estate-guard.yml'), 'utf8');
  assert.equal(currentContent, customContent);
});

test('dry-run mode', () => {
  const root = repo();
  const out = runInstall(root, ['--dry-run']);

  // Check that no files were written
  assert.equal(fs.existsSync(path.join(root, '.claude/ci/estate-guard-scan.mjs')), false);
  assert.equal(fs.existsSync(path.join(root, '.github/workflows/estate-guard.yml')), false);

  assert.match(out, /\(dry run — nothing will be written\)/);
  assert.match(out, /would: mkdir -p/);
});
