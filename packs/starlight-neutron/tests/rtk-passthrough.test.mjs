import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { breaksUnderRewrite, grepWithContext, inIsolatedWorktree, run, usesGit } from '../hooks/rtk-rewrite.mjs';

const WT = 'C:\\repos\\app\\.claude\\worktrees\\feat';
const REPO = 'C:\\repos\\app';
const job = { CLAUDE_JOB_DIR: 'C:\\Users\\me\\.claude\\jobs\\abc' };

test('git in a worktree-isolated background job breaks under rewrite', () => {
  assert.equal(breaksUnderRewrite('git status --short', WT, job), true);
  assert.equal(breaksUnderRewrite('git log --oneline -3', '/home/me/repo/.claude/worktrees/x', job), true);
});

test('git keeps its rewrite outside isolated jobs', () => {
  assert.equal(breaksUnderRewrite('git status', REPO, job), false);
  assert.equal(breaksUnderRewrite('git status', WT, {}), false);
  assert.equal(inIsolatedWorktree(WT, {}), false);
});

test('only git as a command word counts', () => {
  assert.equal(usesGit('git diff'), true);
  assert.equal(usesGit('cd x && git add .'), true);
  assert.equal(usesGit('ls digital/'), false);
  assert.equal(usesGit('cat .gitignore'), false);
});

test('grep with context flags breaks under rewrite; plain grep does not', () => {
  for (const c of ['grep -n -A1 foo f', 'grep -C 3 foo f', 'grep -B2 x y', 'grep -nC2 x y', 'grep --context=2 x y', 'cat f | grep -A2 x']) {
    assert.equal(grepWithContext(c), true, c);
  }
  for (const c of ['grep -n foo f', 'grep -rn "A" .', 'git -C /x status', 'grep -c x f']) {
    assert.equal(grepWithContext(c), false, c);
  }
});

test('run() leaves these commands unchanged', () => {
  const home = mkdtempSync(join(tmpdir(), 'neutron-pass-'));
  const opts = { home, managed: [], stopAt: home };
  const env = { ...job, RTK_BIN: join(home, 'no-such-rtk') };
  const gitInJob = JSON.stringify({ tool_name: 'Bash', cwd: WT, tool_input: { command: 'git status --short' } });
  const grepCtx = JSON.stringify({ tool_name: 'Bash', cwd: home, tool_input: { command: 'grep -A1 foo f' } });
  assert.deepEqual(run(gitInJob, env, opts), { stdout: '', status: 0 });
  assert.deepEqual(run(grepCtx, env, opts), { stdout: '', status: 0 });
});
