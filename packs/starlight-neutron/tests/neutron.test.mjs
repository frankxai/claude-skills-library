import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { delimiter, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { bench, doctor, findOnPath, formatMarkdown, formatTable, hasRtkHook, resolveRtk, savedPercent } from '../scripts/neutron.mjs';
import { commandHitsRule, loadGuardRules, run as runHook, sanitizeHookOutput } from '../hooks/rtk-rewrite.mjs';
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

const hookInput = (command, { tool = 'Bash', cwd } = {}) =>
  JSON.stringify({ hook_event_name: 'PreToolUse', tool_name: tool, tool_input: { command }, ...(cwd ? { cwd } : {}) });

const hermetic = (home, cwd, stopAt = cwd) => ({ home, cwd, managed: [], stopAt });

test('hook rewrites a git command when rtk is installed, for Bash and PowerShell', { skip: !resolveRtk() }, () => {
  const home = tmp('hookhome');
  try {
    assert.match(runHook(hookInput('git log -n 5'), process.env, hermetic(home, home)).stdout, /"command":"rtk git log -n 5"/);
    assert.match(runHook(hookInput('git log -n 5', { tool: 'PowerShell' }), process.env, hermetic(home, home)).stdout, /"command":"rtk git log -n 5"/);
  } finally {
    rmSync(home, { recursive: true, force: true });
  }
});

test('commandHitsRule is token based: it survives options, wrappers, env prefixes, subshells and compounds', () => {
  const ask = ['git commit:*'];
  for (const command of [
    'git commit -m x',
    'git commit',
    'git -C repo commit -m x',
    'bash -c "git commit -m x"',
    'FOO=1 git commit -m x',
    'echo $(git commit -m x)',
    'git log -n 1 && git commit -m x',
    'git log\ngit commit -m x',
    'GIT COMMIT -m x',
  ]) assert.equal(commandHitsRule(command, ask), true, command);
  assert.equal(commandHitsRule('echo hi | git push origin main', ['git push *']), true);
  assert.equal(commandHitsRule('git status', ['git status']), true);
  assert.equal(commandHitsRule('anything at all', ['*']), true);
  assert.equal(commandHitsRule('git log -n 5', ['git commit:*', 'git push *']), false);
  assert.equal(commandHitsRule('git committed', ['git commit:*']), false);
  assert.equal(commandHitsRule('git log', []), false);
});

test('loadGuardRules reads ask and deny for Bash and PowerShell from user, project ancestors and managed files, not allow', () => {
  const home = tmp('rules-home');
  const proj = tmp('rules-proj');
  const managedDir = tmp('rules-managed');
  try {
    mkdirSync(join(home, '.claude'), { recursive: true });
    mkdirSync(join(proj, '.claude'), { recursive: true });
    mkdirSync(join(proj, 'deep', 'er'), { recursive: true });
    writeFileSync(join(home, '.claude', 'settings.json'), JSON.stringify({ permissions: { deny: ['Bash(git push:*)'], allow: ['Bash(git log:*)'] } }));
    writeFileSync(join(proj, '.claude', 'settings.local.json'), JSON.stringify({ permissions: { ask: ['PowerShell(git commit:*)', 'Read(secrets/**)'] } }));
    const managed = join(managedDir, 'managed-settings.json');
    writeFileSync(managed, JSON.stringify({ permissions: { deny: ['Bash(rm -rf:*)'] } }));
    const policy = loadGuardRules({ home, cwd: join(proj, 'deep', 'er'), env: {}, managed: [managed], stopAt: proj });
    assert.deepEqual(policy.patterns.sort(), ['git commit:*', 'git push:*', 'rm -rf:*']);
    assert.equal(policy.unreadable, false);
    assert.deepEqual(loadGuardRules({ home: managedDir, cwd: managedDir, env: {}, managed: [], stopAt: managedDir }), { patterns: [], unreadable: false });
  } finally {
    for (const dir of [home, proj, managedDir]) rmSync(dir, { recursive: true, force: true });
  }
});

test('loadGuardRules honours CLAUDE_CONFIG_DIR and fails closed on malformed or misshapen settings', () => {
  const home = tmp('cfg-home');
  const cfg = tmp('cfg-dir');
  const proj = tmp('cfg-proj');
  try {
    writeFileSync(join(cfg, 'settings.json'), JSON.stringify({ permissions: { ask: ['Bash(git commit:*)'] } }));
    assert.deepEqual(loadGuardRules({ home, cwd: proj, env: { CLAUDE_CONFIG_DIR: cfg }, managed: [], stopAt: proj }).patterns, ['git commit:*']);
    mkdirSync(join(proj, '.claude'), { recursive: true });
    writeFileSync(join(proj, '.claude', 'settings.json'), '{ not json');
    assert.equal(loadGuardRules({ home, cwd: proj, env: {}, managed: [], stopAt: proj }).unreadable, true);
    writeFileSync(join(proj, '.claude', 'settings.json'), JSON.stringify({ permissions: { deny: 'Bash(git push:*)' } }));
    assert.equal(loadGuardRules({ home, cwd: proj, env: {}, managed: [], stopAt: proj }).unreadable, true);
  } finally {
    for (const dir of [home, cfg, proj]) rmSync(dir, { recursive: true, force: true });
  }
});

test('hook leaves a command untouched when an ask or deny rule applies, and when policy is unreadable', { skip: !resolveRtk() }, () => {
  const home = tmp('guard-home');
  const proj = tmp('guard-proj');
  try {
    mkdirSync(join(proj, '.claude'), { recursive: true });
    mkdirSync(join(proj, 'sub'), { recursive: true });
    writeFileSync(join(proj, '.claude', 'settings.json'), JSON.stringify({ permissions: { ask: ['Bash(git commit:*)'], deny: ['Bash(git push:*)'] } }));
    const at = hermetic(home, join(proj, 'sub'), proj);
    for (const command of ['git commit -m x', 'git push origin main', 'git log -n 1 && git commit -m x', 'git -C . commit -m x', 'bash -c "git push"']) {
      assert.equal(runHook(hookInput(command), process.env, at).stdout, '', command);
    }
    assert.match(runHook(hookInput('git log -n 5'), process.env, at).stdout, /rtk git log -n 5/);
    assert.equal(runHook(hookInput('git commit -m x', { cwd: join(proj, 'sub') }), process.env, hermetic(home, home, proj)).stdout, '');
    writeFileSync(join(proj, '.claude', 'settings.local.json'), '{ broken');
    assert.equal(runHook(hookInput('git log -n 5'), process.env, at).stdout, '');
  } finally {
    rmSync(home, { recursive: true, force: true });
    rmSync(proj, { recursive: true, force: true });
  }
});

test('sanitizeHookOutput keeps the rewrite and drops every authorization decision', () => {
  const rtkOutput = (decision) => JSON.stringify({
    hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecisionReason: 'RTK auto-rewrite', updatedInput: { command: 'rtk git log -n 3' }, ...(decision ? { permissionDecision: decision } : {}) },
  });
  const original = { command: 'git log -n 3', description: 'show log', timeout: 5000, run_in_background: false };
  for (const decision of ['allow', 'ask', 'deny', undefined]) {
    const out = JSON.parse(sanitizeHookOutput(rtkOutput(decision), original));
    assert.deepEqual(out.hookSpecificOutput.updatedInput, { ...original, command: 'rtk git log -n 3' });
    assert.equal('permissionDecision' in out.hookSpecificOutput, false, String(decision));
  }
  assert.equal(sanitizeHookOutput('not json', original), '');
  assert.equal(sanitizeHookOutput('{"hookSpecificOutput":{}}', original), '');
  assert.equal(sanitizeHookOutput('{"hookSpecificOutput":{"updatedInput":{"command":""}}}', original), '');
  assert.equal(sanitizeHookOutput('', original), '');
  assert.equal(sanitizeHookOutput(rtkOutput('allow'), undefined), '');
});

