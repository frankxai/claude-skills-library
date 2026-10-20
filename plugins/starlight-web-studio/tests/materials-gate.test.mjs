import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { runGate, checkDesignMd, SECTION_ORDER } from '../bin/materials-gate.mjs';

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

function fixture(files) {
  const root = mkdtempSync(join(tmpdir(), 'materials-gate-'));
  for (const [rel, content] of Object.entries(files)) {
    const full = join(root, rel);
    mkdirSync(join(full, '..'), { recursive: true });
    writeFileSync(full, content);
  }
  return root;
}

function byId(result, id) {
  return result.checks.find((c) => c.id === id);
}

test('a repo with DESIGN.md, gated glass, one GPU surface and a motion score passes', () => {
  const root = fixture({
    'DESIGN.md': GOOD_DESIGN,
    'app/page.tsx': `import { Glass } from '../components/glass';\nexport default function Page() { return <Glass />; }\n`,
    'components/glass.tsx': `import * as THREE from 'three';\n// poster first, IntersectionObserver pause\nconst css = 'backdrop-filter: blur(12px)';\nconst gate = matchMedia('(prefers-reduced-transparency: reduce)');\n`,
    'components/reveal.tsx': `import gsap from 'gsap';\n`,
    '.studio/home/motion-score.md': '| Beat |',
    '.studio/home/prototype.html': `<style>.x{backdrop-filter:blur(9px)}</style>`,
  });
  const result = runGate(root);
  assert.equal(result.errors, 0, JSON.stringify(result.checks, null, 2));
  assert.equal(result.pass, true);
});

test('a missing DESIGN.md is an error', () => {
  const root = fixture({ 'app/page.tsx': 'export default () => null;\n' });
  const result = runGate(root);
  assert.equal(byId(result, 'design-md').level, 'error');
  assert.equal(result.pass, false);
});

test('DESIGN.md sections must follow the spec order', () => {
  const root = fixture({ 'DESIGN.md': `---\nname: x\n---\n## Typography\n## Colors\n` });
  const check = checkDesignMd(root);
  assert.equal(check.level, 'error');
  assert.match(check.detail, /out of spec order: Colors/);
});

test('DESIGN.md with prose and no tokens is a warning, not a pass', () => {
  const root = fixture({ 'DESIGN.md': `## Overview\nJust words.\n` });
  const check = checkDesignMd(root);
  assert.equal(check.level, 'warn');
  assert.equal(check.ok, false);
});

test('spec aliases resolve to canonical sections', () => {
  const root = fixture({ 'DESIGN.md': `---\nname: x\n---\n## Brand & Style\n## Layout & Spacing\n## Elevation\n` });
  assert.equal(checkDesignMd(root).ok, true);
  assert.equal(SECTION_ORDER[0], 'Overview');
});

test('refracting glass without a reduced-transparency or gate reference fails', () => {
  const root = fixture({
    'DESIGN.md': GOOD_DESIGN,
    'components/panel.tsx': `export const LiquidGlassPanel = () => <svg><feDisplacementMap scale="40" /></svg>;\n`,
  });
  const check = byId(runGate(root), 'glass-gated');
  assert.equal(check.level, 'error');
  assert.match(check.detail, /panel\.tsx/);
});

test('plain CSS blur is the baseline tier and needs no gate', () => {
  const root = fixture({
    'DESIGN.md': GOOD_DESIGN,
    'components/panel.css': `.panel { backdrop-filter: blur(20px); }\n`,
  });
  const check = byId(runGate(root), 'glass-gated');
  assert.equal(check.ok, true);
  assert.match(check.detail, /1 CSS blur file/);
});

test('dot folders other than .studio are never scanned', () => {
  const root = fixture({
    'DESIGN.md': GOOD_DESIGN,
    '.claude/worktrees/x/app/glass.tsx': `const LiquidGlass = 1;\n`,
    '.chrome-profile/Default/Extensions/a/b.js': `feDisplacementMap`,
  });
  assert.equal(runGate(root).errors, 0);
});

test('a glass file beside a glass-gate module counts as gated', () => {
  const root = fixture({
    'DESIGN.md': GOOD_DESIGN,
    'lab/glass.mjs': `// liquid-glass refraction pass\nconst s = 'backdrop-filter: blur(8px)';\n`,
    'lab/glass-gate.mjs': `export const x = 1;\n`,
  });
  assert.equal(byId(runGate(root), 'glass-gated').ok, true);
});

test('a page that composes two GPU surfaces fails', () => {
  const root = fixture({
    'DESIGN.md': GOOD_DESIGN,
    'app/page.tsx': `import { A } from '../components/a';\nimport { B } from '../components/b';\n`,
    'components/a.tsx': `import * as THREE from 'three';\nconst poster = 1;\n`,
    'components/b.tsx': `import { Canvas } from '@react-three/fiber';\nconst poster = 1;\n`,
  });
  const check = byId(runGate(root), 'one-gpu-surface');
  assert.equal(check.level, 'error');
  assert.match(check.detail, /page\.tsx \(2\)/);
});

test('a GPU file with no poster or visibility handling is a warning', () => {
  const root = fixture({
    'DESIGN.md': GOOD_DESIGN,
    'components/orb.tsx': `import * as THREE from 'three';\n`,
  });
  const check = byId(runGate(root), 'poster-first');
  assert.equal(check.level, 'warn');
  assert.match(check.detail, /orb\.tsx/);
});

test('gsap without a motion score is an error; with one it passes', () => {
  const bare = fixture({ 'DESIGN.md': GOOD_DESIGN, 'components/scroll.tsx': `import { ScrollTrigger } from 'gsap/ScrollTrigger';\n` });
  assert.equal(byId(runGate(bare), 'motion-scored').level, 'error');
  const scored = fixture({
    'DESIGN.md': GOOD_DESIGN,
    'components/scroll.tsx': `import gsap from 'gsap';\n`,
    'docs/motion-score.md': '| Beat |',
  });
  assert.equal(byId(runGate(scored), 'motion-scored').ok, true);
});

test('more than twenty raw hex colours in components is a warning', () => {
  const hexes = Array.from({ length: 25 }, (_, i) => `#${(0x100000 + i * 7919).toString(16).slice(0, 6)}`);
  const root = fixture({
    'DESIGN.md': GOOD_DESIGN,
    'components/soup.tsx': hexes.map((h) => `const c = '${h}';`).join('\n'),
  });
  const check = byId(runGate(root), 'raw-colour');
  assert.equal(check.level, 'warn');
  assert.match(check.detail, /25 distinct/);
});

test('node_modules and build output are never scanned', () => {
  const root = fixture({
    'DESIGN.md': GOOD_DESIGN,
    'node_modules/x/glass.css': `backdrop-filter: blur(1px)`,
    '.next/static/chunk.js': `import * as THREE from 'three'`,
  });
  const result = runGate(root);
  assert.equal(result.errors, 0);
});
