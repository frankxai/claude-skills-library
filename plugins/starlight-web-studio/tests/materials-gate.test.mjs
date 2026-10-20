import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, symlinkSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { runGate, checkDesignMd, hasYamlTokens, validMotionScore, stripComments, insideRoot, pathHasLink, SECTION_ORDER } from '../bin/materials-gate.mjs';

const GATE = fileURLToPath(new URL('../bin/materials-gate.mjs', import.meta.url));

const GOOD_DESIGN = `---
name: Fixture
colors:
  primary: "#6EA8FE"
---
## Overview
Prose.
## Colors
## Typography
## Components
## Do's and Don'ts
`;

const SCORE = `| Beat | Trigger | What moves | Why | Duration | Reduced-motion state |
|---|---|---|---|---|---|
| Hero reveal | load | headline | focus | 400ms | static |
`;

const GATED_GLASS = `import { gpuPlan } from './glass-gate';
export function Glass() { const plan = gpuPlan(env); return plan.mode === 'webgl' ? <LiquidGlass /> : <div style={{ backdropFilter: 'blur(12px)' }} />; }
`;

function fixture(files) {
  const root = mkdtempSync(join(tmpdir(), 'materials-gate-'));
  for (const [rel, content] of Object.entries(files)) {
    const full = join(root, rel);
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, content);
  }
  return root;
}

const byId = (result, id) => result.checks.find((c) => c.id === id);

test('a repo with DESIGN.md, gated glass, one lifecycle-aware GPU surface and a real motion score passes', () => {
  const root = fixture({
    'DESIGN.md': GOOD_DESIGN,
    'app/page.tsx': `import { Glass } from '@/components/glass';\nexport default function Page() { return <Glass />; }\n`,
    'components/glass.tsx': GATED_GLASS,
    'components/glass-gate.ts': `export function gpuPlan() {}\n`,
    'components/scene.tsx': `import * as THREE from 'three';\nconst poster = '/hero.webp';\nconst io = new IntersectionObserver(() => {});\n`,
    'components/reveal.tsx': `import gsap from 'gsap';\n`,
    '.studio/home/motion-score.md': SCORE,
    '.studio/home/prototype.html': `<svg><feDisplacementMap /></svg>`,
  });
  const result = runGate(root);
  assert.equal(result.errors, 0, JSON.stringify(result.checks, null, 2));
  assert.equal(result.pass, true);
});

test('a missing DESIGN.md is an error', () => {
  const result = runGate(fixture({ 'app/page.tsx': 'export default () => null;\n' }));
  assert.equal(byId(result, 'design-md').level, 'error');
  assert.equal(result.pass, false);
});

test('DESIGN.md sections must follow the spec order and never repeat', () => {
  const out = checkDesignMd(fixture({ 'DESIGN.md': `---\nname: x\n---\n## Typography\n## Colors\n` }));
  assert.equal(out.level, 'error');
  assert.match(out.detail, /out of spec order: Colors/);
  const dup = checkDesignMd(fixture({ 'DESIGN.md': `---\nname: x\n---\n## Colors\n## Colors\n` }));
  assert.match(dup.detail, /duplicate sections: Colors/);
});

test('a bare front-matter delimiter is not tokens; a key: value line is', () => {
  assert.equal(hasYamlTokens(`---\n---\n## Overview\n`), false);
  assert.equal(hasYamlTokens(`---\nname: x\n---\n`), true);
  assert.equal(hasYamlTokens('## Colors\n```yaml\nprimary: "#fff"\n```\n'), true);
  assert.equal(hasYamlTokens('## Colors\n```yaml\n\n```\n'), false);
  const check = checkDesignMd(fixture({ 'DESIGN.md': `---\n---\n## Overview\nJust words.\n` }));
  assert.equal(check.level, 'warn');
});

