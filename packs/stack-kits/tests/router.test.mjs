// Router + composer + installer tests for packs/stack-kits. Zero dependencies:
//   node --test packs/stack-kits/tests/*.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import { route, render, projectDir } from '../hooks/skill-activation-prompt.mjs';
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

test('framework kits rank right after the gate, so a broad prompt cannot cap them out', () => {
  // Four high-priority specialists and three medium kits all match; the cap is 6.
  const kit = (kw) => ({ priority: 'medium', stage: 'framework', promptTriggers: { keywords: [kw] } });
  const high = (kw) => ({ priority: 'high', promptTriggers: { keywords: [kw] } });
  const rules = {
    skills: {
      'web-design-guidelines': high('accessibility'),
      'core-web-vitals': high('performance'),
      'canon-check': high('guardian'),
      'apple-design': high('responsive'),
      react: kit('react'),
      tailwindcss: kit('tailwind'),
      shadcn: kit('shadcn'),
      'web-release-gate': { priority: 'critical', promptTriggers: { keywords: ['homepage'] } },
    },
  };
  const { skills } = route(
    'Redesign the responsive Next.js homepage with React, Tailwind, shadcn, accessibility, performance, and Guardian copy',
    rules,
    all,
  );
  assert.deepEqual(skills.map((s) => s.name), [
    'web-release-gate',
    'react',
    'tailwindcss',
    'shadcn',
    'web-design-guidelines',
    'core-web-vitals',
  ]);
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
  assert.deepEqual(cmds(), ['bash existing.sh', 'node "${CLAUDE_PROJECT_DIR}/.claude/hooks/skill-activation-prompt.mjs"']);

  const rulesBefore = readFileSync(join(dir, '.claude', 'skills', 'stack-kits.rules.json'), 'utf8');
  const second = execFileSync('bash', [sh, dir], { encoding: 'utf8' });
  assert.match(second, /keep\s+tailwindcss \(already current\)/);
  assert.match(second, /router unchanged/);
  assert.deepEqual(cmds(), ['bash existing.sh', 'node "${CLAUDE_PROJECT_DIR}/.claude/hooks/skill-activation-prompt.mjs"']);
  assert.equal(readFileSync(join(dir, '.claude', 'skills', 'stack-kits.rules.json'), 'utf8'), rulesBefore);

  const r = runHook(dir, 'make the hero responsive with tailwind');
  const ctx = JSON.parse(r.stdout).hookSpecificOutput.additionalContext;
  assert.ok(ctx.indexOf('web-release-gate') < ctx.indexOf('tailwindcss'), 'gate is read before the kit');
});

test('install.sh: a locally edited kit is set aside, never deleted', () => {
  const dir = repo([], [], { 'package.json': JSON.stringify({ dependencies: { tailwindcss: '4' } }) });
  const sh = join(PACK, 'install.sh');
  execFileSync('bash', [sh, dir], { encoding: 'utf8' });
  writeFileSync(join(dir, '.claude', 'skills', 'tailwindcss', 'LOCAL.md'), 'mine');
  const out = execFileSync('bash', [sh, dir], { encoding: 'utf8' });
  assert.match(out, /update tailwindcss/);
  assert.ok(existsSync(join(dir, '.claude', 'skills', '.replaced', 'tailwindcss', 'LOCAL.md')));
});

