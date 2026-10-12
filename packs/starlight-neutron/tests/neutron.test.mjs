import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { delimiter, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { bench, doctor, findOnPath, formatMarkdown, formatTable, hasRtkHook, resolveRtk, savedPercent } from '../scripts/neutron.mjs';
import { commandHitsRule, loadGuardRules, run as runHook } from '../hooks/rtk-rewrite.mjs';
import { applyPlan, main as installMain, planInstall } from '../install.mjs';

const PACK = join(dirname(fileURLToPath(import.meta.url)), '..');
const node = process.execPath;
const tmp = (name) => mkdtempSync(join(tmpdir(), `neutron-${name}-`));

test('savedPercent rounds and guards a zero baseline', () => {
  assert.equal(savedPercent(1000, 200), 80);
  assert.equal(savedPercent(99882, 27221), 73);
  assert.equal(savedPercent(0, 0), 0);
  assert.equal(savedPercent(100, 120), -20);
});

test('formatTable and formatMarkdown show measured and skipped rows', () => {
  const rows = [
    { label: 'git log', raw: 1000, rtk: 200, saved: 80 },
    { label: 'grep', skipped: 'grep ENOENT' },
  ];
  assert.match(formatTable(rows), /git log\s+1000\s+200\s+80%/);
  assert.match(formatMarkdown(rows), /\| `git log` \| 1,000 \| 200 \| 80% \|/);
  assert.match(formatMarkdown(rows), /\| `grep` \| skipped \| grep ENOENT \|/);
});

test('bench skips a missing tool instead of throwing', () => {
  const rows = bench([{ label: 'ghost', raw: ['definitely-not-a-real-binary-xyz'], rtk: ['also-missing'] }]);
  assert.ok(rows[0].skipped);
});

test('bench measures a real command pair', () => {
  const rows = bench([{ label: 'long vs short', raw: [node, '-e', 'console.log("x".repeat(1000))'], rtk: [node, '-e', 'console.log("x")'] }]);
  assert.equal(rows[0].raw, 1001);
  assert.ok(rows[0].saved >= 99);
});

test('bench does not report a failing filter as a saving', () => {
  const rows = bench([
    {
      label: 'broken filter',
      raw: [node, '-e', 'console.log("x".repeat(5000))'],
      rtk: [node, '-e', 'console.error("boom"); process.exit(3)'],
    },
  ]);
  assert.equal(rows[0].saved, undefined);
  assert.match(rows[0].skipped, /exit codes differ/);
});

test('bench accepts grep-style exit 1 with output when both sides agree', () => {
  const both = [node, '-e', 'console.log("match"); process.exit(1)'];
  const rows = bench([{ label: 'grep-like', raw: both, rtk: both }]);
  assert.equal(rows[0].saved, 0);
});

test('hasRtkHook finds hook commands only, not stray mentions', () => {
  assert.equal(hasRtkHook({ hooks: { PreToolUse: [{ hooks: [{ command: 'rtk hook claude' }] }] } }), true);
  assert.equal(hasRtkHook({ hooks: { PreToolUse: [{ hooks: [{ command: 'node thing.mjs' }] }] } }), false);
  assert.equal(hasRtkHook({ note: 'we should try rtk someday', hooks: {} }), false);
  assert.equal(hasRtkHook(null), false);
});

test('doctor is hermetic and reads settings.local.json as well as settings.json', () => {
  const home = tmp('home');
  try {
    mkdirSync(join(home, '.claude'), { recursive: true });
    const probes = { rtk: () => ({ command: 'rtk', version: 'rtk 9.9.9' }), shim: (n) => (n === 'ccusage' ? 'ccusage 1' : null) };
    const before = doctor(home, probes);
    assert.equal(before.find((r) => r.name === 'rtk hook').ok, false);
    assert.equal(before.find((r) => r.name === 'ccusage').ok, true);
    assert.equal(before.find((r) => r.name === 'headroom').ok, false);
    writeFileSync(join(home, '.claude', 'settings.local.json'), JSON.stringify({ hooks: { PreToolUse: [{ hooks: [{ command: 'rtk hook claude' }] }] } }));
    assert.equal(doctor(home, probes).find((r) => r.name === 'rtk hook').ok, true);
  } finally {
    rmSync(home, { recursive: true, force: true });
  }
});

test('resolveRtk prefers NEUTRON_RTK and returns null when nothing answers', () => {
  const seen = [];
  const probe = (c) => (seen.push(c), c === '/custom/rtk' ? 'rtk 1.0' : null);
  assert.deepEqual(resolveRtk({ NEUTRON_RTK: '/custom/rtk' }, probe), { command: '/custom/rtk', version: 'rtk 1.0' });
  assert.equal(resolveRtk({}, () => null), null);
});

test('findOnPath ignores a binary planted in the working directory and relative PATH entries', () => {
  const ext = process.platform === 'win32' ? '.exe' : '';
  const planted = tmp('planted');
  const trusted = tmp('trusted');
  try {
    writeFileSync(join(planted, `rtk${ext}`), 'evil');
    writeFileSync(join(trusted, `rtk${ext}`), 'real');
    const both = { PATH: ['.', 'relative', planted, trusted].join(delimiter) };
    assert.equal(findOnPath('rtk', both, planted), join(trusted, `rtk${ext}`));
    assert.equal(findOnPath('rtk', { PATH: ['.', planted].join(delimiter) }, planted), null);
    assert.equal(findOnPath('rtk', {}, planted), null);
  } finally {
    rmSync(planted, { recursive: true, force: true });
    rmSync(trusted, { recursive: true, force: true });
  }
});

test('resolveRtk never returns a relative NEUTRON_RTK', () => {
  assert.equal(resolveRtk({ NEUTRON_RTK: 'rtk' }, () => 'rtk 1.0'), null);
  assert.equal(resolveRtk({ NEUTRON_RTK: './rtk' }, () => 'rtk 1.0'), null);
});

test('hook fails open: no rtk means no output and exit 0, garbage in is also harmless', () => {
  const dead = { NEUTRON_RTK: join(tmpdir(), 'no-such-rtk-binary'), LOCALAPPDATA: '', PATH: '' };
  assert.deepEqual(runHook('{"tool_name":"Bash"}', dead), { stdout: '', status: 0 });
  const res = spawnSync(node, [join(PACK, 'hooks', 'rtk-rewrite.mjs')], { input: 'not json', encoding: 'utf8', env: { ...dead } });
  assert.equal(res.status, 0);
  assert.equal(res.stdout, '');
});

const hookInput = (command, tool = 'Bash') => JSON.stringify({ hook_event_name: 'PreToolUse', tool_name: tool, tool_input: { command } });

test('hook rewrites a git command when rtk is installed', { skip: !resolveRtk() }, () => {
  const home = tmp('hookhome');
  try {
    const out = runHook(hookInput('git log -n 5'), process.env, { home, cwd: home });
    assert.match(out.stdout, /"command":"rtk git log -n 5"/);
    assert.match(runHook(hookInput('git log -n 5', 'PowerShell'), process.env, { home, cwd: home }).stdout, /"command":"rtk git log -n 5"/);
  } finally {
    rmSync(home, { recursive: true, force: true });
  }
});

test('commandHitsRule matches prefix, glob and exact rules, and every segment of a compound command', () => {
  assert.equal(commandHitsRule('git commit -m x', ['git commit:*']), true);
  assert.equal(commandHitsRule('git commit', ['git commit:*']), true);
  assert.equal(commandHitsRule('git log -n 1 && git commit -m x', ['git commit:*']), true);
  assert.equal(commandHitsRule('echo hi | git push origin main', ['git push *']), true);
  assert.equal(commandHitsRule('git status', ['git status']), true);
  assert.equal(commandHitsRule('git log -n 5', ['git commit:*', 'git push *']), false);
  assert.equal(commandHitsRule('git committed', ['git commit:*']), false);
  assert.equal(commandHitsRule('git log', []), false);
});

test('loadGuardRules reads ask and deny for Bash and PowerShell from user and project settings, not allow', () => {
  const home = tmp('rules-home');
  const proj = tmp('rules-proj');
  try {
    mkdirSync(join(home, '.claude'), { recursive: true });
    mkdirSync(join(proj, '.claude'), { recursive: true });
    writeFileSync(join(home, '.claude', 'settings.json'), JSON.stringify({ permissions: { deny: ['Bash(git push:*)'], allow: ['Bash(git log:*)'] } }));
    writeFileSync(join(proj, '.claude', 'settings.local.json'), JSON.stringify({ permissions: { ask: ['PowerShell(git commit:*)', 'Read(secrets/**)'] } }));
    assert.deepEqual(loadGuardRules(home, proj).sort(), ['git commit:*', 'git push:*']);
    assert.deepEqual(loadGuardRules(tmp('empty'), tmp('empty2')), []);
  } finally {
    rmSync(home, { recursive: true, force: true });
    rmSync(proj, { recursive: true, force: true });
  }
});

test('hook leaves a command untouched when an ask or deny rule matches it', { skip: !resolveRtk() }, () => {
  const home = tmp('guard-home');
  const proj = tmp('guard-proj');
  try {
    mkdirSync(join(proj, '.claude'), { recursive: true });
    writeFileSync(join(proj, '.claude', 'settings.json'), JSON.stringify({ permissions: { ask: ['Bash(git commit:*)'], deny: ['Bash(git push:*)'] } }));
    const at = { home, cwd: proj };
    assert.equal(runHook(hookInput('git commit -m x'), process.env, at).stdout, '');
    assert.equal(runHook(hookInput('git push origin main'), process.env, at).stdout, '');
    assert.equal(runHook(hookInput('git log -n 1 && git commit -m x'), process.env, at).stdout, '');
    assert.match(runHook(hookInput('git log -n 5'), process.env, at).stdout, /rtk git log -n 5/);
  } finally {
    rmSync(home, { recursive: true, force: true });
    rmSync(proj, { recursive: true, force: true });
  }
});

test('hook ignores input without a command string', () => {
  assert.deepEqual(runHook('{"tool_name":"Read","tool_input":{"file_path":"x"}}'), { stdout: '', status: 0 });
  assert.deepEqual(runHook('not json'), { stdout: '', status: 0 });
});

test('planInstall lists skills and scripts and writes nothing', () => {
  const target = tmp('target');
  try {
    const plan = planInstall(target, PACK);
    assert.deepEqual(plan.map((s) => s.name).sort(), ['neutron', 'neutron-log', 'scripts']);
    assert.equal(existsSync(join(target, '.claude')), false);
  } finally {
    rmSync(target, { recursive: true, force: true });
  }
});

test('applyPlan installs skills and scripts, and moves an edited skill to backup instead of overwriting it', () => {
  const target = tmp('apply');
  try {
    applyPlan(planInstall(target, PACK), 1);
    const skill = join(target, '.claude', 'skills', 'neutron', 'SKILL.md');
    assert.match(readFileSync(skill, 'utf8'), /^---\nname: neutron\n/);
    assert.ok(existsSync(join(target, '.claude', 'neutron', 'scripts', 'neutron.mjs')));
    writeFileSync(skill, 'MY LOCAL EDIT');
    writeFileSync(join(target, '.claude', 'skills', 'neutron', 'stale.txt'), 'old');
    applyPlan(planInstall(target, PACK), 2);
    assert.equal(readFileSync(join(target, '.claude', 'neutron', 'backup', 'neutron-2', 'SKILL.md'), 'utf8'), 'MY LOCAL EDIT');
    assert.equal(existsSync(join(target, '.claude', 'skills', 'neutron', 'stale.txt')), false);
    assert.deepEqual(readdirSync(join(target, '.claude', 'skills')).sort(), ['neutron', 'neutron-log']);
  } finally {
    rmSync(target, { recursive: true, force: true });
  }
});

test('install refuses --user together with a path and a missing target', () => {
  const quiet = console.error;
  console.error = () => {};
  try {
    assert.equal(installMain(['--user', join(tmpdir(), 'somewhere')]), 2);
    assert.equal(installMain([join(tmpdir(), 'definitely-missing-dir-xyz')]), 2);
    assert.equal(installMain([]), 2);
  } finally {
    console.error = quiet;
  }
});

test('plugin manifest, hook config and skills agree', () => {
  const manifest = JSON.parse(readFileSync(join(PACK, '.claude-plugin', 'plugin.json'), 'utf8'));
  assert.equal(manifest.name, 'starlight-neutron');
  const hooks = JSON.parse(readFileSync(join(PACK, 'hooks', 'hooks.json'), 'utf8'));
  assert.equal(hooks.hooks.PreToolUse[0].matcher, 'Bash|PowerShell');
  const command = hooks.hooks.PreToolUse[0].hooks[0].command;
  assert.match(command, /\$\{CLAUDE_PLUGIN_ROOT\}\/hooks\/rtk-rewrite\.mjs/);
  assert.ok(existsSync(join(PACK, 'hooks', 'rtk-rewrite.mjs')));
  for (const dir of readdirSync(join(PACK, 'skills'))) {
    const front = readFileSync(join(PACK, 'skills', dir, 'SKILL.md'), 'utf8').split('---')[1];
    assert.match(front, new RegExp(`^name: ${dir}$`, 'm'));
    assert.match(front, /^description: .{40,}/m);
  }
});

test('published results file is well formed and every saved percent matches its bytes', () => {
  const dir = join(PACK, 'results');
  for (const file of readdirSync(dir).filter((f) => f.endsWith('.json'))) {
    const data = JSON.parse(readFileSync(join(dir, file), 'utf8'));
    assert.equal(data.unit, 'bytes');
    assert.ok(data.rtk && data.repoHead);
    for (const row of data.rows.filter((r) => !r.skipped)) assert.equal(row.saved, savedPercent(row.raw, row.rtk), `${file}: ${row.label}`);
  }
});
