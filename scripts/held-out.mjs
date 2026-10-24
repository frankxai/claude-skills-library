#!/usr/bin/env node
// The held-out half of the pack's eval suites: answer keys, grader expected outputs and raw results.
//
// Publishing any of it leaks the eval: a skill (or a model) can then be tuned to the answers, and every lift number
// stops meaning anything. So the public repo carries only the method: each case's prompt and inputs, the runner, the
// case counts in products/skills-with-evals/pack.json ("heldOut"), and aggregate results. The rest lives in a
// private folder that is never committed here:
//
//   <private>/evals/<skill>/<case>/graders/          grader files (llm rubrics, tool and regex checks)
//   <private>/evals/<skill>/<case>/graders.yaml      graders that a case.yaml declares inline
//   <private>/evals/<skill>/<clean case>/resources/   the fixed twin of the seeded input: diffing it against the
//                                                     public seeded input would reproduce the answer key
//   <private>/evals/<skill>/seeded-defects/KEY.md    the answer key (never staged into a run either)
//   <private>/evals/<skill>/_legacy-2026-10-06/      retired cases with their graders
//   <private>/results/<skill>/<stamp>.json|.report.html|/traces/, SCORECARD.md   raw run output
//   <private>/runs/2026-10-06-skills-with-evals/     raw output of the archived 2026-10-06 run
//
// <private> is $SKILLS_EVALS_PRIVATE, or ../skills-with-evals-private next to this repo. Where the held-out files sit
// in the public tree, a placeholder file with MARKER as its only content says so (named KEY.md, graders, resources
// or _legacy-2026-10-06, like what it replaces).
//
//   node scripts/held-out.mjs status                      which skills have their private half present
//   node scripts/held-out.mjs check                       leak guard: fails if any held-out content is public
//   node scripts/held-out.mjs export --from <commit> --to <dir>
//                                                         rebuild the private half from a commit that still had it
//                                                         (for this pack: any commit up to 0ae110c)

