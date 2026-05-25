---
name: arcanea-meta
description: "Arcanea ecosystem self-description. Use when asked about the system map, where things live, canonical locations, how to add a skill/command/agent/hook, how to absorb a repo, or what's installed. Trigger phrases: arcanea meta, system map, where does X live, add a skill, absorb a repo, what's installed, ecosystem inventory."
---

# Arcanea Meta

The system describing itself with the same primitives it uses to build everything else. This skill is the load-bearing meta layer — the place to start when you don't know where something lives.

## Mental model

Arcanea is **not one repo**. It is an ecosystem of ~90 repos at github.com/frankxai, plus four installed plugins, plus a hierarchy of skills/commands/agents/hooks at three scopes:

```
GLOBAL  (~/.claude/)               ← user-scope, every project sees this
PROJECT (<repo>/.claude/)           ← per-repo overrides + additions
PLUGIN  (~/.claude/plugins/cache/)  ← marketplace-installed (read-only)
```

Most failures come from forgetting which scope a thing lives in. Default rule: **if it's reusable across repos, put it global. If it's Arcanea-specific, put it project. Never duplicate across both.**

## Canonical locations (verified 2026-04-15, see `references/canonical-locations.md` for full table)

| Concern | Canonical | Why |
|---|---|---|
| Memory | `~/.claude/projects/C--Users-frank-Arcanea/memory/` | Auto-loaded via MEMORY.md every turn |
| ACOS source | `~/agentic-creator-os/` | Has FRANK_DNA.md + memory.db (irreplaceable) |
| ACOS runtime | `~/.claude/acos/` | What the harness actually invokes |
| Arcanea monorepo | `~/Arcanea/` | Web app + packages + lore + book |
| Validation contract | `~/Arcanea/CLAUDE.md` § Cached-Belief Validation Protocol | Loads every turn |
| Hooks (project) | `~/Arcanea/.claude/hooks/` | 9 hooks, project-scope |
| Hooks (global) | `~/.claude/hooks/` | 3 hooks, user-scope |
| Skills | scattered (see `references/installed-stack.md`) | Migration ongoing |
| Source clones (for absorption) | `~/sources/` | Pre-integration staging |

When in doubt, read `references/canonical-locations.md`.

## What's installed (verified 2026-04-15)

- **4 Claude plugins** (typescript-lsp, vercel, superpowers v5.0.7, superpowers-lab v0.4.0)
- **2 marketplaces** (anthropics/claude-plugins-official, obra/superpowers-marketplace)
- **42 global agents**, **84 global commands** (~/.claude/{agents,commands}/)
- **~100+ skill directories** (~/.claude/skills/ + ~/Arcanea/.claude/skills/)
- **9 project hooks + 3 global hooks** (no overlap by name yet)

Update by re-running the verification commands in `references/installed-stack.md`. Treat the numbers as stale after 7 days.

## Meta-rules (the contract)

1. **Disk-first, memory-as-history.** Any claim about current state (versions, ship status, file paths, architecture, deploy state) requires same-turn verification OR explicit "unverified, from memory:" prefix. Memory authoritative only for intent, strategy, preferences, decision history. (See `references/validation-contract.md`.)

2. **Canonical wins.** When two copies exist, the canonical (per `canonical-locations.md`) is truth. Drift copies get `DEPRECATED_DELETE_AFTER_VERIFY.md` markers, never silent edits.

3. **Absorption is provenance.** Claiming "absorbed pattern X from repo Y" requires entry in `references/absorption-log.md` with source URL, commit SHA, integrated-at path, date, verifier. No vague "we took inspiration from" allowed.

4. **Scope before content.** Before adding a skill/command/agent/hook, decide scope (global vs project vs plugin). Wrong-scope additions create the duplication that broke ACOS.

5. **Progressive disclosure.** SKILL.md stays under 3K words and contains the mental model + workflow skeleton. Depth lives in `references/`. Skills that violate this become unreadable monoliths (the original acos-meta did this — it teaches progressive disclosure but didn't use it).

## How to add a skill

```
1. Decide scope:
   - Global (multi-repo use)  → ~/.claude/skills/<name>/
   - Project (Arcanea-only)   → ~/Arcanea/.claude/skills/<name>/
2. Create SKILL.md with YAML frontmatter (name + description with trigger phrases)
3. Keep SKILL.md under 3000 words. Mental model + workflow + key principles.
4. Create references/ subdirectory for depth content.
5. Test: invoke the trigger phrase, verify activation.
```

## How to add a command

```
1. ~/.claude/commands/<name>.md (global) or project-scope equivalent
2. YAML frontmatter: description, optional argument-hint
3. Body is a markdown workflow — no code, pure instructions
4. Reference skills/agents by name; the harness wires them
5. Test: /<name> [args]
```

## How to add an agent

```
1. ~/.claude/agents/<name>.md
2. Frontmatter: description with usage examples, model preference (optional)
3. Body = the agent's system prompt (role, capabilities, constraints, output format)
4. Invoke via Agent tool with subagent_type=<name>
```

## How to add a hook

```
1. Decide event: SessionStart | UserPromptSubmit | PreToolUse | PostToolUse | Stop | SessionEnd | Notification
2. Write ~/.claude/hooks/<name>.sh (global) or ~/Arcanea/.claude/hooks/ (project)
3. Register in settings.json (or settings.local.json) under "hooks": { "<Event>": [...] }
4. Test: trigger the event, check the hook ran (logs at ~/.arcanea/sessions/current/)
```

Hook count discipline: stay under 12 total. When two hooks share >30% logic, extract a shared lib.

## How to absorb a repo

The contract (no exceptions):

```
1. git clone --depth=1 <url> ~/sources/<name>/
2. Capture HEAD SHA, list 3-5 specific patterns/files you want
3. Add entry to references/absorption-log.md (source, SHA, patterns, target paths, date, verifier)
4. Integrate the patterns at the target paths (separate session/PR)
5. Update absorption-log.md status: cloned → integrated → verified
6. After integration verified, decide: keep clone for reference or rm -rf ~/sources/<name>
```

Vague "inspired by" or "we took ideas from" is not absorption. Either it's logged with provenance or it didn't happen.

## Validation contract integration

This skill is the home for the validation contract designed in 2026-04-15 session:
- L0 Authority Registry → `.arcanea/AUTHORITY.md` (deferred, Week 2)
- L1 Memory frontmatter → migration plan in `references/validation-contract.md` (deferred, Week 2)
- L2 CLAUDE.md protocol → root `CLAUDE.md` § Cached-Belief Validation Protocol (Week 1 ship target)
- L3 `/verify-status` skill → deferred Week 3
- L4 Stop-hook claim audit → deferred Week 4

Status of Week-1 ship: **designed, Guardian-approved, not yet shipped to disk.**

## When this skill activates

Use when:
- "What's installed?" / "What do we have?"
- "Where does X live?" / "Where should I add Y?"
- "How do I add a skill/command/agent/hook?"
- "How does absorption work?" / "Did we absorb repo X?"
- "What's the canonical version of Z?"
- Onboarding a new tool, repo, or capability
- Auditing for drift, duplication, or stale claims

Don't use for: domain work (code, content, design, lore). Route to domain skills/agents.

## References

- `references/ecosystem-map.md` — full repo inventory + spot-check freshness
- `references/installed-stack.md` — verified plugin/skill/agent/command/hook counts + how to re-verify
- `references/canonical-locations.md` — which copy wins for every concern, archival plan for drift
- `references/absorption-log.md` — strict-format provenance table
- `references/validation-contract.md` — full 5-layer contract spec + rollout plan
