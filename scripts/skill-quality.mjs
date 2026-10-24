#!/usr/bin/env node
// Skill quality lint for the tested pack: the things a buyer would trip over before any eval runs.
//
//   node scripts/skill-quality.mjs [skill ...] [--pack <manifest.json>] [--json]
//
// With no skills named, checks every skill in products/skills-with-evals/pack.json.
//
// Hard rules (exit 1 if any fails):
//   frontmatter  name is lowercase-hyphen and matches the folder; description present, at most 1,024
//                characters, no XML tags (shared with scripts/trigger-lint.mjs)
//   trigger      the description says when to use the skill ("Use when ...", "Use before ...")
//   boundaries   the body has a section that says when not to use it ("When not to use", "Boundaries",
//                "What this skill does not do", "Out of scope"), with real content under it
//   dollar-arg   no unescaped $<digit> in prose. Claude Code (2.1.310, checked in the binary) replaces
//                $0, $1, ... (any $<digits> not followed by a letter, digit or _) with the skill's
//                arguments whenever the skill is invoked with that many arguments, so "costs $5 a
//                month" or SQL "WHERE id = $1" silently changes. Write \$1 or put it in a code block.
//   size         body at most 500 lines and about 5,000 tokens (characters / 4), Anthropic's guidance
//                for SKILL.md; longer material goes in references/ and loads only when needed
//
// Warnings (never change the exit code):
//   - the "use when" cue starts after character 100 (Codex trims descriptions on large installs)
//   - $<digit> inside a fenced code block (substituted too when enough arguments are passed)
//   - description not in the third person

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { lintSkill } from './trigger-lint.mjs';

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const BUDGET = { lines: 500, tokens: 5000 };
export const BOUNDARY_HEADING = /^(#{2,3})\s+(when not to use|when to use something else|boundaries|scope and boundaries|out of scope|limits of this skill|what this skill does not do|not for)\b/i;
// Claude Code's own pattern is /\$(\d+)(?!\w)/ with "\$" protected; match it exactly.
const ARG = /(?<!\\)\$(\d+)(?!\w)/g;

function splitFrontmatter(text) {
  const m = /^\uFEFF?---\r?\n[\s\S]*?\r?\n---\r?\n?/.exec(text);
  return m ? text.slice(m[0].length) : text;
}

// Walk the body once, tracking fenced code blocks (``` or ~~~, any length, matching close).
export function scanBody(body) {
  const lines = body.split(/\r?\n/);
  const out = { lines: lines.length, chars: body.length, prose: [], fenced: [] };
  let fence = null;
  lines.forEach((line, i) => {
    const f = /^\s*(`{3,}|~{3,})/.exec(line);
    if (f) {
      if (!fence) fence = f[1];
      else if (f[1][0] === fence[0] && f[1].length >= fence.length && /^\s*[`~]+\s*$/.test(line)) fence = null;
      return;
    }
    (fence ? out.fenced : out.prose).push({ n: i + 1, line });
  });
  return out;
}

