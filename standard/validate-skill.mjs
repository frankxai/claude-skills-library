#!/usr/bin/env node
/**
 * Agent Skill Standard — conformance validator (zero dependencies, Node 18+).
 *
 * Usage: node validate-skill.mjs <path-to-skill-folder>
 *
 * Prints a per-level report and the highest maturity level the skill satisfies.
 * Exit code 0 always (this is a report, not a gate); wrap it in CI if you want
 * to enforce a minimum level.
 */
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, basename } from 'node:path';

const dir = process.argv[2];
if (!dir) {
  console.error('usage: node validate-skill.mjs <skill-folder>');
  process.exit(2);
}

function parseFrontmatter(md) {
  const m = md.match(/^---\n([\s\S]*?)\n---/);
  if (!m) return { data: {}, bodyLines: md.split('\n').length };
  const data = {};
  for (const line of m[1].split('\n')) {
    const mm = line.match(/^([a-zA-Z0-9_]+):\s*(.*)$/);
    if (mm) data[mm[1]] = mm[2].trim();
  }
  const body = md.slice(m[0].length);
  return { data, bodyLines: body.split('\n').length };
}

function nonEmptyDir(sub) {
  const p = join(dir, sub);
  return existsSync(p) && statSync(p).isDirectory() && readdirSync(p).length > 0;
}

const LEVEL_NAMES = ['Prompt', 'Documented', 'Referenced', 'Evaluated', 'Governed', 'Composed'];
const results = [];
let level = 0;
let data = {};
let bodyLines = 0;

// L1 — Documented
const skillPath = join(dir, 'SKILL.md');
let l1 = false;
if (existsSync(skillPath)) {
  ({ data, bodyLines } = parseFrontmatter(readFileSync(skillPath, 'utf8')));
  const nameOk =
    !!data.name &&
    /^[a-z0-9][a-z0-9-]*$/.test(data.name) &&
    data.name.length <= 64 &&
    !['anthropic', 'claude'].includes(data.name);
  const descOk = !!data.description && data.description.length <= 1024;
  l1 = nameOk && descOk;
  results.push(['L1 Documented', l1, l1 ? 'valid SKILL.md, name + trigger description' : 'name or description missing/invalid']);
} else {
  results.push(['L1 Documented', false, 'no SKILL.md at folder root']);
}
if (l1) level = 1;

// L2 — Referenced
const hasResources = nonEmptyDir('references') || nonEmptyDir('scripts') || nonEmptyDir('assets');
const bodyOk = bodyLines <= 500;
const l2 = l1 && hasResources && bodyOk;
results.push([
  'L2 Referenced',
  l2,
  l2 ? `progressive disclosure, body ${bodyLines} lines` : !hasResources ? 'no references/ scripts/ assets/' : `body ${bodyLines} lines > 500`,
]);
if (l2) level = 2;

// L3 — Evaluated
const l3 = l2 && nonEmptyDir('evals');
results.push(['L3 Evaluated', l3, l3 ? 'evals/ present' : l2 ? 'no evals/ directory' : 'requires L2']);
if (l3) level = 3;

// L4 — Governed
const govFields = ['version', 'owner', 'risk_tier', 'status', 'rollback'];
const missingGov = govFields.filter((f) => !data[f]);
const l4 = l3 && missingGov.length === 0;
results.push(['L4 Governed', l4, l4 ? 'owner, version, risk_tier, status, rollback' : l3 ? `missing: ${missingGov.join(', ')}` : 'requires L3']);
if (l4) level = 4;

// L5 — Composed
const compFields = ['composes', 'attestation', 'boundary'];
const missingComp = compFields.filter((f) => !data[f]);
const l5 = l4 && missingComp.length === 0;
results.push(['L5 Composed', l5, l5 ? 'composes, attestation, boundary' : l4 ? `missing: ${missingComp.join(', ')}` : 'requires L4']);
if (l5) level = 5;

console.log(basename(dir));
for (const [label, pass, note] of results) {
  console.log(`  ${label.padEnd(16)} ${pass ? 'PASS' : 'n/a '}  ${note}`);
}
console.log(`  => Maturity: L${level} ${LEVEL_NAMES[level]}`);
