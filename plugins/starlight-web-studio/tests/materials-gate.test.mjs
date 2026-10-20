import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, symlinkSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  runGate, checkDesignMd, hasYamlTokens, validMotionScore, lex, importsOf, readAliases,
  insideRoot, pathHasLink, SECTION_ORDER,
} from '../bin/materials-gate.mjs';

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

// A renderer that does everything the contract asks, in code rather than in words.
const GOOD_RENDERER = `import * as THREE from 'three';
export function Scene({ poster }) {
  const renderer = new THREE.WebGLRenderer();
  const io = new IntersectionObserver(() => renderer.setAnimationLoop(null));
  return <img src={poster} />;
}
`;
const GATED_GLASS = `import { gpuPlan } from './glass-gate';
export function Glass() { return gpuPlan(env).mode === 'webgl' ? <LiquidGlass /> : <div className="blur" />; }
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
const file = (content) => {
  const root = fixture({ 'x.tsx': content });
  return join(root, 'x.tsx');
};

// --- lexer ---------------------------------------------------------------------------------

test('lexer: comments become a space, strings become empty quotes, specifiers are kept', () => {
  const { code, strings } = lex(`const u = "https://x//asset"; import * as T from 'three'; /* gpu */ Plan( // tail\nconst t = \`a\${b}c\`;`);
  assert.match(code, /import \* as T from ''/);
  assert.doesNotMatch(code, /https/);
  assert.match(code, /  Plan\( /);
  assert.doesNotMatch(code, /tail/);
  assert.deepEqual(strings.map((s) => s.value), ['https://x//asset', 'three', 'ac']);
  assert.equal(strings[2].template, true);
});

test('importsOf: static, side-effect, dynamic, require; type-only forms dropped, strings never read as code', () => {
  const f = file(`import 'gsap';
import { Mesh } from 'three';
import type { Group } from 'three';
import { type Camera, type Light } from '@react-three/fiber';
import {
  type A,
} from 'ogl';
const g = await import('gsap/ScrollTrigger');
const l = require('lenis');
const fake = "from 'motion'";
`);
  assert.deepEqual(importsOf(f), ['gsap', 'three', 'gsap/ScrollTrigger', 'lenis']);
});

test('a runtime import on the same line as a type import survives', () => {
  const f = file(`import type { X } from 'three'; import gsap from 'gsap';\n`);
  assert.deepEqual(importsOf(f), ['gsap']);
});

// --- DESIGN.md -----------------------------------------------------------------------------

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
  assert.equal(checkDesignMd(fixture({ 'DESIGN.md': `---\n---\n## Overview\nJust words.\n` })).level, 'warn');
});

test('spec aliases resolve to canonical sections', () => {
  const root = fixture({ 'DESIGN.md': `---\nname: x\n---\n## Brand & Style\n## Layout & Spacing\n## Elevation\n` });
  assert.equal(checkDesignMd(root).ok, true);
  assert.equal(SECTION_ORDER[0], 'Overview');
});

// --- glass ---------------------------------------------------------------------------------

test('refracting glass with no gate call or import fails: JSX displacement, LiquidGlass tag, liquidGL call', () => {
  const root = fixture({
    'DESIGN.md': GOOD_DESIGN,
    'components/panel.tsx': `export const Panel = () => <svg><feDisplacementMap scale="40" /></svg>;\n`,
    'components/lens.ts': `import liquidGL from 'liquidgl';\nliquidGL({ target: '.lens' });\n`,
    'components/card.tsx': `export const Card = () => <LiquidGlassCard />;\n`,
  });
  const check = byId(runGate(root), 'glass-gated');
  assert.equal(check.level, 'error');
  for (const name of ['panel.tsx', 'lens.ts', 'card.tsx']) assert.match(check.detail, new RegExp(name));
});

test('a string, a comment or a sibling file name is not a gate', () => {
  const root = fixture({
    'DESIGN.md': GOOD_DESIGN,
    'lab/glass.tsx': `// reduced-transparency is handled elsewhere\nconst sample = "gpuPlan(";\nexport const G = () => <LiquidGlass />;\n`,
    'lab/glass-gate.ts': `export const x = 1;\n`,
  });
  const check = byId(runGate(root), 'glass-gated');
  assert.equal(check.level, 'error');
  assert.match(check.detail, /glass\.tsx/);
});

