// Router + composer + installer tests for packs/stack-kits. Zero dependencies:
//   node --test packs/stack-kits/tests/*.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import { route, render } from '../hooks/skill-activation-prompt.mjs';
import { compose } from '../lib/compose.mjs';

const PACK = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const HOOK = join(PACK, 'hooks', 'skill-activation-prompt.mjs');
const all = () => true;

function repo(skills = [], agents = [], files = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'stack-kits-'));
  for (const s of skills) {
    mkdirSync(join(dir, '.claude', 'skills', s), { recursive: true });
    writeFileSync(join(dir, '.claude', 'skills', s, 'SKILL.md'), `---\nname: ${s}\ndescription: x\n---\n`);
  }
  for (const a of agents) {
    mkdirSync(join(dir, '.claude', 'agents'), { recursive: true });
    writeFileSync(join(dir, '.claude', 'agents', `${a}.md`), 'x');
  }
  for (const [p, body] of Object.entries(files)) {
    mkdirSync(dirname(join(dir, p)), { recursive: true });
    writeFileSync(join(dir, p), body);
  }
  return dir;
}

function runHook(dir, prompt, raw) {
  return spawnSync('node', [HOOK], {
    input: raw ?? JSON.stringify({ prompt, cwd: dir }),
    env: { ...process.env, CLAUDE_PROJECT_DIR: dir },
    encoding: 'utf8',
  });
}

const RULES = {
  _precedence: 'DESIGN.md wins.',
  skills: {
    tailwindcss: { priority: 'medium', promptTriggers: { keywords: ['tailwind'] } },
    'web-release-gate': {
      priority: 'critical',
      promptTriggers: { keywords: ['hero'], intentPatterns: ['\\bredesign\\b.*\\bpage\\b'] },
    },
    nextjs: { priority: 'high', promptTriggers: { keywords: ['next.js'], intentPatterns: ['(['] } },
    off: { priority: 'critical', disabled: true, promptTriggers: { keywords: ['hero'] } },
  },
  agents: { 'design-architect': { priority: 'high', promptTriggers: { keywords: ['redesign'] } } },
};

test('orders matches by priority, not by rule order', () => {
  const { skills } = route('Restyle the hero with tailwind on next.js', RULES, all);
  assert.deepEqual(skills.map((s) => s.name), ['web-release-gate', 'nextjs', 'tailwindcss']);
});

test('keywords respect word boundaries, including punctuation-edged ones', () => {
  assert.equal(route('heroic effort', RULES, all).skills.length, 0);
  assert.equal(route('a superhero banner', RULES, all).skills.length, 0);
  assert.equal(route('upgrade next.js', RULES, all).skills[0].name, 'nextjs');
  assert.equal(route('upgrade nextxjs', RULES, all).skills.length, 0);
});

test('an invalid intent regex is skipped, not fatal', () => {
  assert.doesNotThrow(() => route('anything at all', RULES, all));
});

test('disabled rules and rules for missing skills never fire', () => {
  const only = (kind, name) => name !== 'web-release-gate';
  const names = route('hero', RULES, only).skills.map((s) => s.name);
  assert.ok(!names.includes('off'));
  assert.ok(!names.includes('web-release-gate'));
});

test('render lists skills, agents and precedence, and never echoes the prompt', () => {
  const secret = 'redesign the pricing page for ACME-SECRET-123';
  const text = render(route(secret, RULES, all), RULES);
  assert.match(text, /1\. web-release-gate \[critical\]/);
  assert.match(text, /design-architect/);
  assert.match(text, /Precedence: DESIGN\.md wins\./);
  assert.ok(!text.includes('ACME-SECRET-123'));
});

test('no match renders nothing', () => {
  assert.equal(render(route('write a haiku', RULES, all), RULES), '');
});

test('hook end to end: emits UserPromptSubmit JSON only for installed skills', () => {
  const dir = repo(['web-release-gate'], ['design-architect']);
  mkdirSync(join(dir, '.claude', 'skills'), { recursive: true });
  writeFileSync(join(dir, '.claude', 'skills', 'stack-kits.rules.json'), JSON.stringify(RULES));
  const r = runHook(dir, 'redesign the hero');
  assert.equal(r.status, 0);
  const out = JSON.parse(r.stdout);
  assert.equal(out.hookSpecificOutput.hookEventName, 'UserPromptSubmit');
  assert.match(out.hookSpecificOutput.additionalContext, /web-release-gate/);
  assert.doesNotMatch(out.hookSpecificOutput.additionalContext, /tailwindcss/);
});

test('hook never blocks: bad stdin, missing rules, broken rules all exit 0 silently', () => {
  const dir = repo();
  assert.equal(runHook(dir, '', 'not json').status, 0);
  assert.equal(runHook(dir, 'hero').stdout, '');
  mkdirSync(join(dir, '.claude', 'skills'), { recursive: true });
  writeFileSync(join(dir, '.claude', 'skills', 'skill-rules.json'), '{broken');
  writeFileSync(join(dir, '.claude', 'skills', 'stack-kits.rules.json'), '{broken');
  const r = runHook(dir, 'hero');
  assert.equal(r.status, 0);
  assert.equal(r.stdout, '');
});

