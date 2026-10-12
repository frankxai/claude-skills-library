import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { bench, doctor, formatTable, savedPercent } from '../scripts/thrift.mjs';
import { applyPlan, planInstall } from '../install.mjs';

const PACK = join(dirname(fileURLToPath(import.meta.url)), '..');

test('savedPercent rounds and guards a zero baseline', () => {
  assert.equal(savedPercent(1000, 200), 80);
  assert.equal(savedPercent(68, 50), 26);
  assert.equal(savedPercent(0, 0), 0);
  assert.equal(savedPercent(100, 120), -20);
});

test('formatTable lines up rows and shows skipped cases', () => {
  const out = formatTable([
    { label: 'git log', raw: 1000, rtk: 200, saved: 80 },
    { label: 'ls', skipped: 'ls ENOENT' },
  ]);
  assert.match(out, /git log\s+1000\s+200\s+80%/);
  assert.match(out, /ls\s+skipped: ls ENOENT/);
});

test('bench skips a missing tool instead of throwing', () => {
  const rows = bench([{ label: 'ghost', raw: ['definitely-not-a-real-binary-xyz'], rtk: ['also-missing'] }]);
  assert.equal(rows.length, 1);
  assert.ok(rows[0].skipped);
});

test('bench measures a real command pair', () => {
  const node = process.execPath;
  const rows = bench([
    { label: 'long vs short', raw: [node, '-e', 'console.log("x".repeat(1000))'], rtk: [node, '-e', 'console.log("x")'] },
  ]);
  assert.equal(rows[0].raw, 1001);
  assert.ok(rows[0].saved >= 99);
});

test('doctor reports hook presence from settings.json and never throws on an empty home', () => {
  const home = mkdtempSync(join(tmpdir(), 'thrift-home-'));
  try {
    const empty = doctor(home);
    assert.equal(empty.find((r) => r.name === 'rtk hook').ok, false);
    mkdirSync(join(home, '.claude'), { recursive: true });
    writeFileSync(join(home, '.claude', 'settings.json'), '{"hooks":{"PreToolUse":[{"hooks":[{"command":"rtk hook claude"}]}]}}');
    assert.equal(doctor(home).find((r) => r.name === 'rtk hook').ok, true);
  } finally {
    rmSync(home, { recursive: true, force: true });
  }
});

test('planInstall lists both skills and writes nothing', () => {
  const target = mkdtempSync(join(tmpdir(), 'thrift-target-'));
  try {
    const plan = planInstall(target, PACK);
    assert.deepEqual(plan.map((s) => s.name).sort(), ['thrift', 'thrift-ledger']);
    assert.equal(existsSync(join(target, '.claude')), false);
  } finally {
    rmSync(target, { recursive: true, force: true });
  }
});

test('applyPlan copies skills and is idempotent', () => {
  const target = mkdtempSync(join(tmpdir(), 'thrift-apply-'));
  try {
    const plan = planInstall(target, PACK);
    applyPlan(plan);
    applyPlan(planInstall(target, PACK));
    const installed = readdirSync(join(target, '.claude', 'skills')).sort();
    assert.deepEqual(installed, ['thrift', 'thrift-ledger']);
    assert.match(readFileSync(join(target, '.claude', 'skills', 'thrift', 'SKILL.md'), 'utf8'), /^---\nname: thrift\n/);
  } finally {
    rmSync(target, { recursive: true, force: true });
  }
});

test('every shipped skill has name and description frontmatter that matches its folder', () => {
  for (const dir of readdirSync(join(PACK, 'skills'))) {
    const text = readFileSync(join(PACK, 'skills', dir, 'SKILL.md'), 'utf8');
    const front = text.split('---')[1];
    assert.match(front, new RegExp(`^name: ${dir}$`, 'm'));
    assert.match(front, /^description: .{40,}/m);
  }
});