test('a gpuPlan call, a matchMedia reduced-transparency query, or a gate import counts as gated', () => {
  const root = fixture({
    'DESIGN.md': GOOD_DESIGN,
    'a/glass.tsx': `const r = matchMedia('(prefers-reduced-transparency: reduce)').matches;\nexport const A = () => r ? null : <LiquidGlass />;\n`,
    'b/glass.tsx': GATED_GLASS,
    'b/glass-gate.ts': `export const gpuPlan = () => ({ mode: 'css' });\n`,
    'c/glass.tsx': `import { useGlassPlan } from '@starlight/materials';\nexport const C = () => useGlassPlan().mode === 'webgl' ? <LiquidGlass /> : null;\n`,
  });
  assert.equal(byId(runGate(root), 'glass-gated').ok, true);
});

test('an external displacement SVG inherits the gate of the code that references it', () => {
  const gated = fixture({
    'DESIGN.md': GOOD_DESIGN,
    'public/refract.svg': `<svg><filter id="r"><feDisplacementMap scale="20"/></filter></svg>`,
    'components/lens.tsx': `import { gpuPlan } from './glass-gate';\nexport const L = () => gpuPlan().mode === 'webgl' ? <img src="/refract.svg" /> : null;\n`,
    'components/glass-gate.ts': `export const gpuPlan = () => ({});\n`,
  });
  assert.equal(byId(runGate(gated), 'glass-gated').ok, true);
  const ungated = fixture({
    'DESIGN.md': GOOD_DESIGN,
    'public/refract.svg': `<svg><feDisplacementMap scale="20"/></svg>`,
    'components/lens.tsx': `export const L = () => <img src="/refract.svg" />;\n`,
  });
  assert.match(byId(runGate(ungated), 'glass-gated').detail, /refract\.svg via components[\\/]lens\.tsx/);
  const orphan = fixture({ 'DESIGN.md': GOOD_DESIGN, 'public/refract.svg': `<svg><feDisplacementMap scale="20"/></svg>` });
  assert.equal(byId(runGate(orphan), 'glass-gated').level, 'warn');
});

test('plain CSS blur is the baseline tier and needs no gate', () => {
  const root = fixture({ 'DESIGN.md': GOOD_DESIGN, 'components/panel.css': `.panel { backdrop-filter: blur(20px); }\n` });
  const check = byId(runGate(root), 'glass-gated');
  assert.equal(check.ok, true);
  assert.match(check.detail, /1 CSS blur file/);
});

// --- GPU routes ----------------------------------------------------------------------------

test('a complete repo passes: gated glass, one renderer with lifecycle and poster, a real motion score', () => {
  const root = fixture({
    'DESIGN.md': GOOD_DESIGN,
    'app/page.tsx': `import { Glass } from '@/components/glass';\nimport { Scene } from '@/components/scene';\nexport default function Page() { return <><Glass /><Scene poster="/hero.webp" /></>; }\n`,
    'components/glass.tsx': GATED_GLASS,
    'components/glass-gate.ts': `export function gpuPlan() {}\n`,
    'components/scene.tsx': GOOD_RENDERER,
    'components/reveal.tsx': `import gsap from 'gsap';\n`,
    '.studio/home/motion-score.md': SCORE,
    '.studio/home/prototype.html': `<svg><feDisplacementMap /></svg>`,
  });
  const result = runGate(root);
  assert.equal(result.errors, 0, JSON.stringify(result.checks, null, 2));
  assert.equal(result.pass, true);
});