test('hook rejects path-like skill names', () => {
  const dir = repo(['ok']);
  writeFileSync(
    join(dir, '.claude', 'skills', 'skill-rules.json'),
    JSON.stringify({ skills: { '../../etc': { priority: 'critical', promptTriggers: { keywords: ['hero'] } } } }),
  );
  assert.equal(runHook(dir, 'hero').stdout, '');
});

test('compose keeps only installed targets, applies aliases and local overrides', () => {
  const dir = repo(['tailwindcss', 'nextjs-react-expert', 'web-release-gate', 'mine'], [], {
    'DESIGN.md': '# d',
    '.claude/skills/stack-kits.local.json': JSON.stringify({
      skills: {
        mine: { priority: 'high', promptTriggers: { keywords: ['mine'] } },
        'web-release-gate': { priority: 'high' },
        tailwindcss: { disabled: true },
      },
    }),
  });
  const rules = compose({ target: dir, kits: ['tailwindcss', 'nextjs'], aliases: { nextjs: 'nextjs-react-expert' } });
  assert.ok(!('tailwindcss' in rules.skills), 'local disabled drops a rule');
  assert.ok('nextjs-react-expert' in rules.skills, 'alias renames the kit rule');
  assert.ok(!('nextjs' in rules.skills));
  assert.equal(rules.skills['web-release-gate'].priority, 'high', 'local override merges over estate');
  assert.ok(rules.skills['web-release-gate'].promptTriggers.keywords.includes('hero'), 'merge is shallow per field');
  assert.ok('mine' in rules.skills);
  assert.ok(!('ui-ux-pro-max' in rules.skills), 'estate rule for an absent skill is dropped');
  assert.match(rules._precedence, /DESIGN\.md outrank/);
  assert.match(rules._vendor.commit, /^[0-9a-f]{40}$/);
  for (const r of Object.values(rules.skills)) assert.ok(!('fileTriggers' in r));
});

test('every vendored kit has a fragment, a SKILL.md with frontmatter, and the upstream license', () => {
  for (const kit of readdirSync(join(PACK, 'skills'))) {
    const md = readFileSync(join(PACK, 'skills', kit, 'SKILL.md'), 'utf8');
    assert.match(md, /^---\nname: [a-z0-9-]+\n/m, kit);
    assert.ok(existsSync(join(PACK, 'skills', kit, 'UPSTREAM-LICENSE')), kit);
    const frag = JSON.parse(readFileSync(join(PACK, 'rules', 'kits', `${kit}.json`), 'utf8'));
    assert.ok(frag[kit], `${kit} fragment keyed by kit name`);
  }
});

test('estate rule regexes all compile', () => {
  const estate = JSON.parse(readFileSync(join(PACK, 'rules', 'estate.json'), 'utf8'));
  for (const bucket of ['skills', 'agents']) {
    for (const [name, rule] of Object.entries(estate[bucket])) {
      if (name.startsWith('_')) continue;
      for (const p of rule.promptTriggers?.intentPatterns || []) assert.doesNotThrow(() => new RegExp(p, 'i'), `${name}: ${p}`);
    }
  }
});

test('install.sh: detects the stack, preserves other hooks, aliases equivalents, is idempotent', () => {
  const dir = repo(['nextjs-react-expert', 'web-release-gate'], [], {
    'package.json': JSON.stringify({ dependencies: { next: '16', react: '19' } }),
    'apps/web/package.json': JSON.stringify({ devDependencies: { tailwindcss: '4' } }),
    '.claude/settings.json': JSON.stringify({
      hooks: { UserPromptSubmit: [{ hooks: [{ type: 'command', command: 'bash existing.sh' }] }] },
    }),
  });
  const sh = join(PACK, 'install.sh');
  const first = execFileSync('bash', [sh, dir], { encoding: 'utf8' });
  assert.match(first, /stack\s+nextjs,react,tailwindcss/);
  assert.match(first, /route\s+nextjs → existing nextjs-react-expert/);
  assert.ok(existsSync(join(dir, '.claude', 'skills', 'tailwindcss', 'SKILL.md')));
  assert.ok(!existsSync(join(dir, '.claude', 'skills', 'nextjs')));

  const settings = () => JSON.parse(readFileSync(join(dir, '.claude', 'settings.json'), 'utf8'));
  const cmds = () => settings().hooks.UserPromptSubmit.flatMap((e) => e.hooks.map((h) => h.command));
  assert.deepEqual(cmds(), ['bash existing.sh', 'node .claude/hooks/skill-activation-prompt.mjs']);

  const rulesBefore = readFileSync(join(dir, '.claude', 'skills', 'stack-kits.rules.json'), 'utf8');
  const second = execFileSync('bash', [sh, dir], { encoding: 'utf8' });
  assert.match(second, /keep\s+tailwindcss \(already current\)/);
  assert.match(second, /router unchanged/);
  assert.deepEqual(cmds(), ['bash existing.sh', 'node .claude/hooks/skill-activation-prompt.mjs']);
  assert.equal(readFileSync(join(dir, '.claude', 'skills', 'stack-kits.rules.json'), 'utf8'), rulesBefore);

  const r = runHook(dir, 'make the hero responsive with tailwind');
  const ctx = JSON.parse(r.stdout).hookSpecificOutput.additionalContext;
  assert.ok(ctx.indexOf('web-release-gate') < ctx.indexOf('tailwindcss'), 'gate is read before the kit');
});