test('spec aliases resolve to canonical sections', () => {
  const root = fixture({ 'DESIGN.md': `---\nname: x\n---\n## Brand & Style\n## Layout & Spacing\n## Elevation\n` });
  assert.equal(checkDesignMd(root).ok, true);
  assert.equal(SECTION_ORDER[0], 'Overview');
});

test('refracting glass with no gate call or import fails, including lowercase liquidgl and SVG filters', () => {
  const root = fixture({
    'DESIGN.md': GOOD_DESIGN,
    'components/panel.tsx': `export const Panel = () => <svg><feDisplacementMap scale="40" /></svg>;\n`,
    'components/lens.ts': `import liquidGL from 'liquidgl';\nliquidGL({ target: '.lens' });\n`,
    'public/refract.svg': `<svg><filter id="r"><feDisplacementMap scale="20"/></filter></svg>`,
  });
  const check = byId(runGate(root), 'glass-gated');
  assert.equal(check.level, 'error');
  assert.match(check.detail, /panel\.tsx/);
  assert.match(check.detail, /lens\.ts/);
  assert.match(check.detail, /refract\.svg/);
});

test('a comment or a sibling file name is not a gate', () => {
  const root = fixture({
    'DESIGN.md': GOOD_DESIGN,
    'lab/glass.tsx': `// reduced-transparency is handled elsewhere\nexport const G = () => <LiquidGlass />;\n`,
    'lab/glass-gate.ts': `export const x = 1;\n`,
  });
  const check = byId(runGate(root), 'glass-gated');
  assert.equal(check.level, 'error');
  assert.match(check.detail, /glass\.tsx/);
});

test('a matchMedia reduced-transparency call or a gate import counts as gated', () => {
  const root = fixture({
    'DESIGN.md': GOOD_DESIGN,
    'a/glass.tsx': `const r = matchMedia('(prefers-reduced-transparency: reduce)').matches;\nexport const A = () => r ? null : <LiquidGlass />;\n`,
    'b/glass.tsx': GATED_GLASS,
  });
  assert.equal(byId(runGate(root), 'glass-gated').ok, true);
});

test('plain CSS blur is the baseline tier and needs no gate', () => {
  const root = fixture({ 'DESIGN.md': GOOD_DESIGN, 'components/panel.css': `.panel { backdrop-filter: blur(20px); }\n` });
  const check = byId(runGate(root), 'glass-gated');
  assert.equal(check.ok, true);
  assert.match(check.detail, /1 CSS blur file/);
});

