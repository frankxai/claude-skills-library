#!/usr/bin/env node
/**
 * absorb — the inbound counterpart to starlight-agent-skills/scripts/port-skill.mjs.
 *
 * port-skill.mjs sends a skill OUT of the library into a consumer repo.
 * This brings external work IN, through four gates that refuse rather than warn.
 * Contract: ABSORPTION.md.
 *
 * Usage:
 *   node scripts/absorb.mjs --as=<domain>/<name> --from=<repo url> --commit=<sha>
 *                           --upstream-path=<path> --license=<SPDX> --changed="..."
 *                           [--by="..."] [--staging=<dir>] [--dry-run]
 *
 * Gates:
 *   1 LICENSE      SPDX must be on the allowlist. Copyleft, -NC, and unlicensed are refused.
 *   2 PROVENANCE   repo + full commit SHA + upstream path + license + a real change statement.
 *   3 DISTINCTNESS >=85% 5-word-shingle Jaccard against any existing skill is a refusal.
 *   4 ATTESTATION  carries the "Built on SIP" footer.
 *
 * Exits non-zero on any failed gate.
 */
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync, cpSync } from 'node:fs';
import { join, dirname, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const opt = (n, d = null) => { const a = args.find((x) => x.startsWith(`--${n}=`)); return a ? a.slice(n.length + 3) : d; };
const DRY = args.includes('--dry-run');

const as = opt('as');
const from = opt('from');
const commit = opt('commit');
const upstreamPath = opt('upstream-path');
const license = opt('license');
const changed = opt('changed');
const by = opt('by', 'unattributed');
const staging = opt('staging', 'absorbed/_staging');

if (!as || !from || !commit || !upstreamPath || !license || !changed) {
  console.error('Usage: absorb.mjs --as=<domain>/<name> --from=<url> --commit=<sha> --upstream-path=<p> --license=<SPDX> --changed="..." [--by=] [--dry-run]');
  process.exit(2);
}

const SEG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const [domain, name, ...rest] = as.split('/');
if (rest.length || !SEG.test(domain || '') || !SEG.test(name || '')) {
  console.error(`refused: --as must be "<domain>/<name>" in kebab-case (got ${JSON.stringify(as)})`);
  process.exit(2);
}

const verdicts = [];
const gate = (n, ok, msg) => { verdicts.push({ n, ok, msg }); return ok; };

// ---------------------------------------------------------------- gate 1: license
const ALLOW = new Set(['MIT', 'Apache-2.0', 'BSD-2-Clause', 'BSD-3-Clause', 'ISC', 'CC0-1.0', 'CC-BY-4.0', 'Unlicense']);
const COPYLEFT = /^(A?GPL|LGPL|MPL|EUPL|SSPL)/i;
const NONCOMMERCIAL = /-NC(-|$)|NonCommercial/i;
let licenseOk;
if (COPYLEFT.test(license)) licenseOk = gate(1, false, `license '${license}' is copyleft — it reaches this library's MIT root. Depend on it instead of absorbing it.`);
else if (NONCOMMERCIAL.test(license)) licenseOk = gate(1, false, `license '${license}' is non-commercial — this library ships commercially.`);
else if (!ALLOW.has(license)) licenseOk = gate(1, false, `license '${license}' is not on the allowlist (${[...ALLOW].join(', ')}). Public on GitHub is not a license.`);
else licenseOk = gate(1, true, `license '${license}' allowed`);

// ---------------------------------------------------------------- gate 2: provenance
const shaOk = /^[0-9a-f]{40}$/i.test(commit);
const repoOk = /^https:\/\/github\.com\/[^/]+\/[^/]+/.test(from);
const LAZY = /^(reformatted|cleaned up|minor edits|none|n\/a|tidied|copied)\.?$/i;
const changeOk = changed.trim().length >= 25 && !LAZY.test(changed.trim());
gate(2, shaOk && repoOk && changeOk,
  [ shaOk ? null : `--commit must be a full 40-char SHA (got '${commit}') — a branch name is not provenance`,
    repoOk ? null : `--from must be a https://github.com/<owner>/<repo> URL`,
    changeOk ? null : `--changed must state what you re-expressed and why (>=25 chars, and "reformatted" is not a change statement)`,
  ].filter(Boolean).join('; ') || 'provenance complete');

// ---------------------------------------------------------------- staged artifact
const stagedDir = join(REPO, staging, domain, name);
const stagedSkill = join(stagedDir, 'SKILL.md');
if (!existsSync(stagedSkill)) {
  console.error(`refused: nothing staged at ${relative(REPO, stagedSkill)} — stage the artifact you have READ, not one fetched blind.`);
  process.exit(2);
}
const body = readFileSync(stagedSkill, 'utf8');

// ---------------------------------------------------------------- gate 3: distinctness
const SHINGLE = 5;
const shingles = (t) => {
  const w = t.replace(/^---[\s\S]*?---/, '').toLowerCase().replace(/[`*_>#|\[\]()]/g, ' ')
    .replace(/[^a-z0-9\s-]/g, ' ').split(/\s+/).filter(Boolean);
  const s = new Set();
  for (let i = 0; i + SHINGLE <= w.length; i++) s.add(w.slice(i, i + SHINGLE).join(' '));
  return s;
};
const jaccard = (a, b) => { if (!a.size || !b.size) return 0; let i = 0; for (const x of a) if (b.has(x)) i++; return i / (a.size + b.size - i); };

function existingSkills() {
  const out = [];
  for (const root of ['free-skills', 'packs', 'absorbed']) {
    const abs = join(REPO, root);
    if (!existsSync(abs)) continue;
    const stack = [abs];
    while (stack.length) {
      const d = stack.pop();
      for (const e of readdirSync(d, { withFileTypes: true })) {
        const p = join(d, e.name);
        if (p.includes('_staging')) continue;
        if (e.isDirectory()) stack.push(p);
        else if (e.name === 'SKILL.md') out.push(p);
      }
    }
  }
  return out;
}
const mine = shingles(body);
let nearest = { path: null, score: 0 };
if (mine.size >= 40) {
  for (const p of existingSkills()) {
    const s = jaccard(mine, shingles(readFileSync(p, 'utf8')));
    if (s > nearest.score) nearest = { path: relative(REPO, p), score: s };
  }
}
gate(3, nearest.score < 0.85,
  nearest.score >= 0.85
    ? `${Math.round(nearest.score * 100)}% identical to ${nearest.path} — we already have this. Improve that skill and credit the upstream there.`
    : mine.size < 40 ? 'skill too short to compare — distinctness unchecked' : `most similar existing skill: ${nearest.path || 'none'} at ${Math.round(nearest.score * 100)}%`);

// ---------------------------------------------------------------- gate 4: attestation
gate(4, /Built on SIP/.test(body), /Built on SIP/.test(body) ? 'attestation present' : 'missing the "Built on SIP" footer — absorbed is not a lower tier');

// ---------------------------------------------------------------- report
const NAMES = { 1: 'LICENSE', 2: 'PROVENANCE', 3: 'DISTINCTNESS', 4: 'ATTESTATION' };
console.log(`absorb ${as}  <-  ${from}@${commit.slice(0, 10)}`);
for (const v of verdicts) console.log(`  gate ${v.n} ${NAMES[v.n].padEnd(13)} ${v.ok ? 'pass' : 'REFUSE'}  ${v.msg}`);

const failed = verdicts.filter((v) => !v.ok);
if (failed.length) { console.log(`  refused on ${failed.length} gate(s) — nothing written`); process.exit(1); }
if (DRY) { console.log('  all gates pass — dry run, nothing written'); process.exit(0); }

// ---------------------------------------------------------------- land it
const destDir = join(REPO, 'absorbed', domain, name);
mkdirSync(destDir, { recursive: true });
cpSync(stagedDir, destDir, { recursive: true });
const provenance = {
  schema: 'starlight.absorption-provenance.v1',
  skill: as,
  source: { repository: from, commit, path: upstreamPath },
  license,
  absorbed: { date: new Date().toISOString().slice(0, 10), by },
  changed,
  distinctness: { nearest: nearest.path, similarity: Number(nearest.score.toFixed(3)) },
};
writeFileSync(join(destDir, 'PROVENANCE.json'), JSON.stringify(provenance, null, 2) + '\n');

const ledger = join(REPO, 'ABSORBED.md');
if (!existsSync(ledger)) {
  writeFileSync(ledger, `# Absorbed

What actually entered this library from elsewhere, under which license, from which commit.
The watch list lives in \`Starlight-Intelligence-System/context/empire/upstreams.json\` — watching is not absorbing.
Contract: [\`ABSORPTION.md\`](ABSORPTION.md). Notices: [\`THIRD_PARTY_NOTICES.md\`](THIRD_PARTY_NOTICES.md).

| Skill | Source | Commit | License | Date | Changed in re-expression |
|---|---|---|---|---|---|
`);
}
const row = `| \`${as}\` | [${from.replace('https://github.com/', '')}](${from}) | \`${commit.slice(0, 10)}\` | ${license} | ${provenance.absorbed.date} | ${changed.replace(/\|/g, '\\|')} |\n`;
const current = readFileSync(ledger, 'utf8')
  .replace(/^_Nothing absorbed yet\..*$/m, '')   // drop the seeded placeholder on the first real row
  .replace(/\n*$/, '\n');
writeFileSync(ledger, current + row);

console.log(`  landed  absorbed/${domain}/${name}/  (+ PROVENANCE.json, + ABSORBED.md row)`);
console.log(`  next    remove absorbed/_staging/${domain}/${name}/ and run the skill validator`);
