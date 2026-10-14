// compose.mjs — build a target repo's .claude/skills/stack-kits.rules.json.
//
//   node lib/compose.mjs <target-repo> <comma-separated installed kits> [aliases-json]
//
// Inputs, in merge order (later wins, by rule name):
//   1. rules/kits/<kit>.json   — vendored upstream fragments, one per kit installed
//   2. rules/estate.json       — pairing rules for web-excellence and estate skills
//   3. <target>/.claude/skills/stack-kits.local.json — the repo's own rules,
//      never touched by install.sh; `{"disabled": true}` drops a rule
//
// Aliases map a kit to an equivalent skill the repo already had (nextjs →
// nextjs-react-expert): the kit's triggers are kept, the rule is renamed.
//
// Output keeps only rules whose skill or agent exists in the target, so the
// generated file never names something that is not there. A repo's own
// skill-rules.json (ACOS schema) is never written; the router reads it alongside.

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const PACK = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function strip(obj) {
  // Drop "_comment"-style keys from a rules map; keep everything else.
  return Object.fromEntries(Object.entries(obj || {}).filter(([k]) => !k.startsWith('_')));
}

export function compose({ target, kits = [], aliases = {}, pack = PACK }) {
  const estate = readJson(join(pack, 'rules', 'estate.json'));
  const skills = {};
  const agents = {};

  for (const kit of kits) {
    const fragment = readJson(join(pack, 'rules', 'kits', `${kit}.json`));
    for (const [name, rule] of Object.entries(strip(fragment))) {
      const as = aliases[name] || name;
      const next = { ...rule };
      delete next.fileTriggers; // the router ignores path triggers; do not imply otherwise
      if (as !== name) next.description = `framework patterns (stack-kits routes ${name} triggers here)`;
      const prev = skills[as];
      if (prev) {
        // Two kits aliased to one skill (nextjs and react → nextjs-react-expert):
        // union the triggers and keep the stronger priority, so neither kit's
        // prompts stop routing.
        const union = (a = [], b = []) => [...new Set([...a, ...b])];
        const rank = { critical: 0, high: 1, medium: 2, low: 3 };
        next.priority = (rank[prev.priority] ?? 3) <= (rank[next.priority] ?? 3) ? prev.priority : next.priority;
        next.promptTriggers = {
          keywords: union(prev.promptTriggers?.keywords, next.promptTriggers?.keywords),
          intentPatterns: union(prev.promptTriggers?.intentPatterns, next.promptTriggers?.intentPatterns),
        };
      }
      skills[as] = next;
    }
  }
  Object.assign(skills, strip(estate.skills));
  Object.assign(agents, strip(estate.agents));

  const localPath = join(target, '.claude', 'skills', 'stack-kits.local.json');
  let localPrecedence;
  if (existsSync(localPath)) {
    const local = readJson(localPath);
    for (const [bucket, into] of [['skills', skills], ['agents', agents]]) {
      for (const [name, rule] of Object.entries(strip(local[bucket]))) {
        if (rule && rule.disabled) delete into[name];
        else into[name] = { ...(into[name] || {}), ...rule };
      }
    }
    if (typeof local._precedence === 'string') localPrecedence = local._precedence;
  }

  const has = (kind, name) =>
    kind === 'skill'
      ? existsSync(join(target, '.claude', 'skills', name, 'SKILL.md'))
      : existsSync(join(target, '.claude', 'agents', `${name}.md`));
  const keep = (map, kind) =>
    Object.fromEntries(Object.entries(map).filter(([name]) => has(kind, name)));

  const brandFiles = (estate.precedence_files || []).filter((f) => existsSync(join(target, f)));
  const precedence =
    localPrecedence ||
    [
      brandFiles.length
        ? `${brandFiles.join(', ')} outrank every skill listed here.`
        : 'The repo\'s own design and copy files outrank every skill listed here.',
      'Kit examples use placeholder colors and fonts; use this repo\'s tokens instead.',
    ].join(' ');

  let commit = 'unknown';
  try {
    commit = readJson(join(pack, 'rules', 'upstream.json')).commit;
  } catch {
    // upstream.json is written by sync-upstream.sh; absent only in a broken checkout
  }

  return {
    _generated:
      'Written by claude-skills-library packs/stack-kits/install.sh. Do not edit: put repo rules in stack-kits.local.json and re-run the installer.',
    _vendor: { source: 'blencorp/claude-code-kit', commit, kits, aliases },
    _precedence: precedence,
    version: '1.0',
    skills: keep(skills, 'skill'),
    agents: keep(agents, 'agent'),
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const [target, kitsArg = '', aliasesArg = '{}'] = process.argv.slice(2);
  if (!target) {
    console.error('usage: compose.mjs <target> <kits,comma,separated> [aliases-json]');
    process.exit(2);
  }
  const kits = kitsArg.split(',').map((s) => s.trim()).filter(Boolean);
  const rules = compose({ target: resolve(target), kits, aliases: JSON.parse(aliasesArg) });
  const out = join(resolve(target), '.claude', 'skills', 'stack-kits.rules.json');
  writeFileSync(out, JSON.stringify(rules, null, 2) + '\n');
  console.log(
    `  rules  .claude/skills/stack-kits.rules.json (${Object.keys(rules.skills).length} skills, ${Object.keys(rules.agents).length} agents)`,
  );
}