test('router merges a repo\'s own ACOS-schema rule with the composed rule of the same name', () => {
  const dir = repo(['frankx-brand', 'web-release-gate']);
  writeFileSync(
    join(dir, '.claude', 'skills', 'skill-rules.json'),
    JSON.stringify({
      version: '8.0.0',
      skills: {
        'frankx-brand': { priority: 'critical', triggers: { keywords: ['blog post', 'frankx'] } },
        'web-release-gate': { priority: 'low', triggers: { keywords: ['zzz'] } },
      },
    }),
  );
  writeFileSync(
    join(dir, '.claude', 'skills', 'stack-kits.rules.json'),
    JSON.stringify({
      skills: {
        'frankx-brand': { priority: 'medium', description: 'brand', promptTriggers: { keywords: ['headline'] } },
        'web-release-gate': { priority: 'critical', promptTriggers: { keywords: ['hero'] } },
      },
    }),
  );
  const ctx = (prompt) => {
    const out = runHook(dir, prompt).stdout;
    return out ? JSON.parse(out).hookSpecificOutput.additionalContext : '';
  };
  assert.match(ctx('Write a FrankX blog post'), /frankx-brand \[critical\] — brand/, 'repo triggers and priority survive');
  assert.match(ctx('rewrite the hero headline'), /frankx-brand \[critical\]/, 'composed triggers are added');
  assert.match(ctx('zzz'), /web-release-gate \[critical\]/, 'the stronger priority wins either way');
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

test('compose tags kit rules, aliased or not, as the framework stage and nothing else', () => {
  const dir = repo(['tailwindcss', 'nextjs-react-expert', 'web-release-gate']);
  const rules = compose({ target: dir, kits: ['tailwindcss', 'nextjs'], aliases: { nextjs: 'nextjs-react-expert' } });
  assert.equal(rules.skills.tailwindcss.stage, 'framework');
  assert.equal(rules.skills['nextjs-react-expert'].stage, 'framework', 'an aliased kit keeps its stage');
  assert.ok(!('stage' in rules.skills['web-release-gate']), 'estate rules are not framework kits');
});

test('an empty SKILL.md is treated as missing by the router, compose and the installer', () => {
  const dir = repo(['web-release-gate'], [], {
    '.claude/skills/nextjs-react-expert/SKILL.md': '',
    'package.json': JSON.stringify({ dependencies: { next: '16', react: '19' } }),
  });
  const out = execFileSync('bash', [join(PACK, 'install.sh'), dir], { encoding: 'utf8' });
  assert.doesNotMatch(out, /route\s+nextjs → existing nextjs-react-expert/, 'no alias to an empty skill');
  assert.ok(existsSync(join(dir, '.claude', 'skills', 'nextjs', 'SKILL.md')), 'the kit is installed instead');
  const rulesFile = JSON.parse(readFileSync(join(dir, '.claude', 'skills', 'stack-kits.rules.json'), 'utf8'));
  assert.ok(!('nextjs-react-expert' in rulesFile.skills), 'compose drops the empty target');
  const aliased = compose({ target: dir, kits: ['nextjs'], aliases: { nextjs: 'nextjs-react-expert' } });
  assert.ok(!('nextjs-react-expert' in aliased.skills), 'compose drops a rule aimed at an empty skill');
  writeFileSync(
    join(dir, '.claude', 'skills', 'stack-kits.rules.json'),
    JSON.stringify({ skills: { 'nextjs-react-expert': { priority: 'high', promptTriggers: { keywords: ['next.js'] } } } }),
  );
  assert.equal(runHook(dir, 'add a next.js route').stdout, '', 'the router refuses an empty skill');
});

test('install.sh: the v4 tailwindcss kit is skipped on Tailwind v3, and an unedited copy is retired', () => {
  const dir = repo(['web-release-gate'], [], {
    'package.json': JSON.stringify({ dependencies: { next: '16', react: '19' }, devDependencies: { tailwindcss: '^3.4.17' } }),
  });
  mkdirSync(join(dir, '.claude', 'skills'), { recursive: true });
  execFileSync('cp', ['-R', join(PACK, 'skills', 'tailwindcss'), join(dir, '.claude', 'skills', 'tailwindcss')]);
  const out = execFileSync('bash', [join(PACK, 'install.sh'), dir], { encoding: 'utf8' });
  assert.match(out, /stack\s+nextjs,react\n/);
  assert.match(out, /retire tailwindcss \(a workspace here is on Tailwind v3/);
  assert.ok(!existsSync(join(dir, '.claude', 'skills', 'tailwindcss')), 'no v4 guidance left for the harness to offer');
  assert.ok(existsSync(join(dir, '.claude', 'skills', '.replaced', 'tailwindcss', 'SKILL.md')), 'moved, never deleted');
  const rules = JSON.parse(readFileSync(join(dir, '.claude', 'skills', 'stack-kits.rules.json'), 'utf8'));
  assert.ok(!('tailwindcss' in rules.skills));

  const edited = repo([], [], { 'package.json': JSON.stringify({ devDependencies: { tailwindcss: '3.4.1' } }) });
  mkdirSync(join(edited, '.claude', 'skills', 'tailwindcss'), { recursive: true });
  writeFileSync(join(edited, '.claude', 'skills', 'tailwindcss', 'SKILL.md'), '---\nname: tailwindcss\ndescription: ours\n---\n');
  const out2 = execFileSync('bash', [join(PACK, 'install.sh'), edited], { encoding: 'utf8' });
  assert.match(out2, /warn\s+tailwindcss is locally edited, so it stays/);
  assert.ok(existsSync(join(edited, '.claude', 'skills', 'tailwindcss', 'SKILL.md')));

  const v4 = repo([], [], { 'package.json': JSON.stringify({ devDependencies: { '@tailwindcss/postcss': '^4.1.0' } }) });
  assert.match(execFileSync('bash', [join(PACK, 'install.sh'), v4], { encoding: 'utf8' }), /stack\s+tailwindcss/);

  // A monorepo with a v3 web app and a v4 side app: the v3 app decides.
  const mixed = repo([], [], {
    'package.json': JSON.stringify({ dependencies: { react: '19' } }),
    'apps/web/package.json': JSON.stringify({ dependencies: { tailwindcss: '^3.4.9' } }),
    'apps/hub/package.json': JSON.stringify({ dependencies: { tailwindcss: '^4.0.0', '@tailwindcss/postcss': '^4.3.3' } }),
  });
  const out3 = execFileSync('bash', [join(PACK, 'install.sh'), mixed], { encoding: 'utf8' });
  assert.match(out3, /stack\s+react\n/);
  assert.match(out3, /skip\s+tailwindcss \(a workspace here is on Tailwind v3/);
});

test('the release gate fires for UI creation and styling, not for book pages', () => {
  const dir = repo(['web-release-gate']);
  const rules = compose({ target: dir, kits: [], aliases: {} });
  const names = (p) => route(p, rules, all).skills.map((s) => s.name);
  assert.ok(names('Create a settings page component').includes('web-release-gate'));
  assert.ok(names('Style this component with CSS').includes('web-release-gate'));
  assert.ok(!names('add a page to chapter 3 of the book').includes('web-release-gate'));
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

test('routes by the rules of the checkout the hook runs in, not where the session started', () => {
  // A worktree session: CLAUDE_PROJECT_DIR stays on the main checkout while cwd
  // follows the worktree (and any `cd` inside it).
  const rule = (kw) => JSON.stringify({ skills: { [kw]: { priority: 'high', promptTriggers: { keywords: ['hero'] } } } });
  const main = repo(['main-only'], [], { '.claude/skills/stack-kits.rules.json': rule('main-only') });
  const tree = repo(['branch-only'], [], {
    '.claude/skills/stack-kits.rules.json': rule('branch-only'),
    'apps/web/app/page.tsx': '',
  });
  const sub = join(tree, 'apps', 'web');
  assert.equal(projectDir({ cwd: sub }, { CLAUDE_PROJECT_DIR: main }), tree);
  assert.equal(projectDir({ cwd: tmpdir() }, { CLAUDE_PROJECT_DIR: main }), main, 'falls back when no rules are found');
  assert.equal(projectDir({}, { CLAUDE_PROJECT_DIR: main }), main);

  const r = spawnSync('node', [HOOK], {
    input: JSON.stringify({ prompt: 'restyle the hero', cwd: sub }),
    env: { ...process.env, CLAUDE_PROJECT_DIR: main },
    encoding: 'utf8',
  });
  const ctx = JSON.parse(r.stdout).hookSpecificOutput.additionalContext;
  assert.match(ctx, /branch-only/);
  assert.doesNotMatch(ctx, /main-only/);
});

test('install.sh upgrades an older relative router command in place, never adding a second', () => {
  const dir = repo([], [], {
    'package.json': JSON.stringify({ dependencies: { next: '16', react: '19' } }),
    '.claude/settings.json': JSON.stringify({
      hooks: {
        UserPromptSubmit: [
          { hooks: [{ type: 'command', command: 'node .claude/hooks/skill-activation-prompt.mjs', timeout: 5 }] },
          { hooks: [{ type: 'command', command: 'bash existing.sh' }] },
        ],
      },
    }),
  });
  const out = execFileSync('bash', [join(PACK, 'install.sh'), dir], { encoding: 'utf8' });
  assert.match(out, /router upgraded/);
  const cmds = JSON.parse(readFileSync(join(dir, '.claude', 'settings.json'), 'utf8'))
    .hooks.UserPromptSubmit.flatMap((e) => e.hooks.map((h) => h.command));
  assert.deepEqual(cmds, ['node "${CLAUDE_PROJECT_DIR}/.claude/hooks/skill-activation-prompt.mjs"', 'bash existing.sh']);
});

test('a checkout without routing rules routes nothing, rather than borrowing the main checkout\'s', () => {
  const rule = JSON.stringify({ skills: { 'main-only': { priority: 'high', promptTriggers: { keywords: ['hero'] } } } });
  const main = repo(['main-only'], [], { '.claude/skills/stack-kits.rules.json': rule });
  const tree = repo([], [], { '.git': 'gitdir: /elsewhere/.git/worktrees/old\n', 'app/page.tsx': '' });
  assert.equal(projectDir({ cwd: join(tree, 'app') }, { CLAUDE_PROJECT_DIR: main }), tree);
  const r = spawnSync('node', [HOOK], {
    input: JSON.stringify({ prompt: 'restyle the hero', cwd: join(tree, 'app') }),
    env: { ...process.env, CLAUDE_PROJECT_DIR: main },
    encoding: 'utf8',
  });
  assert.equal(r.stdout.trim(), '', 'no rules in this checkout means no routing');
});
