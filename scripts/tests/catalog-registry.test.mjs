import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "../build-catalog.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const CATALOG = join(ROOT, "catalog", "skills.json");
const OWNERSHIP = join(ROOT, "catalog", "ownership.json");

function catalog() {
  return JSON.parse(readFileSync(CATALOG, "utf8"));
}

function skills(doc) {
  return doc.plugins.filter((p) => p.skills).flatMap((p) => p.skills);
}

test("every skill carries a stable install URI", () => {
  for (const s of skills(catalog())) {
    assert.match(s.uri, /^github:[A-Za-z0-9._-]+\/[A-Za-z0-9._/-]+(@[0-9A-Za-z.+-]+)?$/, `${s.name} has a malformed uri`);
    assert.ok(s.owner && s.owner.repo && s.owner.path, `${s.name} has no canonical owner`);
  }
});

test("hasEvals agrees with the eval suites that actually exist on disk", () => {
  for (const s of skills(catalog())) {
    assert.equal(s.hasEvals, s.evalSuites.length > 0, `${s.name} disagrees with its own evalSuites`);
    for (const suite of s.evalSuites) {
      assert.ok(existsSync(join(ROOT, suite)), `${s.name} points at a missing eval suite ${suite}`);
    }
  }
});

test("eval suites shipped inside a pack count, not only suites beside the skill", () => {
  // The catalog used to look only for free-skills/<name>/evals, so every skill that ships its
  // suite inside a pack was reported as unevaluated and the catalog claimed zero.
  const packSuites = [];
  const packsDir = join(ROOT, "packs");
  for (const pack of readdirSync(packsDir, { withFileTypes: true })) {
    if (!pack.isDirectory()) continue;
    const evals = join(packsDir, pack.name, "evals");
    if (!existsSync(evals)) continue;
    for (const name of readdirSync(evals, { withFileTypes: true })) {
      if (name.isDirectory()) packSuites.push(name.name);
    }
  }
  assert.ok(packSuites.length > 0, "the fixture assumes at least one pack ships eval suites");

  const doc = catalog();
  for (const name of packSuites) {
    const s = skills(doc).find((x) => x.name === name);
    if (!s) continue;
    assert.ok(s.hasEvals, `${name} ships an eval suite in a pack but the catalog says it has none`);
  }
  assert.ok(
    doc.totals.skillsWithEvals > 0,
    `catalog reports ${doc.totals.skillsWithEvals} skills with evals; the pack suites say otherwise`
  );
  assert.equal(
    doc.totals.skillsWithEvals,
    skills(doc).filter((s) => s.hasEvals).length,
    "totals.skillsWithEvals disagrees with the skill entries"
  );
});

test("an estate eval verdict is carried with its verdict and date", () => {
  const doc = catalog();
  const verdicts = skills(doc).filter((s) => s.eval);
  assert.ok(verdicts.length > 0, "no skill carries an estate eval verdict");
  for (const s of verdicts) {
    assert.ok(s.eval.verdict, `${s.name} has a verdict entry without a verdict`);
    assert.ok(s.eval.evaluatedAt, `${s.name} has a verdict entry without a date`);
  }
  assert.equal(doc.totals.skillsWithEvalVerdict, verdicts.length);
});

test("the canonical owner decides the version and every conflict is surfaced, not hidden", () => {
  const doc = catalog();
  const own = JSON.parse(readFileSync(OWNERSHIP, "utf8"));
  const ownerVersion = new Map((own.skills || []).map((s) => [s.name, s.version]));
  for (const s of skills(doc)) {
    const canonical = ownerVersion.get(s.name);
    if (!canonical) continue;
    assert.equal(s.version, canonical, `${s.name} does not carry the canonical version`);
  }
  const listed = new Set(doc.versionConflicts.map((c) => c.name));
  for (const s of skills(doc)) {
    if (!s.versionConflict) continue;
    assert.ok(listed.has(s.name), `${s.name} has a version conflict that the totals do not list`);
  }
  assert.equal(doc.totals.versionConflicts, doc.versionConflicts.length);
});

test("the committed catalog matches the generator, and the generator is deterministic", () => {
  const fresh = JSON.stringify(build(), null, 2) + "\n";
  const committed = readFileSync(CATALOG, "utf8").replace(/\r\n/g, "\n");
  assert.equal(
    committed,
    fresh,
    "catalog/skills.json is stale. Run: node scripts/build-catalog.mjs"
  );
  assert.equal(JSON.stringify(build(), null, 2), JSON.stringify(build(), null, 2), "two builds differ");
});
