#!/usr/bin/env node
// Static trigger check for Agent Skills: will the routing text reach the model, in every runtime?
//
// Both Claude Code and Codex route on a skill's name + description only. Codex 0.164 shows each
// description truncated to about 100 characters in the model-visible skill list (measured
// 2026-10-24 with `codex debug prompt-input`: 114 of 114 library descriptions cut at 102-106
// characters). A "when to use" clause after that point is invisible to Codex.
//
//   node scripts/trigger-lint.mjs [skill ...] [--pack <manifest.json>] [--json] [--cutoff N]
//
// Exit 0: every checked skill passes the hard rules. Exit 1: at least one hard failure.
// Exit 2: bad usage. Warnings never change the exit code.

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CUE = /\b(use (it )?(when|whenever|for|before|after|this)|when (the user|you|asked|a |an |someone|reviewing|building|writing)|trigger(s|ed)? (on|when))/i;

export function parseFrontmatter(text) {
  const m = /^\uFEFF?---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(text);
  if (!m) return null;
  const fm = {};
  const lines = m[1].split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const kv = /^([A-Za-z_][\w-]*):\s?(.*)$/.exec(lines[i]);
    if (!kv) continue;
    let [, key, value] = kv;
    if (value === '>' || value === '>-' || value === '|' || value === '|-') {
      const block = [];
      while (i + 1 < lines.length && /^\s+\S/.test(lines[i + 1])) block.push(lines[++i].trim());
      value = block.join(value.startsWith('>') ? ' ' : '\n');
    } else {
      // A plain scalar may continue on indented lines.
      while (i + 1 < lines.length && /^\s+\S/.test(lines[i + 1]) && !/^\s*-\s/.test(lines[i + 1])) value += ' ' + lines[++i].trim();
      value = value.trim().replace(/^(["'])([\s\S]*)\1$/, '$2');
    }
    fm[key] = value;
  }
  return { fm, bodyLines: text.slice(m[0].length).split(/\r?\n/).length };
}

export function lintSkill(dir, { cutoff = 100 } = {}) {
  const folder = dir.split(/[\\/]/).pop();
  const file = join(dir, 'SKILL.md');
  const out = { skill: folder, errors: [], warnings: [], descriptionLength: 0, cueAt: null };
  if (!existsSync(file)) { out.errors.push('no SKILL.md'); return out; }
  const parsed = parseFrontmatter(readFileSync(file, 'utf8'));
  if (!parsed) { out.errors.push('no YAML frontmatter'); return out; }
  const { fm, bodyLines } = parsed;
  const name = fm.name || '';
  const desc = (fm.description || '').replace(/\s+/g, ' ').trim();
  out.descriptionLength = desc.length;
  if (!/^[a-z0-9][a-z0-9-]{0,63}$/.test(name)) out.errors.push(`name "${name}" is not lowercase-hyphen, 1-64 chars`);
  if (name && name !== folder) out.errors.push(`name "${name}" does not match folder "${folder}"`);
  if (!desc) out.errors.push('description is empty');
  if (desc.length > 1024) out.errors.push(`description is ${desc.length} chars (limit 1024)`);
  if (/<[a-z][^>]*>/i.test(desc)) out.errors.push('description contains an XML/HTML tag');
  const cue = CUE.exec(desc);
  out.cueAt = cue ? cue.index : null;
  if (!cue) out.errors.push('description has no "use when" style trigger cue');
  else if (cue.index > cutoff) out.warnings.push(`trigger cue starts at char ${cue.index}; Codex shows only ~${cutoff}`);
  if (/^(i |i'm |i am |we |this skill (will|helps you))/i.test(desc)) out.warnings.push('description is not third person');
  if (bodyLines > 500) out.warnings.push(`body is ${bodyLines} lines (guide: under 500)`);
  return out;
}

function skillDirs(names) {
  const roots = ['free-skills', 'free-skills/anthropic', 'free-skills/creative', 'free-skills/technical'].map((r) => join(REPO, r));
  const all = new Map();
  for (const r of roots) {
    if (!existsSync(r)) continue;
    for (const d of readdirSync(r, { withFileTypes: true })) {
      if (d.isDirectory() && existsSync(join(r, d.name, 'SKILL.md'))) all.set(d.name, join(r, d.name));
    }
  }
  if (!names.length) return [...all.values()];
  return names.map((n) => { if (!all.has(n)) throw new Error(`unknown skill ${n}`); return all.get(n); });
}

function main(argv) {
  const names = [];
  let json = false; let cutoff = 100; let pack = null;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--json') json = true;
    else if (a === '--cutoff') cutoff = Number(argv[++i]);
    else if (a === '--pack') pack = argv[++i];
    else if (a.startsWith('--')) { console.error(`unknown option ${a}`); return 2; }
    else names.push(a);
  }
  if (!(cutoff > 0)) { console.error('--cutoff must be a positive number'); return 2; }
  if (pack) names.push(...JSON.parse(readFileSync(resolve(pack), 'utf8')).skills);
  let dirs;
  try { dirs = skillDirs(names); } catch (e) { console.error(e.message); return 2; }
  const results = dirs.map((d) => lintSkill(d, { cutoff }));
  const failed = results.filter((r) => r.errors.length);
  const warned = results.filter((r) => r.warnings.length);
  if (json) console.log(JSON.stringify({ cutoff, checked: results.length, failed: failed.length, warned: warned.length, results }, null, 2));
  else {
    for (const r of results) {
      const status = r.errors.length ? 'FAIL' : r.warnings.length ? 'WARN' : 'ok';
      console.log(`${status.padEnd(4)} ${r.skill.padEnd(32)} desc=${String(r.descriptionLength).padStart(4)} cue@${r.cueAt ?? '-'}${[...r.errors, ...r.warnings].map((m) => `\n       ${m}`).join('')}`);
    }
    console.log(`trigger-lint: ${results.length} checked, ${failed.length} failed, ${warned.length} with warnings (Codex cutoff ${cutoff})`);
  }
  return failed.length ? 1 : 0;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) process.exit(main(process.argv.slice(2)));
