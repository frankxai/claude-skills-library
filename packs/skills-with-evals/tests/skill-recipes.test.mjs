// Executes the hook scripts shipped inside hooks-automation/SKILL.md against synthetic
// Claude Code hook payloads, and checks the feynman-thinking worked example's sync claim.
// Needs bash and jq on PATH (both present on the CI ubuntu runner).
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const PACK = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const HOOKS_MD = readFileSync(join(PACK, 'skills/hooks-automation/SKILL.md'), 'utf8');
const FEYNMAN_MD = readFileSync(join(PACK, 'skills/feynman-thinking/SKILL.md'), 'utf8');

function bashScripts(md) {
  return [...md.matchAll(/```bash\n([\s\S]*?)```/g)].map((m) => m[1]).filter((s) => s.startsWith('#!/usr/bin/env bash'));
}

const work = realpathSync(mkdtempSync(join(tmpdir(), 'swe-hooks-')));
const bin = join(work, 'bin');
mkdirSync(bin);
// npm stub: records the directory it ran in, fails when NPM_FAIL is set.
writeFileSync(join(bin, 'npm'), '#!/usr/bin/env bash\npwd >> "$NPM_LOG"\n[ -n "${NPM_FAIL:-}" ] && exit 1\nexit 0\n');
chmodSync(join(bin, 'npm'), 0o755);

const [preCommit, guard] = bashScripts(HOOKS_MD);
const preCommitPath = join(work, 'pre-commit-check.sh');
const guardPath = join(work, 'file-and-secret-guard.sh');
writeFileSync(preCommitPath, preCommit);
writeFileSync(guardPath, guard);
chmodSync(preCommitPath, 0o755);
chmodSync(guardPath, 0o755);

function run(script, payload, env = {}) {
  const npmLog = join(work, `npm-${Math.random().toString(36).slice(2)}.log`);
  writeFileSync(npmLog, '');
  const r = spawnSync(script, [], {
    input: JSON.stringify(payload),
    env: { ...process.env, PATH: `${bin}:${process.env.PATH}`, NPM_LOG: npmLog, ...env },
    encoding: 'utf8',
  });
  return { code: r.status, stderr: r.stderr, npmDirs: readFileSync(npmLog, 'utf8').split('\n').filter(Boolean) };
}

describe('hooks-automation: file-and-secret-guard.sh', () => {
  it('blocks protected files given POSIX or Windows path separators', () => {
    for (const file_path of ['repo/.env', '/abs/repo/.env', 'C:\\repo\\.env', 'C:\\repo\\docs\\CANON_LOCKED.md']) {
      const r = run(guardPath, { tool_input: { file_path, content: 'A=1' } });
      assert.equal(r.code, 2, `expected block for ${file_path}, got ${r.code}`);
    }
  });

  it('allows ordinary files', () => {
    for (const file_path of ['repo/env.ts', 'C:\\repo\\src\\app.ts', 'repo/.envrc.example']) {
      const r = run(guardPath, { tool_input: { file_path, content: 'hello' } });
      assert.equal(r.code, 0, `expected allow for ${file_path}, got ${r.code}: ${r.stderr}`);
    }
  });
});

describe('hooks-automation: pre-commit-check.sh', () => {
  const cwd = mkdtempSync(join(work, 'session-'));

  it('runs the checks when a commit is followed by a shell operator', () => {
    for (const command of ['git commit -m x; git status', 'git commit&&git status', 'git commit -m x|cat', 'git commit -m x', 'git -c a=b commit']) {
      const r = run(preCommitPath, { cwd, tool_input: { command } }, { NPM_FAIL: '1' });
      assert.equal(r.code, 2, `expected block for "${command}", got ${r.code}`);
    }
  });

  it('leaves non-commit commands alone', () => {
    for (const command of ['git status', 'git commitizen-init', 'echo commit']) {
      const r = run(preCommitPath, { cwd, tool_input: { command } }, { NPM_FAIL: '1' });
      assert.equal(r.code, 0, `expected pass for "${command}", got ${r.code}`);
    }
  });

  it('runs the checks in the repository named by git -C, not the hook directory', () => {
    const other = mkdtempSync(join(work, 'other-repo-'));
    const r = run(preCommitPath, { cwd, tool_input: { command: `git -C ${other} commit -m x` } });
    assert.equal(r.code, 0, r.stderr);
    assert.ok(r.npmDirs.length > 0, 'checks did not run');
    for (const d of r.npmDirs) assert.equal(d, other);
  });

  it('runs the checks in the payload cwd for a plain commit', () => {
    const r = run(preCommitPath, { cwd, tool_input: { command: 'git commit -m x' } });
    assert.equal(r.code, 0, r.stderr);
    for (const d of r.npmDirs) assert.equal(d, cwd);
  });

  it('blocks when the git -C target cannot be entered', () => {
    const r = run(preCommitPath, { cwd, tool_input: { command: `git -C ${join(work, 'missing')} commit -m x` } });
    assert.equal(r.code, 2);
  });
});

describe('feynman-thinking: worked example', () => {
  const example = FEYNMAN_MD.slice(FEYNMAN_MD.indexOf('## Worked example'), FEYNMAN_MD.indexOf('## Check before sending'));

  it('does not claim that offline appends to one synced file merge on their own', () => {
    assert.doesNotMatch(example, /merge cleanly|conflict-free sync/i);
  });

  it('names an explicit merge mechanism: one file per device, merged and de-duplicated on read', () => {
    assert.match(example, /vault\.\$\{deviceId\}\.jsonl|per device|one file per device/i);
    assert.match(example, /de-?dup/i);
  });
});