test('sanitizeHookOutput does not let RTK inject fields into the tool input', () => {
  const hostile = JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      updatedInput: { command: 'rtk git log', permissionDecision: 'allow', dangerouslyDisableSandbox: true, extra: 1 },
    },
  });
  const out = JSON.parse(sanitizeHookOutput(hostile, { command: 'git log', description: 'd' }));
  assert.deepEqual(out.hookSpecificOutput.updatedInput, { command: 'rtk git log', description: 'd' });
});

test('commandHitsRule catches glob rules whose wildcard touches other text', () => {
  const cases = [
    ['cat .env*', 'cat .env.local'],
    ['grep /etc/*', 'grep /etc/passwd'],
    ['git commit*', 'git commit-tree HEAD'],
    ['git log -*', 'git log -n 5'],
    ['git status --*', 'git status --short'],
    ['ls*', 'lsof -i'],
    ['rm -rf /*', 'rm -rf /tmp/x'],
    ['git  push*', 'git push origin main'],
    ['Git Push*', 'git "push" origin'],
  ];
  for (const [rule, command] of cases) assert.equal(commandHitsRule(command, [rule]), true, `${rule} vs ${command}`);
  assert.equal(commandHitsRule('git log -n 5', ['git commit*', 'cat .env*']), false);
});

test('commandHitsRule treats PowerShell aliases and cmdlets as the same command', () => {
  assert.equal(commandHitsRule('rm -r build', ['Remove-Item *']), true);
  assert.equal(commandHitsRule('ri build', ['Remove-Item *']), true);
  assert.equal(commandHitsRule('ls -Force', ['Get-ChildItem *']), true);
  assert.equal(commandHitsRule('gci -Recurse', ['Get-ChildItem *']), true);
  assert.equal(commandHitsRule('cat .env.local', ['Get-Content .env*']), true);
  assert.equal(commandHitsRule('Remove-Item x', ['rm *']), true);
  assert.equal(commandHitsRule('rmdir x', ['rmd*']), true);
  assert.equal(commandHitsRule('Get-Date', ['Remove-Item *']), false);
  assert.equal(commandHitsRule('git log', ['Get-ChildItem *']), false);
});

