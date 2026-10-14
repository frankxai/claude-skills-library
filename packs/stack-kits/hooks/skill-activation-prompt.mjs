#!/usr/bin/env node
// skill-activation-prompt.mjs — UserPromptSubmit router for the stack-kits pack.
//
// Reads the prompt from stdin, matches it against the composed rules in
// .claude/skills/stack-kits.rules.json (blencorp/claude-code-kit schema) and any
// pre-existing .claude/skills/skill-rules.json (ACOS schema, `triggers.keywords`),
// and injects one short, ordered list of the skills and agents to read first. Never blocks: every failure exits 0
// silently, because a broken router must not cost the user a prompt.
//
// Differences from upstream skill-activation-prompt.ts, each deliberate:
//   - Zero dependencies. Upstream runs `npx tsx`, which needs node_modules in
//     .claude/hooks and a network fetch on a cold cache. This is plain Node 18+.
//   - A rule only fires when its target exists on disk (.claude/skills/<n>/SKILL.md
//     or .claude/agents/<n>.md). A rules file naming skills that are not installed
//     is how a router silently does nothing; this one refuses the dead reference.
//   - No path triggers. Upstream regex-matches fileTriggers against the session
//     cwd, so `app/**` fires for any checkout whose path contains "app/" (e.g.
//     ".../arcanea-ai-app/apps/web"). That is noise, not routing.
//   - The prompt is never echoed back, and only the first PROMPT_CAP chars are
//     matched, so a pasted wall of text cannot balloon the injected context.
//   - Matches are listed critical gate first, then framework kits (rules the
//     composer tagged `stage: "framework"`), then everything else by priority,
//     capped at MAX_SKILLS and followed by the rules file's `_precedence` line.
//     Ranking by priority alone let high-priority audit rules push a framework
//     kit the prompt named out of a broad request's list.

import { readFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const PROMPT_CAP = 20000;
const MAX_SKILLS = 6;
const MAX_AGENTS = 2;
const RANK = { critical: 0, high: 1, medium: 2, low: 3 };

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function keywordHit(prompt, keywords) {
  for (const kw of keywords || []) {
    if (typeof kw !== 'string' || !kw.trim()) continue;
    const k = escapeRegex(kw.toLowerCase());
    // \b only works next to word characters; "next.js" or "@apply" start or end
    // on punctuation, so fall back to a non-word lookaround there.
    const left = /^\w/.test(kw) ? '\\b' : '(?<![\\w])';
    const right = /\w$/.test(kw) ? '\\b' : '(?![\\w])';
    if (new RegExp(left + k + right, 'i').test(prompt)) return kw;
  }
  return null;
}

function intentHit(prompt, patterns) {
  for (const p of patterns || []) {
    try {
      if (new RegExp(p, 'i').test(prompt)) return p;
    } catch {
      // An invalid pattern in one rule must not take the others down.
    }
  }
  return null;
}

export function route(prompt, rules, exists) {
  const text = String(prompt || '').slice(0, PROMPT_CAP).toLowerCase();
  const pick = (entries, kind) => {
    const out = [];
    entries.forEach(([name, rule], order) => {
      if (!rule || typeof rule !== 'object' || rule.disabled) return;
      if (!exists(kind, name)) return;
      const t = rule.promptTriggers || rule.triggers || {};
      const why = keywordHit(text, t.keywords) || (intentHit(text, t.intentPatterns) && 'intent');
      if (!why) return;
      const rank = RANK[rule.priority] ?? RANK.low;
      const tier = rank === RANK.critical ? 0 : rule.stage === 'framework' ? 1 : 2;
      out.push({ name, rule, why, order, rank, tier });
    });
    return out.sort((a, b) => a.tier - b.tier || a.rank - b.rank || a.order - b.order);
  };
  const skills = pick(Object.entries(rules.skills || {}), 'skill').slice(0, MAX_SKILLS);
  const agents = pick(Object.entries(rules.agents || {}), 'agent').slice(0, MAX_AGENTS);
  return { skills, agents };
}

export function render({ skills, agents }, rules) {
  if (!skills.length && !agents.length) return '';
  const lines = [];
  if (skills.length) {
    lines.push('[stack-kits] Read these skills in order before acting (SKILL.md under .claude/skills/):');
    skills.forEach((s, i) => {
      const desc = s.rule.description ? ` — ${s.rule.description}` : '';
      lines.push(`  ${i + 1}. ${s.name} [${s.rule.priority || 'low'}]${desc}`);
    });
  }
  if (agents.length) {
    lines.push('[stack-kits] Subagents that fit this request:');
    for (const a of agents) {
      const desc = a.rule.description ? ` — ${a.rule.description}` : '';
      lines.push(`  - ${a.name}${desc}`);
    }
  }
  if (typeof rules._precedence === 'string' && rules._precedence.trim()) {
    lines.push(`[stack-kits] Precedence: ${rules._precedence.trim()}`);
  }
  return lines.join('\n');
}

function main() {
  let input;
  try {
    input = JSON.parse(readFileSync(0, 'utf8'));
  } catch {
    return;
  }
  const projectDir = process.env.CLAUDE_PROJECT_DIR || input.cwd || process.cwd();
  const dir = join(projectDir, '.claude', 'skills');
  const load = (file) => {
    try {
      const parsed = JSON.parse(readFileSync(join(dir, file), 'utf8'));
      return parsed && typeof parsed === 'object' ? parsed : null;
    } catch {
      return null; // absent or broken: route with whatever else loads
    }
  };
  const composed = load('stack-kits.rules.json') || {};
  const legacy = load('skill-rules.json') || {};
  const rules = {
    _precedence: composed._precedence,
    skills: { ...(legacy.skills || {}), ...(composed.skills || {}) },
    agents: { ...(legacy.agents || {}), ...(composed.agents || {}) },
  };

  const exists = (kind, name) => {
    if (!/^[A-Za-z0-9][A-Za-z0-9._:-]*$/.test(name)) return false; // no path segments
    return kind === 'skill'
      ? existsSync(join(projectDir, '.claude', 'skills', name, 'SKILL.md'))
      : existsSync(join(projectDir, '.claude', 'agents', `${name}.md`));
  };

  const context = render(route(input.prompt, rules, exists), rules);
  if (!context) return;
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: { hookEventName: 'UserPromptSubmit', additionalContext: context },
    }) + '\n',
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    main();
  } catch {
    // never block the prompt
  }
  process.exit(0);
}