import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { appendFileSync, cpSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PACK = JSON.parse(readFileSync(join(REPO, 'products', 'skills-with-evals', 'pack.json'), 'utf8'));

export const MARKER = `Held out. This file or folder belongs to the private half of the eval suite: the answer keys, the
grader expected outputs and the raw results. They are never published, because publishing them would leak the
eval and make every lift number meaningless. scripts/eval-skill.mjs adds the private half back at run time.
See evals/README.md, "Held-out half".
`;
const ARCHIVED_RUN = 'evals/_runs/2026-10-06-skills-with-evals';
const ARCHIVED_RAW = ['report.html', 'aggregate-result.json', 'pilot'];

export const privateRoot = () => resolve(process.env.SKILLS_EVALS_PRIVATE || join(REPO, '..', 'skills-with-evals-private'));
export const isMarker = (p) => existsSync(p) && statSync(p).isFile() && readFileSync(p, 'utf8').trim() === MARKER.trim();
export const heldOutCounts = (skill, pack = PACK) => pack.heldOut?.[skill] || null;

// Which cases of a pack skill expect private graders, and are they there?
export function heldOutStatus(skill, root = privateRoot(), pack = PACK) {
  const counts = heldOutCounts(skill, pack);
  const out = { skill, root, present: false, missing: [] };
  if (!counts) { out.missing.push('no heldOut entry in pack.json'); return out; }
  for (const c of Object.keys(counts.graders)) {
    const d = join(root, 'evals', skill, c);
    if (!existsSync(join(d, 'graders')) && !existsSync(join(d, 'graders.yaml'))) out.missing.push(`${c}: no graders`);
    if (/^clean/.test(c) && !existsSync(join(d, 'resources'))) out.missing.push(`${c}: no inputs`);
  }
  if (counts.planted && !existsSync(join(root, 'evals', skill, 'seeded-defects', 'KEY.md'))) out.missing.push('seeded-defects: no KEY.md');
  out.present = out.missing.length === 0;
  return out;
}

// Add the private half to a staged plugin (scripts/eval-skill.mjs stage()): graders, inline graders, held-out inputs.
// Returns the number of grader entries added.
export function overlayHeldOut(skill, plugin, root = privateRoot()) {
  let n = 0;
  const src = join(root, 'evals', skill);
  if (!existsSync(src)) return 0;
  for (const c of readdirSync(src, { withFileTypes: true })) {
    if (!c.isDirectory() || c.name.startsWith('_')) continue;
    const staged = join(plugin, 'evals', c.name);
    if (!existsSync(staged)) continue;
    const g = join(src, c.name, 'graders');
    if (existsSync(g)) { cpSync(g, join(staged, 'graders'), { recursive: true }); n += readdirSync(g).length; }
    const r = join(src, c.name, 'resources');
    if (existsSync(r)) cpSync(r, join(staged, 'resources'), { recursive: true });
    const y = join(src, c.name, 'graders.yaml');
    if (existsSync(y)) {
      const block = readFileSync(y, 'utf8');
      const caseYaml = join(staged, 'case.yaml');
      if (!existsSync(caseYaml)) throw new Error(`${skill}/${c.name}: graders.yaml but the case has no case.yaml`);
      const cur = readFileSync(caseYaml, 'utf8');
      if (/^graders:/m.test(cur)) throw new Error(`${skill}/${c.name}: public case.yaml still declares graders`);
      appendFileSync(caseYaml, (cur.endsWith('\n') ? '' : '\n') + block);
      n += (block.match(/^\s*-\s+name:/gm) || []).length;
    }
  }
  return n;
}

// Hash of exactly what the overlay adds (graders and held-out inputs, not the key), so a result can say which
// held-out half scored it.
export function heldOutHash(skill, root = privateRoot()) {
  const base = join(root, 'evals', skill);
  if (!existsSync(base)) return null;
  const h = createHash('sha256');
  const walk = (d) => readdirSync(d).sort().forEach((name) => {
    const p = join(d, name);
    const rel = relative(base, p).split('\\').join('/');
    if (rel.startsWith('_') || name === 'KEY.md') return;
    if (statSync(p).isDirectory()) return walk(p);
    if (!/(^|\/)(graders(\/|\.yaml$)|resources\/)/.test(rel)) return;
    h.update(rel + '\0');
    h.update(readFileSync(p, 'utf8').replace(/\r\n/g, '\n'));
  });
  walk(base);
  return h.digest('hex').slice(0, 12);
}

const walkFiles = (d) => (existsSync(d) ? readdirSync(d).flatMap((n) => { const p = join(d, n); return statSync(p).isDirectory() ? walkFiles(p) : [p]; }) : []);

// Leak guard over the public tree. Structural, so it runs anywhere (CI has no private half).
export function leakProblems(repo = REPO, pack = PACK) {
  const problems = [];
  const rel = (p) => relative(repo, p).split('\\').join('/');
  for (const s of pack.skills) {
    const suite = join(repo, 'evals', s);
    for (const f of walkFiles(suite)) {
      const r = rel(f);
      const name = r.split('/').at(-1);
      const text = readFileSync(f, 'utf8');
      if (/\/results\//.test(r)) {
        if (!/\/results\/[^/]+\.summary\.json$/.test(r)) problems.push(`${r}: raw result output in public (only <stamp>.summary.json belongs here)`);
        else if (/"(graders|criteria|tracePath|rubric|result)"\s*:/.test(text)) problems.push(`${r}: summary carries per-grader or raw fields`);
        continue;
      }
      const cleanInput = /\/clean[^/]*\/resources(\/|$)/.test(r);
      if (cleanInput && !/\/resources$/.test(r)) { problems.push(`${r}: held-out input in public (the fixed twin reveals the answer key)`); continue; }
      if (name === 'KEY.md' || name === 'graders' || name === 'SCORECARD.md' || cleanInput || /\/_legacy-[^/]+$/.test(r)) {
        if (!isMarker(f)) problems.push(`${r}: held-out content in public (must be the held-out placeholder)`);
        continue;
      }
      if (/\/graders\//.test(r)) { problems.push(`${r}: grader file in public`); continue; }
      if (/\/resources\//.test(r)) continue;
      if (/^graders:/m.test(text)) problems.push(`${r}: declares graders inline`);
      if (/^\s*(criteria|rubric|expected(_output)?)\s*:/m.test(text) || /^type:\s*llm\b/m.test(text)) problems.push(`${r}: grader expected output in public`);
    }
  }
  for (const n of ARCHIVED_RAW) {
    const p = join(repo, ARCHIVED_RUN, n);
    if (existsSync(p) && !isMarker(p)) problems.push(`${ARCHIVED_RUN}/${n}: raw run output in public`);
  }
  return problems;
}

// Content check, only where the private half is present: no distinctive answer-key phrase in a public file outside
// the case inputs (resources/), where the planted problems naturally live.
export function keyPhraseHits(repo = REPO, root = privateRoot(), pack = PACK, extraFiles = []) {
  const phrases = new Set();
  for (const s of pack.skills) {
    const key = join(root, 'evals', s, 'seeded-defects', 'KEY.md');
    if (!existsSync(key)) continue;
    const t = readFileSync(key, 'utf8');
    for (const m of t.matchAll(/^\d+\.\s+\*\*([\w-]+)\*\*\s+\(\w+\):\s+(.+?)\s+→/gm)) { phrases.add(m[1]); phrases.add(m[2].slice(0, 48)); }
    for (const m of t.matchAll(/^\|\s*\d+\s*\|\s*([^|]{16,}?)\s*\|/gm)) phrases.add(m[1].slice(0, 40));
    for (const m of t.matchAll(/`(d\d+-[\w-]+)`/g)) phrases.add(m[1]);
  }
  const hits = [];
  const files = [...walkFiles(join(repo, 'evals')), ...walkFiles(join(repo, 'products')), ...walkFiles(join(repo, 'scripts')), join(repo, 'README.md'), ...extraFiles]
    .filter((f) => existsSync(f) && !/\/resources\//.test(f) && !/node_modules|\.git\//.test(f) && !/\.(png|jpg|gif|mp4|cast)$/.test(f));
  for (const f of files) {
    const text = readFileSync(f, 'utf8');
    for (const p of phrases) if (p.length >= 8 && text.includes(p)) hits.push(`${relative(repo, f)}: "${p}"`);
  }
  return hits;
}

// Rebuild the private half from a commit that still carried it (git history of this repo).
export function exportFrom(commit, to, repo = REPO, pack = PACK) {
  const git = (...a) => { const r = spawnSync('git', ['-C', repo, ...a], { encoding: 'utf8', maxBuffer: 1 << 28 }); if (r.status) throw new Error(r.stderr.trim()); return r.stdout; };
  const paths = git('ls-tree', '-r', '--name-only', commit).split('\n').filter(Boolean);
  let n = 0;
  const put = (path, content) => { const p = join(to, path); mkdirSync(dirname(p), { recursive: true }); writeFileSync(p, content); n++; };
  for (const p of paths) {
    const parts = p.split('/');
    if (p.startsWith(`${ARCHIVED_RUN}/`) && ARCHIVED_RAW.includes(parts[3])) { put(`runs/${parts.slice(2).join('/')}`, git('show', `${commit}:${p}`)); continue; }
    if (parts[0] !== 'evals' || !pack.skills.includes(parts[1])) continue;
    const cleanInput = parts[2]?.startsWith('clean') && parts[3] === 'resources';
    if (parts.at(-1) === 'KEY.md' || parts.includes('graders') || parts[2]?.startsWith('_legacy-') || cleanInput) { put(p, git('show', `${commit}:${p}`)); continue; }
    if (parts.length === 4 && parts[3] === 'case.yaml') {
      const m = /^graders:\n(?:[ \t].*\n?|\n)*/m.exec(git('show', `${commit}:${p}`));
      if (m) put(join(dirname(p), 'graders.yaml'), m[0].endsWith('\n') ? m[0] : `${m[0]}\n`);
    }
  }
  return n;
}

function main(argv) {
  const [cmd, ...rest] = argv;
  const root = privateRoot();
  if (cmd === 'status') {
    let missing = 0;
    console.log(`private half: ${root}${existsSync(root) ? '' : ' (not found)'}`);
    for (const s of PACK.skills) {
      const st = heldOutStatus(s, root);
      if (!st.present) missing++;
      console.log(`${st.present ? 'present' : 'MISSING'} ${s}${st.present ? `  held-out half ${heldOutHash(s, root)}` : `  ${st.missing.join('; ')}`}`);
    }
    return missing ? 1 : 0;
  }
  if (cmd === 'check') {
    const problems = leakProblems();
    const hits = existsSync(root) ? keyPhraseHits() : [];
    for (const p of [...problems, ...hits.map((h) => `answer-key phrase in a public file: ${h}`)]) console.log(`LEAK ${p}`);
    console.log(problems.length + hits.length ? `held-out check: ${problems.length + hits.length} problem(s)` : `held-out check: nothing held out is public${existsSync(root) ? ' (structure and answer-key phrases checked)' : ' (structure checked; no private half here for the phrase scan)'}`);
    return problems.length + hits.length ? 1 : 0;
  }
  if (cmd === 'export') {
    const from = rest[rest.indexOf('--from') + 1];
    const to = rest.includes('--to') ? resolve(rest[rest.indexOf('--to') + 1]) : root;
    if (!rest.includes('--from') || !from) { console.error('usage: node scripts/held-out.mjs export --from <commit> [--to <dir>]'); return 2; }
    if (resolve(to).startsWith(REPO + '/') || resolve(to) === REPO) { console.error('refusing to write the private half inside this repo'); return 2; }
    console.log(`exported ${exportFrom(from, to)} file(s) from ${from} to ${to}`);
    return 0;
  }
  console.error('usage: node scripts/held-out.mjs status | check | export --from <commit> [--to <dir>]');
  return 2;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) process.exit(main(process.argv.slice(2)));