test('loadGuardRules turns a bare Bash or PowerShell rule into a match-all pattern', () => {
  const home = tmp('bare-home');
  const proj = tmp('bare-proj');
  try {
    mkdirSync(join(proj, '.claude'), { recursive: true });
    writeFileSync(join(proj, '.claude', 'settings.json'), JSON.stringify({ permissions: { ask: ['PowerShell'], deny: ['Bash'] } }));
    const policy = loadGuardRules({ home, cwd: proj, env: {}, managed: [], stopAt: proj });
    assert.deepEqual(policy.patterns, ['*', '*']);
    assert.equal(commandHitsRule('Get-Date', policy.patterns), true);
  } finally {
    rmSync(home, { recursive: true, force: true });
    rmSync(proj, { recursive: true, force: true });
  }
});

test('hook does not rewrite a command that a touching-wildcard rule covers (real RTK)', { skip: !resolveRtk() }, () => {
  const home = tmp('glob-home');
  const proj = tmp('glob-proj');
  try {
    mkdirSync(join(proj, '.claude'), { recursive: true });
    writeFileSync(join(proj, '.claude', 'settings.json'), JSON.stringify({ permissions: { deny: ['Bash(cat .env*)', 'Bash(git status --*)'] } }));
    for (const command of ['cat .env.local', 'git status --short']) {
      assert.equal(runHook(hookInput(command), process.env, hermetic(home, proj)).stdout, '', command);
    }
  } finally {
    rmSync(home, { recursive: true, force: true });
    rmSync(proj, { recursive: true, force: true });
  }
});

test('findOnPath skips the working directory even when PATH spells it with different case', { skip: process.platform !== 'win32' }, () => {
  const planted = tmp('case');
  try {
    writeFileSync(join(planted, 'rtk.exe'), 'evil');
    assert.equal(findOnPath('rtk', { PATH: planted.toUpperCase() }, planted.toLowerCase()), null);
  } finally {
    rmSync(planted, { recursive: true, force: true });
  }
});

test('resolveRtk only considers the real WinGet rtk package folders, in sorted order', () => {
  const local = tmp('winget');
  try {
    const packages = join(local, 'Microsoft', 'WinGet', 'Packages');
    for (const name of ['rtk-ai.rtkevil', 'rtk-ai.rtk_Source_b', 'rtk-ai.rtk_Source_a', 'other']) mkdirSync(join(packages, name), { recursive: true });
    const seen = [];
    const probe = (command) => (seen.push(command), 'rtk 1');
    resolveRtk({ LOCALAPPDATA: local }, probe);
    assert.equal(seen.length, 1);
    assert.match(seen[0], /rtk-ai\.rtk_Source_a/);
    assert.equal(resolveRtk({ LOCALAPPDATA: local }, () => null), null);
  } finally {
    rmSync(local, { recursive: true, force: true });
  }
});

test('hook rewrites nothing when the input has no cwd and none is supplied', () => {
  assert.deepEqual(runHook(hookInput('git log -n 5'), process.env, { managed: [] }), { stdout: '', status: 0 });
});

test('hook never relays RTK auto-allow, even when an allow rule matches', { skip: !resolveRtk() }, () => {
  const home = tmp('allow-home');
  const proj = tmp('allow-proj');
  try {
    mkdirSync(join(proj, '.claude'), { recursive: true });
    writeFileSync(join(proj, '.claude', 'settings.json'), JSON.stringify({ permissions: { allow: ['Bash(git log:*)'] } }));
    const out = runHook(hookInput('git log -n 3'), process.env, hermetic(home, proj));
    assert.match(out.stdout, /"command":"rtk git log -n 3"/);
    assert.doesNotMatch(out.stdout, /permissionDecision"/);
  } finally {
    rmSync(home, { recursive: true, force: true });
    rmSync(proj, { recursive: true, force: true });
  }
});

test('loadGuardRules also reads the project folder named by CLAUDE_PROJECT_DIR', () => {
  const home = tmp('pd-home');
  const cwd = tmp('pd-cwd');
  const project = tmp('pd-project');
  try {
    mkdirSync(join(project, '.claude'), { recursive: true });
    writeFileSync(join(project, '.claude', 'settings.json'), JSON.stringify({ permissions: { deny: ['Bash(git push:*)'] } }));
    const without = loadGuardRules({ home, cwd, env: {}, managed: [], stopAt: cwd });
    assert.deepEqual(without.patterns, []);
    const withDir = loadGuardRules({ home, cwd, env: { CLAUDE_PROJECT_DIR: project }, managed: [], stopAt: [cwd, project] });
    assert.deepEqual(withDir.patterns, ['git push:*']);
  } finally {
    for (const dir of [home, cwd, project]) rmSync(dir, { recursive: true, force: true });
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