test('install.sh: a locally edited kit is set aside, never deleted', () => {
  const dir = repo([], [], { 'package.json': JSON.stringify({ dependencies: { tailwindcss: '3' } }) });
  const sh = join(PACK, 'install.sh');
  execFileSync('bash', [sh, dir], { encoding: 'utf8' });
  writeFileSync(join(dir, '.claude', 'skills', 'tailwindcss', 'LOCAL.md'), 'mine');
  const out = execFileSync('bash', [sh, dir], { encoding: 'utf8' });
  assert.match(out, /update tailwindcss/);
  assert.ok(existsSync(join(dir, '.claude', 'skills', '.replaced', 'tailwindcss', 'LOCAL.md')));
});

test('router reads a repo\'s own ACOS-schema skill-rules.json; composed rules win a name clash', () => {
  const dir = repo(['frankx-brand', 'web-release-gate']);
  writeFileSync(
    join(dir, '.claude', 'skills', 'skill-rules.json'),
    JSON.stringify({
      version: '8.0.0',
      skills: {
        'frankx-brand': { priority: 'critical', triggers: { keywords: ['headline'] } },
        'web-release-gate': { priority: 'low', triggers: { keywords: ['zzz'] } },
      },
    }),
  );
  writeFileSync(
    join(dir, '.claude', 'skills', 'stack-kits.rules.json'),
    JSON.stringify({ skills: { 'web-release-gate': { priority: 'critical', promptTriggers: { keywords: ['hero'] } } } }),
  );
  const ctx = JSON.parse(runHook(dir, 'rewrite the hero headline').stdout).hookSpecificOutput.additionalContext;
  assert.match(ctx, /frankx-brand \[critical\]/);
  assert.match(ctx, /web-release-gate \[critical\]/);
  assert.equal(runHook(dir, 'zzz').stdout, '', 'the legacy definition of a clashing name is replaced, not merged');
});

test('install.sh never writes a repo\'s own skill-rules.json', () => {
  const legacy = JSON.stringify({ version: '8.0.0', skills: { x: { triggers: { keywords: ['x'] } } } }, null, 1);
  const dir = repo([], [], {
    'package.json': JSON.stringify({ dependencies: { tailwindcss: '3' } }),
    '.claude/skills/skill-rules.json': legacy,
  });
  execFileSync('bash', [join(PACK, 'install.sh'), dir], { encoding: 'utf8' });
  assert.equal(readFileSync(join(dir, '.claude', 'skills', 'skill-rules.json'), 'utf8'), legacy);
  assert.ok(existsSync(join(dir, '.claude', 'skills', 'stack-kits.rules.json')));
});

test('compose unions triggers when two kits alias to the same skill', () => {
  const dir = repo(['nextjs-react-expert']);
  const rules = compose({
    target: dir,
    kits: ['nextjs', 'react'],
    aliases: { nextjs: 'nextjs-react-expert', react: 'nextjs-react-expert' },
  });
  const r = rules.skills['nextjs-react-expert'];
  assert.equal(r.priority, 'high', 'keeps the stronger of high (nextjs) and medium (react)');
  assert.ok(r.promptTriggers.keywords.includes('app router'), 'nextjs triggers survive');
  assert.ok(r.promptTriggers.keywords.includes('useEffect'), 'react triggers added');
});

test('install.sh names the .gitignore lines a whitelisting repo is missing', () => {
  const dir = repo([], [], {
    'package.json': JSON.stringify({ dependencies: { tailwindcss: '4' } }),
    '.gitignore': '.claude/*\n!.claude/skills/\n.claude/skills/*/\n',
  });
  execFileSync('git', ['init', '-q'], { cwd: dir });
  const out = execFileSync('bash', [join(PACK, 'install.sh'), dir], { encoding: 'utf8' });
  assert.match(out, /!!\.claude\/hooks\/skill-activation-prompt\.mjs|!\.claude\/hooks\/skill-activation-prompt\.mjs/);
  assert.match(out, /!\.claude\/skills\/tailwindcss\//);
});