test('two renderers behind a barrel, a tsconfig baseUrl alias and an exact alias are counted on the route', () => {
  const root = fixture({
    'DESIGN.md': GOOD_DESIGN,
    'tsconfig.json': `{ "compilerOptions": { "baseUrl": "./src", "paths": { "@/*": ["*"], "@scenes": ["components/scenes"] } } }`,
    'src/app/page.tsx': `import { Hero } from '@/components';\nimport { Field } from '@scenes';\nexport default function Page() { return <><Hero /><Field /></>; }\n`,
    'src/components/index.ts': `export * from './hero';\n`,
    'src/components/hero.tsx': `import { Orb } from './orb';\nexport const Hero = () => <Orb />;\n`,
    'src/components/orb.tsx': GOOD_RENDERER,
    'src/components/scenes/index.tsx': `const { Canvas } = require('@react-three/fiber');\nexport const Field = () => <Canvas fallback={<img />} onCreated={() => document.addEventListener('visibilitychange', () => {})} />;\n`,
  });
  const result = runGate(root);
  assert.equal(byId(result, 'coverage').ok, true, byId(result, 'coverage').detail);
  const check = byId(result, 'one-gpu-surface');
  assert.equal(check.level, 'error');
  assert.match(check.detail, /app \(2 renderer modules/);
});

test('a renderer in a layout plus one in the page is two on that route', () => {
  const root = fixture({
    'DESIGN.md': GOOD_DESIGN,
    'app/layout.tsx': `import { Bg } from '../components/bg';\n`,
    'app/page.tsx': `import { Orb } from '../components/orb';\n`,
    'components/bg.tsx': `import { Renderer } from 'ogl';\nconst r = new Renderer({ poster: 1 });\nconst io = new IntersectionObserver(() => {});\n`,
    'components/orb.tsx': GOOD_RENDERER,
  });
  assert.equal(byId(runGate(root), 'one-gpu-surface').level, 'error');
});

test('parallel route slots render together and are counted as one route', () => {
  const root = fixture({
    'DESIGN.md': GOOD_DESIGN,
    'app/layout.tsx': `export default ({ children, overlay }) => <>{children}{overlay}</>;\n`,
    'app/page.tsx': `import { Orb } from '../components/orb';\n`,
    'app/@overlay/page.tsx': `import { Bg } from '../../components/bg';\n`,
    'components/orb.tsx': GOOD_RENDERER,
    'components/bg.tsx': GOOD_RENDERER,
  });
  const check = byId(runGate(root), 'one-gpu-surface');
  assert.equal(check.level, 'error');
  assert.match(check.detail, /app \(2 renderer modules via 2 page/);
});

test('a helper that imports three for maths is not a renderer and owes no lifecycle', () => {
  const root = fixture({
    'DESIGN.md': GOOD_DESIGN,
    'app/page.tsx': `import { Scene } from '../components/scene';\n`,
    'components/scene.tsx': `import * as THREE from 'three';\nimport { ring } from './geometry';\nexport const Scene = () => { const r = new THREE.WebGLRenderer(); const io = new IntersectionObserver(() => {}); return <img poster="x" />; };\n`,
    'components/geometry.ts': `import { Vector3 } from 'three';\nexport const ring = () => new Vector3();\n`,
  });
  const result = runGate(root);
  assert.equal(result.errors, 0, JSON.stringify(result.checks));
  assert.match(byId(result, 'one-gpu-surface').detail, /1 renderer module\(s\) among 2 GPU-importing/);
});

test('a renderer that never watches visibility is an error; words in strings do not count', () => {
  const root = fixture({
    'DESIGN.md': GOOD_DESIGN,
    'components/orb.tsx': `import * as THREE from 'three';\nconst r = new THREE.WebGLRenderer();\nconst words = "IntersectionObserver poster";\n`,
  });
  const result = runGate(root);
  assert.equal(byId(result, 'gpu-lifecycle').level, 'error');
  assert.equal(byId(result, 'poster-first').level, 'warn');
});

test('unresolved imports and a cut traversal make coverage an error, so PASS means complete', () => {
  const unresolved = fixture({ 'DESIGN.md': GOOD_DESIGN, 'app/page.tsx': `import { X } from '~/somewhere';\nimport { Y } from './missing';\n` });
  const c = byId(runGate(unresolved), 'coverage');
  assert.equal(c.level, 'error');
  assert.match(c.detail, /~\/somewhere/);
  assert.match(c.detail, /\.\/missing/);
  const chain = { 'DESIGN.md': GOOD_DESIGN, 'app/page.tsx': `import { A } from '../m/m0';\n` };
  for (let i = 0; i < 14; i += 1) chain[`m/m${i}.ts`] = `import { A } from './m${i + 1}';\nexport const A = 1;\n`;
  chain['m/m14.ts'] = GOOD_RENDERER;
  const deep = runGate(fixture(chain));
  assert.equal(deep.pass, false);
  assert.match(byId(deep, 'coverage').detail, /beyond the 12-edge traversal limit/);
});

test('readAliases honours baseUrl, exact keys and longest-prefix order', () => {
  const root = fixture({ 'tsconfig.json': `{ "compilerOptions": { "baseUrl": "src", "paths": { "@/*": ["*"], "@/ui/*": ["ui/*"], "@lib": ["lib/index"] } } }` });
  const aliases = readAliases(root);
  assert.equal(aliases[0].key, '@/ui/');
  assert.equal(aliases.find((a) => a.key === '@lib').wildcard, false);
  assert.match(aliases.find((a) => a.key === '@/').dirs[0].replace(/\\/g, '/'), /\/src$/);
});

// --- containment ---------------------------------------------------------------------------

test('alias targets and ../ imports that leave the scanned root are never resolved', () => {
  assert.equal(insideRoot('C:\\repo', '\\\\attacker\\share\\x'), false);
  assert.equal(insideRoot('/repo', '//attacker/share/x'), false);
  assert.equal(insideRoot(join(tmpdir(), 'r'), join(tmpdir(), 'other', 'x.ts')), false);
  const outside = fixture({ 'leak/orb.tsx': GOOD_RENDERER });
  const root = fixture({
    'DESIGN.md': GOOD_DESIGN,
    'tsconfig.json': JSON.stringify({ compilerOptions: { paths: { '@/*': ['\\\\\\\\attacker\\\\share\\\\*', '../../*'], '~/*': [outside.replace(/\\/g, '/') + '/*'] } } }),
    'app/page.tsx': `import { A } from '@/leak/orb';\nimport { B } from '~/leak/orb';\nimport { C } from '${'../'.repeat(6)}etc/passwd';\n`,
  });
  const result = runGate(root);
  assert.match(byId(result, 'one-gpu-surface').detail, /^0 renderer module/);
  assert.equal(byId(result, 'coverage').level, 'error');
});

test('a candidate under a junction inside the root is never stat-ed', () => {
  const outside = fixture({ 'orb.tsx': GOOD_RENDERER });
  const root = fixture({ 'DESIGN.md': GOOD_DESIGN, 'app/page.tsx': `import { A } from '../linked/orb';\n` });
  symlinkSync(outside, join(root, 'linked'), 'junction');
  assert.equal(pathHasLink(root, join(root, 'linked', 'orb.tsx')), true);
  assert.equal(pathHasLink(root, join(root, 'app', 'page.tsx')), false);
  const result = runGate(root);
  assert.match(byId(result, 'one-gpu-surface').detail, /^0 renderer module/);
  assert.match(byId(result, 'coverage').detail, /\.\.\/linked\/orb/);
});

// --- motion, colour, scope ------------------------------------------------------------------

test('a motion score needs a reduced-motion column and a beat row with that cell filled', () => {
  assert.equal(validMotionScore(SCORE), true);
  assert.equal(validMotionScore(''), false);
  assert.equal(validMotionScore(`| Beat | Trigger |\n|---|---|\n| x | y |\n`), false);
  assert.equal(validMotionScore(`| reduced cost |\n| anything |\n`), false);
  assert.equal(validMotionScore(`| Beat | Reduced |\n|:---|:---|\n`), false);
  assert.equal(validMotionScore(`| Beat | Reduced |\n|---|---|\n| reveal | |\n`), false);
  const wrongName = fixture({ 'DESIGN.md': GOOD_DESIGN, 'components/s.tsx': `import gsap from 'gsap';\n`, 'old/not-motion-score.md': SCORE });
  assert.equal(byId(runGate(wrongName), 'motion-scored').level, 'error');
  const sideEffect = fixture({ 'DESIGN.md': GOOD_DESIGN, 'components/s.tsx': `import 'gsap';\nimport { motion } from 'motion/react';\n` });
  assert.match(byId(runGate(sideEffect), 'motion-scored').detail, /^1 file\(s\) import a motion library; no motion-score/);
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

test('tests and fixtures at the root or nested, .studio prototypes, dot folders and build output are never product', () => {
  const root = fixture({
    'DESIGN.md': GOOD_DESIGN,
    'tests/scene.tsx': `import * as THREE from 'three';\nnew THREE.WebGLRenderer();\n`,
    'fixtures/glass.tsx': `export const G = () => <LiquidGlass />;\n`,
    'src/__fixtures__/glass.tsx': `export const G = () => <LiquidGlass />;\n`,
    'node_modules/x/glass.css': `backdrop-filter: blur(1px)`,
    '.next/static/chunk.js': `import * as THREE from 'three'`,
    '.claude/worktrees/x/app/glass.tsx': `export const G = () => <LiquidGlass />;\n`,
  });
  const result = runGate(root);
  assert.equal(result.errors, 0, JSON.stringify(result.checks));
});

test('the CLI runs from a path with spaces, prints a report and exits 1 on a failing repo', () => {
  const dir = mkdtempSync(join(tmpdir(), 'materials gate space '));
  const copy = join(dir, 'materials-gate.mjs');
  writeFileSync(copy, readFileSync(GATE, 'utf8'));
  const target = fixture({ 'app/page.tsx': 'export default () => null;\n' });
  const run = spawnSync(process.execPath, [copy, target], { encoding: 'utf8' });
  assert.equal(run.status, 1, run.stderr);
  assert.match(run.stdout, /Materials gate: FAIL/);
  const missing = spawnSync(process.execPath, [copy, join(target, 'nope')], { encoding: 'utf8' });
  assert.equal(missing.status, 2);
});
