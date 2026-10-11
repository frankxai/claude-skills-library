import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, readFileSync, rmSync, chmodSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const RUNNER = join(ROOT, 'absorbed', 'harness', 'verification-run.mjs');
const SANTA = join(ROOT, 'absorbed', 'harness', 'santa-round.mjs');
const EVAL = join(ROOT, 'absorbed', 'harness', 'eval-estate.mjs');
const FIXTURE_HOOKS = mkdtempSync(join(tmpdir(), 'harness-e2e-hooks-'));
const LIVE_TOKEN = ['sk', 'ant', 'api03', 'abcdefghij'].join('-');

function git(repo, args) {
  const result = spawnSync('git', ['-c', `core.hooksPath=${FIXTURE_HOOKS}`, ...args], { cwd: repo, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr || result.stdout);
}

function initRepo() {
  const repo = mkdtempSync(join(tmpdir(), 'harness-e2e-'));
  git(repo, ['init', '-b', 'main']);
  git(repo, ['config', 'user.email', 'e2e@example.com']);
  git(repo, ['config', 'user.name', 'Harness E2E']);
  return repo;
}

function commitFile(repo, name, body) {
  writeFileSync(join(repo, name), body);
  git(repo, ['add', '--', name]);
  git(repo, ['commit', '-m', `add ${name}`]);
}

function runVerify(repo, { root = false, env } = {}) {
  const args = [RUNNER, `--repo=${repo}`];
  if (root) args.push('--root');
  const result = spawnSync(process.execPath, args, { encoding: 'utf8', env: env ?? process.env });
  return { code: result.status, out: `${result.stdout}${result.stderr}` };
}

function field(out, label) {
  const line = out.split(/\r?\n/).find((item) => item.startsWith(label));
  assert.ok(line, `missing ${label} in\n${out}`);
  return line.slice(label.length).trim();
}

function fakePnpm(code) {
  const dir = mkdtempSync(join(tmpdir(), 'fake-pnpm-'));
  const log = join(dir, 'calls.txt');
  writeFileSync(log, '');
  if (process.platform === 'win32') {
    writeFileSync(join(dir, 'pnpm.cmd'), `@echo off\r\necho %*>>"${log}"\r\nexit /b ${code}\r\n`);
    writeFileSync(join(dir, 'npm.cmd'), `@echo off\r\necho NPM>>"${log}"\r\nexit /b 0\r\n`);
  } else {
    const pnpm = join(dir, 'pnpm');
    const npm = join(dir, 'npm');
    writeFileSync(pnpm, `#!/bin/sh\necho "$@" >> "${log}"\nexit ${code}\n`);
    writeFileSync(npm, `#!/bin/sh\necho NPM >> "${log}"\nexit 0\n`);
    chmodSync(pnpm, 0o755);
    chmodSync(npm, 0o755);
  }
  const current = process.env.Path || process.env.PATH || '';
  const prefixed = `${dir}${process.platform === 'win32' ? ';' : ':'}${current}`;
  const env = { ...process.env, Path: prefixed, PATH: prefixed };
  return { dir, log, env };
}

test('a clean docs change records NOT RUN where no tool exists and is ready', () => {
  const repo = initRepo();
  try {
    commitFile(repo, 'README.md', 'A note.\n');
    const result = runVerify(repo, { root: true });
    assert.equal(result.code, 0, result.out);
    assert.match(field(result.out, 'build:'), /^NOT RUN/);
    assert.match(field(result.out, 'types:'), /^NOT RUN/);
    assert.match(field(result.out, 'lint:'), /^NOT RUN/);
    assert.match(field(result.out, 'tests:'), /^NOT RUN/);
    assert.equal(field(result.out, 'secrets:'), 'PASS');
    assert.equal(field(result.out, 'diff:'), '1 files');
    assert.equal(field(result.out, 'untracked:'), '0 files');
    assert.equal(field(result.out, 'ready:'), 'YES');
    assert.match(result.out, /file: README\.md/);
  } finally {
    rmSync(repo, { recursive: true, force: true });
  }
});

test('a live token in the diff fails secrets and is not ready', () => {
  const repo = initRepo();
  try {
    commitFile(repo, 'README.md', 'A note.\n');
    writeFileSync(join(repo, 'README.md'), `token ${LIVE_TOKEN}\n`);
    const result = runVerify(repo);
    assert.equal(result.code, 1);
    assert.match(field(result.out, 'secrets:'), /^FAIL/);
    assert.equal(field(result.out, 'ready:'), 'NO');
  } finally {
    rmSync(repo, { recursive: true, force: true });
  }
});

test('a prohibition that names sk-ant is not a secret', () => {
  const repo = initRepo();
  try {
    commitFile(repo, 'REVIEW.md', 'Reject tokens that start with the sk-ant prefix.\n');
    const result = runVerify(repo, { root: true });
    assert.equal(result.code, 0, result.out);
    assert.equal(field(result.out, 'secrets:'), 'PASS');
  } finally {
    rmSync(repo, { recursive: true, force: true });
  }
});

test('another agents untracked file makes the change not ready', () => {
  const repo = initRepo();
  try {
    commitFile(repo, 'README.md', 'A note.\n');
    writeFileSync(join(repo, 'other-agent.md'), 'leave this\n');
    const result = runVerify(repo, { root: true });
    assert.equal(result.code, 1);
    assert.equal(field(result.out, 'untracked:'), '1 files');
    assert.match(result.out, /untracked-file: other-agent\.md/);
    assert.equal(field(result.out, 'ready:'), 'NO');
  } finally {
    rmSync(repo, { recursive: true, force: true });
  }
});

test('a pnpm lockfile runs pnpm test and does not call npm', () => {
  const repo = initRepo();
  const fake = fakePnpm(1);
  try {
    writeFileSync(join(repo, 'package.json'), '{"scripts":{"test":"node -e \\"process.exit(1)\\""}}\n');
    writeFileSync(join(repo, 'pnpm-lock.yaml'), "lockfileVersion: '9.0'\n");
    git(repo, ['add', '--', 'package.json', 'pnpm-lock.yaml']);
    git(repo, ['commit', '-m', 'add test']);
    const result = runVerify(repo, { root: true, env: fake.env });
    assert.equal(result.code, 1);
    assert.match(field(result.out, 'tests:'), /pnpm test/);
    assert.doesNotMatch(field(result.out, 'tests:'), /(^|\s)npm(\s|$)/);
    assert.equal(field(result.out, 'ready:'), 'NO');
    const calls = readFileSync(fake.log, 'utf8');
    assert.match(calls, /test/);
    assert.doesNotMatch(calls, /NPM/);
  } finally {
    rmSync(repo, { recursive: true, force: true });
    rmSync(fake.dir, { recursive: true, force: true });
  }
});

test('a staged file is listed once', () => {
  const repo = initRepo();
  try {
    commitFile(repo, 'README.md', 'A note.\n');
    writeFileSync(join(repo, 'NEXT.md'), 'next\n');
    git(repo, ['add', '--', 'NEXT.md']);
    const result = runVerify(repo);
    assert.equal(result.code, 0, result.out);
    assert.equal(field(result.out, 'diff:'), '1 files');
    assert.match(result.out, /file: NEXT\.md/);
  } finally {
    rmSync(repo, { recursive: true, force: true });
  }
});

test('an untracked live token fails secrets', () => {
  const repo = initRepo();
  try {
    commitFile(repo, 'README.md', 'A note.\n');
    writeFileSync(join(repo, 'dropped-key.md'), `${LIVE_TOKEN}\n`);
    const result = runVerify(repo, { root: true });
    assert.equal(result.code, 1);
    assert.match(field(result.out, 'secrets:'), /^FAIL/);
    assert.equal(field(result.out, 'ready:'), 'NO');
  } finally {
    rmSync(repo, { recursive: true, force: true });
  }
});

test('a linter config without a pnpm lockfile is NOT RUN', () => {
  const repo = initRepo();
  try {
    commitFile(repo, 'eslint.config.js', 'export default [];\n');
    const result = runVerify(repo, { root: true });
    assert.match(field(result.out, 'lint:'), /pnpm-lock\.yaml is not/);
    assert.equal(field(result.out, 'ready:'), 'YES');
  } finally {
    rmSync(repo, { recursive: true, force: true });
  }
});

test('santa ships only when both passes cite a line, and stops at three', () => {
  function round(roundNumber, reviews) {
    const result = spawnSync(process.execPath, [
      SANTA,
      `--round=${roundNumber}`,
      '--author=grok',
      `--reviews=${JSON.stringify(reviews)}`,
    ], { encoding: 'utf8' });
    return { code: result.status, out: `${result.stdout}${result.stderr}` };
  }
  const cited = { harness: 'antigravity', verdict: 'pass', citation: 'README.md:1' };
  const other = { harness: 'codex', verdict: 'pass', citation: 'README.md:2' };
  const bare = { harness: 'codex', verdict: 'pass', citation: '' };
  const shipped = round(1, [cited, other]);
  assert.equal(shipped.code, 0, shipped.out);
  assert.match(shipped.out, /ship=yes/);

  const uncited = round(1, [cited, bare]);
  assert.equal(uncited.code, 1);
  assert.match(uncited.out, /ship=no stop=no/);

  const author = round(1, [cited, { harness: 'grok', verdict: 'pass', citation: 'README.md:1' }]);
  assert.match(author.out, /author graded/);
  assert.match(author.out, /stop=yes/);

  const third = round(3, [cited, { harness: 'codex', verdict: 'fail', citation: 'README.md:4' }]);
  assert.match(third.out, /three rounds/);
  assert.match(third.out, /ship=no stop=yes/);
});

test('the file check still passes', () => {
  const result = spawnSync(process.execPath, [EVAL], { encoding: 'utf8' });
  assert.equal(result.status, 0, `${result.stdout}${result.stderr}`);
  assert.match(result.stdout, /EVAL PASS skills=8/);
});