export function boundarySection(prose) {
  for (let i = 0; i < prose.length; i++) {
    const h = BOUNDARY_HEADING.exec(prose[i].line);
    if (!h) continue;
    const level = h[1].length;
    const content = [];
    for (let j = i + 1; j < prose.length; j++) {
      const next = /^(#{1,6})\s/.exec(prose[j].line);
      if (next && next[1].length <= level) break;
      if (prose[j].line.trim() && !/^-{3,}$/.test(prose[j].line.trim())) content.push(prose[j].line.trim());
    }
    return { heading: prose[i].line.replace(/^#+\s+/, ''), line: prose[i].n, contentChars: content.join(' ').length, items: content.filter((l) => /^([-*]|\d+\.)\s/.test(l)).length };
  }
  return null;
}

export function dollarArgs(entries) {
  const hits = [];
  for (const { n, line } of entries) for (const m of line.matchAll(ARG)) hits.push({ line: n, token: m[0], text: line.trim().slice(0, 100) });
  return hits;
}

export function qualitySkill(dir) {
  const base = lintSkill(dir);
  const out = { skill: base.skill, errors: [], warnings: [], cueAt: base.cueAt, descriptionLength: base.descriptionLength, body: null, boundaries: null };
  for (const e of base.errors) out.errors.push(/trigger cue/.test(e) ? `trigger: ${e}` : `frontmatter: ${e}`);
  for (const w of base.warnings) if (!/^body is/.test(w)) out.warnings.push(w);
  const file = join(dir, 'SKILL.md');
  if (!existsSync(file)) return out;
  const body = splitFrontmatter(readFileSync(file, 'utf8'));
  const scan = scanBody(body);
  const tokens = Math.ceil(scan.chars / 4);
  out.body = { lines: scan.lines, tokens };
  const b = boundarySection(scan.prose);
  out.boundaries = b;
  if (!b) out.errors.push('boundaries: no "When not to use" / "Boundaries" / "What this skill does not do" section');
  else if (b.contentChars < 80 && b.items < 2) out.errors.push(`boundaries: "${b.heading}" (line ${b.line}) has almost nothing under it`);
  for (const h of dollarArgs(scan.prose)) out.errors.push(`dollar-arg: ${h.token} in prose at body line ${h.line} is replaced by an argument when the skill is invoked with arguments; write \\${h.token.slice(1)} or move it into a code block: "${h.text}"`);
  for (const h of dollarArgs(scan.fenced)) out.warnings.push(`${h.token} in a code block at body line ${h.line} is substituted when the skill is invoked with ${Number(h.token.slice(1)) + 1}+ arguments`);
  if (scan.lines > BUDGET.lines) out.errors.push(`size: body is ${scan.lines} lines (budget ${BUDGET.lines}); move reference material into references/`);
  if (tokens > BUDGET.tokens) out.errors.push(`size: body is about ${tokens} tokens (budget ${BUDGET.tokens}); move reference material into references/`);
  return out;
}

function skillDir(name) {
  for (const r of ['free-skills', 'free-skills/anthropic', 'free-skills/creative', 'free-skills/technical']) {
    const d = join(REPO, r, name);
    if (existsSync(join(d, 'SKILL.md'))) return d;
  }
  throw new Error(`unknown skill ${name}`);
}

function main(argv) {
  const names = [];
  let json = false; let pack = null;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--json') json = true;
    else if (a === '--pack') pack = argv[++i];
    else if (a.startsWith('--')) { console.error(`unknown option ${a}`); return 2; }
    else names.push(a);
  }
  if (!names.length || pack) names.push(...JSON.parse(readFileSync(resolve(pack || join(REPO, 'products', 'skills-with-evals', 'pack.json')), 'utf8')).skills);
  let dirs;
  try { dirs = [...new Set(names)].map(skillDir); } catch (e) { console.error(e.message); return 2; }
  const results = dirs.map(qualitySkill);
  const failed = results.filter((r) => r.errors.length);
  if (json) console.log(JSON.stringify({ budget: BUDGET, checked: results.length, failed: failed.length, results }, null, 2));
  else {
    for (const r of results) {
      const status = r.errors.length ? 'FAIL' : r.warnings.length ? 'WARN' : 'ok';
      const size = r.body ? `${r.body.lines}L/${r.body.tokens}t` : '-';
      console.log(`${status.padEnd(4)} ${r.skill.padEnd(28)} cue@${String(r.cueAt ?? '-').padEnd(4)} body=${size.padEnd(11)} boundaries=${r.boundaries ? 'yes' : 'no'}${[...r.errors, ...r.warnings.map((w) => `warn: ${w}`)].map((m) => `\n       ${m}`).join('')}`);
    }
    console.log(`skill-quality: ${results.length} checked, ${failed.length} failed (budget ${BUDGET.lines} lines, ~${BUDGET.tokens} tokens)`);
  }
  return failed.length ? 1 : 0;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) process.exit(main(process.argv.slice(2)));
