// Runs the policy vectors in policy-vectors/ against commandHitsRule from the permission guard.
// A tiny validator covers the subset of JSON Schema that schema.json uses, so there is no dependency.
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { commandHitsRule, loadGuardRules } from '../hooks/rtk-rewrite.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'policy-vectors');
const schema = JSON.parse(readFileSync(join(root, 'schema.json'), 'utf8'));
const caseFiles = readdirSync(join(root, 'cases')).filter((name) => name.endsWith('.json')).sort();
const files = caseFiles.map((name) => ({ name, text: readFileSync(join(root, 'cases', name), 'utf8') }));
const loaded = files.map((file) => ({ ...file, data: JSON.parse(file.text) }));

function validate(value, node, path = '$') {
  if (node.$ref) return validate(value, node.$ref.split('/').slice(1).reduce((n, key) => n[key], schema), path);
  const errors = [];
  const typeOf = (v) => (Array.isArray(v) ? 'array' : v === null ? 'null' : typeof v);
  if (node.type && typeOf(value) !== node.type) return [`${path}: expected ${node.type}`];
  if (node.enum && !node.enum.includes(value)) errors.push(`${path}: not one of ${node.enum.join(', ')}`);
  if (node.pattern && !new RegExp(node.pattern).test(value)) errors.push(`${path}: does not match ${node.pattern}`);
  if (node.minLength !== undefined && value.length < node.minLength) errors.push(`${path}: shorter than ${node.minLength}`);
  if (node.type === 'array') {
    if (node.minItems !== undefined && value.length < node.minItems) errors.push(`${path}: fewer than ${node.minItems} items`);
    if (node.items) value.forEach((item, i) => errors.push(...validate(item, node.items, `${path}[${i}]`)));
  }
  if (node.type === 'object') {
    for (const key of node.required ?? []) if (!(key in value)) errors.push(`${path}: missing ${key}`);
    for (const [key, item] of Object.entries(value)) {
      if (node.properties?.[key]) errors.push(...validate(item, node.properties[key], `${path}.${key}`));
      else if (node.additionalProperties === false) errors.push(`${path}: unexpected ${key}`);
    }
  }
  return errors;
}

const cases = loaded.flatMap(({ name, data }) => data.cases.map((c) => ({ ...c, file: name, category: data.category })));

const scratch = mkdtempSync(join(tmpdir(), 'neutron-vectors-'));
const project = join(scratch, 'project');
mkdirSync(join(project, '.claude'), { recursive: true });
mkdirSync(join(scratch, 'home'));
test.after(() => rmSync(scratch, { recursive: true, force: true }));

// Goes through the settings reader as well as the matcher, so rule parsing is part of what the vectors check.
function guardHits({ rules, command }) {
  writeFileSync(join(project, '.claude', 'settings.json'), JSON.stringify({ permissions: { ask: rules.ask, deny: rules.deny } }));
  const policy = loadGuardRules({ home: join(scratch, 'home'), cwd: project, env: {}, managed: [], stopAt: project });
  assert.equal(policy.unreadable, false);
  return commandHitsRule(command, policy.patterns);
}

test('schema is a 2020-12 schema and every case file validates against it', () => {
  assert.equal(schema.$schema, 'https://json-schema.org/draft/2020-12/schema');
  assert.ok(loaded.length >= 10, 'expected one file per category');
  for (const { name, data } of loaded) {
    const errors = validate(data, schema);
    assert.deepEqual(errors, [], name);
    assert.equal(name, `${data.category}.json`);
  }
});

test('ids are unique and flags are used consistently', () => {
  assert.ok(cases.length >= 150, `only ${cases.length} cases`);
  assert.equal(new Set(cases.map((c) => c.id)).size, cases.length);
  for (const c of cases) {
    assert.ok(c.id.startsWith(`${c.category}-`), c.id);
    if (c.overmatch) assert.equal(c.expect, 'rewrite-eligible', `${c.id}: overmatch needs rewrite-eligible`);
    if (c.knownGap) {
      assert.equal(c.expect, 'passthrough', `${c.id}: knownGap needs passthrough`);
      assert.ok(c.gapReason, `${c.id}: knownGap needs gapReason`);
    }
    assert.ok(!(c.overmatch && c.knownGap), c.id);
    if (c.gapReason) assert.equal(c.knownGap, true, c.id);
  }
});

test('vectors hold no personal paths, names or secrets', () => {
  const banned = [/\/home\//i, /\/Users\//, /C:\\Users/i, /frank/i, /starlight/i, /arcanea/i, /@[a-z0-9-]+\.[a-z]{2,}/i, /gh[pousr]_[A-Za-z0-9]{20,}/, /sk-[A-Za-z0-9]{20,}/, /AKIA[0-9A-Z]{12,}/, /password\s*=/i, /BEGIN [A-Z ]*PRIVATE KEY/];
  for (const { name, text } of files.concat([{ name: 'schema.json', text: JSON.stringify(schema) }])) {
    for (const pattern of banned) assert.ok(!pattern.test(text), `${name} matches ${pattern}`);
  }
});

test('descriptions use no em dashes', () => {
  for (const { name, text } of files) assert.ok(!text.includes('\u2014') && !text.includes('\\u2014'), name);
});

for (const c of cases) {
  test(`vector ${c.id}: ${c.description.slice(0, 80)}`, () => {
    const hits = guardHits(c);
    if (c.knownGap) {
      assert.equal(hits, false, `${c.id} is marked knownGap but the guard now passes it; remove the flag`);
    } else if (c.expect === 'passthrough') {
      assert.equal(hits, true, 'guard would rewrite a command a rule could apply to');
    } else if (c.overmatch) {
      assert.equal(hits, true, `${c.id} is marked overmatch but the guard does not over-match; remove the flag`);
    } else {
      assert.equal(hits, false, 'guard skips a command no rule applies to');
    }
  });
}