test('two GPU modules behind a barrel and an @/ alias are still counted on the route', () => {
  const root = fixture({
    'DESIGN.md': GOOD_DESIGN,
    'tsconfig.json': `{ "compilerOptions": { "paths": { "@/*": ["./src/*"] } } }`,
    'src/app/page.tsx': `import { Hero } from '@/components';\nexport default function Page() { return <Hero />; }\n`,
    'src/components/index.ts': `export * from './hero';\n`,
    'src/components/hero.tsx': `import { Orb } from './orb';\nimport { Field } from './field';\nexport const Hero = () => <><Orb /><Field /></>;\n`,
    'src/components/orb.tsx': `import * as THREE from 'three';\nconst poster = 1; const io = new IntersectionObserver(() => {});\n`,
    'src/components/field.tsx': `const { Canvas } = require('@react-three/fiber');\nconst poster = 1; document.addEventListener('visibilitychange', () => {});\n`,
  });
  const check = byId(runGate(root), 'one-gpu-surface');
  assert.equal(check.level, 'error');
  assert.match(check.detail, /page\.tsx \(2 GPU modules/);
});

test('a GPU module in a layout plus one in the page is two on that route', () => {
  const root = fixture({
    'DESIGN.md': GOOD_DESIGN,
    'app/layout.tsx': `import { Bg } from '../components/bg';\n`,
    'app/page.tsx': `import { Orb } from '../components/orb';\n`,
    'components/bg.tsx': `import { Mesh } from 'ogl';\nconst poster = 1; const io = new IntersectionObserver(() => {});\n`,
    'components/orb.tsx': `import * as THREE from 'three';\nconst poster = 1; const io = new IntersectionObserver(() => {});\n`,
  });
  assert.equal(byId(runGate(root), 'one-gpu-surface').level, 'error');
});

test('unresolved imports are reported as incomplete coverage, not silence', () => {
  const root = fixture({
    'DESIGN.md': GOOD_DESIGN,
    'app/page.tsx': `import { X } from '~/somewhere';\n`,
  });
  assert.match(byId(runGate(root), 'one-gpu-surface').detail, /unresolved, coverage incomplete: ~\/somewhere/);
});

test('a GPU module that never watches visibility is an error; a missing poster word is a warning', () => {
  const root = fixture({ 'DESIGN.md': GOOD_DESIGN, 'components/orb.tsx': `import * as THREE from 'three';\n` });
  const result = runGate(root);
  assert.equal(byId(result, 'gpu-lifecycle').level, 'error');
  assert.equal(byId(result, 'poster-first').level, 'warn');
  assert.match(byId(result, 'poster-first').detail, /orb\.tsx/);
});

test('dynamic and CommonJS imports and motion/react count as motion libraries', () => {
  const root = fixture({
    'DESIGN.md': GOOD_DESIGN,
    'components/a.tsx': `const g = await import('gsap');\n`,
    'components/b.tsx': `import { motion } from 'motion/react';\n`,
  });
  const check = byId(runGate(root), 'motion-scored');
  assert.equal(check.level, 'error');
  assert.match(check.detail, /2 file\(s\)/);
});

test('type-only imports and comments ship nothing', () => {
  const root = fixture({
    'DESIGN.md': GOOD_DESIGN,
    'components/types.tsx': `import type { Mesh } from 'three';\n/* import gsap from 'gsap' */\n// const t = require('three')\n`,
  });
  const result = runGate(root);
  assert.equal(byId(result, 'motion-scored').ok, true);
  assert.match(byId(result, 'one-gpu-surface').detail, /^0 GPU module/);
  assert.equal(stripComments(`a // x\nb /* y */ c`).trim(), 'a \nb  c');
});

test('a motion score must be the exact file name with a reduced-motion column and a beat row', () => {
  assert.equal(validMotionScore(SCORE), true);
  assert.equal(validMotionScore(''), false);
  assert.equal(validMotionScore(`| Beat | Trigger |\n|---|---|\n| x | y |\n`), false);
  const wrongName = fixture({ 'DESIGN.md': GOOD_DESIGN, 'components/s.tsx': `import gsap from 'gsap';\n`, 'old/not-motion-score.md': SCORE });
  assert.equal(byId(runGate(wrongName), 'motion-scored').level, 'error');
  const empty = fixture({ 'DESIGN.md': GOOD_DESIGN, 'components/s.tsx': `import gsap from 'gsap';\n`, 'docs/motion-score.md': '' });
  assert.match(byId(runGate(empty), 'motion-scored').detail, /none has a header/);
  const scored = fixture({ 'DESIGN.md': GOOD_DESIGN, 'components/s.tsx': `import gsap from 'gsap';\n`, 'docs/motion-score.md': SCORE });
  assert.equal(byId(runGate(scored), 'motion-scored').ok, true);
});

test('colour literals in rgb and hsl form count, and only relative token paths are exempt', () => {
  const hexes = Array.from({ length: 15 }, (_, i) => `'#${(0x100000 + i * 7919).toString(16).slice(0, 6)}'`);
  const fns = Array.from({ length: 10 }, (_, i) => `'rgb(${i}, 0, 0)'`);
  const root = fixture({
    'DESIGN.md': GOOD_DESIGN,
    'components/soup.tsx': [...hexes, ...fns].map((c) => `const c = ${c};`).join('\n'),
    'theme/tokens.ts': hexes.map((c) => `export const t = ${c};`).join('\n'),
  });
  const check = byId(runGate(root), 'raw-colour');
  assert.equal(check.level, 'warn');
  assert.match(check.detail, /25 distinct/);
});

test('tests, fixtures, .studio prototypes, dot folders and build output are never judged as product', () => {
  const root = fixture({
    'DESIGN.md': GOOD_DESIGN,
    'tests/glass.test.tsx': `const s = 'feDisplacementMap';\n`,
    'src/__fixtures__/glass.tsx': `export const G = () => <LiquidGlass />;\n`,
    'node_modules/x/glass.css': `backdrop-filter: blur(1px)`,
    '.next/static/chunk.js': `import * as THREE from 'three'`,
    '.claude/worktrees/x/app/glass.tsx': `const LiquidGlass = 1;\n`,
    '.chrome-profile/Default/Extensions/a/b.js': `feDisplacementMap`,
  });
  const result = runGate(root);
  assert.equal(result.errors, 0, JSON.stringify(result.checks));
});

test('alias targets and ../ imports that leave the scanned root are never resolved', () => {
  assert.equal(insideRoot('C:\\repo', '\\\\attacker\\share\\x'), false);
  assert.equal(insideRoot('/repo', '//attacker/share/x'), false);
  assert.equal(insideRoot(join(tmpdir(), 'r'), join(tmpdir(), 'other', 'x.ts')), false);
  assert.equal(insideRoot(join(tmpdir(), 'r'), join(tmpdir(), 'r', 'src', 'x.ts')), true);
  const outside = fixture({ 'leak/orb.tsx': `import * as THREE from 'three';\n` });
  const root = fixture({
    'DESIGN.md': GOOD_DESIGN,
    'tsconfig.json': JSON.stringify({ compilerOptions: { paths: { '@/*': ['\\\\\\\\attacker\\\\share\\\\*', '../../*'], '~/*': [outside.replace(/\\/g, '/') + '/*'] } } }),
    'app/page.tsx': `import { A } from '@/leak/orb';\nimport { B } from '~/leak/orb';\nimport { C } from '${'../'.repeat(6)}etc/passwd';\n`,
  });
  const check = byId(runGate(root), 'one-gpu-surface');
  assert.equal(check.ok, true, check.detail);
  assert.match(check.detail, /^0 GPU module/);
  assert.match(check.detail, /unresolved, coverage incomplete/);
});

test('a candidate under a junction or symlink inside the root is never stat-ed', () => {
  const outside = fixture({ 'orb.tsx': `import * as THREE from 'three';\n` });
  const root = fixture({
    'DESIGN.md': GOOD_DESIGN,
    'app/page.tsx': `import { A } from '../linked/orb';\n`,
  });
  symlinkSync(outside, join(root, 'linked'), 'junction');
  assert.equal(pathHasLink(root, join(root, 'linked', 'orb.tsx')), true);
  assert.equal(pathHasLink(root, join(root, 'app', 'page.tsx')), false);
  const check = byId(runGate(root), 'one-gpu-surface');
  assert.match(check.detail, /^0 GPU module/);
  assert.match(check.detail, /unresolved, coverage incomplete: \.\.\/linked\/orb/);
});

test('the CLI runs from a path with spaces, prints a report and exits 1 on a failing repo', () => {
  const root = mkdtempSync(join(tmpdir(), 'materials gate space '));
  const copy = join(root, 'materials-gate.mjs');
  writeFileSync(copy, readFileSync(GATE, 'utf8'));
  const target = fixture({ 'app/page.tsx': 'export default () => null;\n' });
  const run = spawnSync(process.execPath, [copy, target], { encoding: 'utf8' });
  assert.equal(run.status, 1, run.stderr);
  assert.match(run.stdout, /Materials gate: FAIL/);
  const missing = spawnSync(process.execPath, [copy, join(target, 'nope')], { encoding: 'utf8' });
  assert.equal(missing.status, 2);
});
