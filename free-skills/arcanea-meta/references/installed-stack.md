# Installed Stack — verified 2026-04-15

## Claude plugins (via marketplaces)

| Plugin | Version | Scope | Marketplace |
|---|---|---|---|
| typescript-lsp | 1.0.0 | user | claude-plugins-official |
| vercel | 0.40.0 | project (Arcanea) | claude-plugins-official |
| superpowers | 5.0.7 | user | claude-plugins-official |
| superpowers-lab | 0.4.0 | user | superpowers-marketplace |

**4 plugins total. 2 marketplaces.** Source: `~/.claude/plugins/installed_plugins.json`.

## Marketplaces known

| Name | GitHub repo |
|---|---|
| claude-plugins-official | anthropics/claude-plugins-official |
| superpowers-marketplace | obra/superpowers-marketplace |

**Not installed yet:** Frank's own `agentic-creator-skills` marketplace.

## Counts (verified 2026-04-15, treat as stale after 7 days)

| Concern | Location | Count |
|---|---|---|
| Global agents | `~/.claude/agents/` | 42 |
| Global commands | `~/.claude/commands/` | 84 |
| Global skills | `~/.claude/skills/` | ~30+ subdirs |
| Project skills | `~/Arcanea/.claude/skills/` | ~100+ subdirs (mixed .md and dirs) |
| Global hooks | `~/.claude/hooks/` | 3 (pre-commit, session-logger, skill-activation-prompt) |
| Project hooks | `~/Arcanea/.claude/hooks/` | 9 (session-start/end, pre/post-tool, prompt-submit, voice-check, context-tracker, model-route, ops-heartbeat) |
| ACOS install hooks | `~/.claude/acos/hooks/` | 9 (activation-logger, audit-trail, circuit-breaker, memory-check, self-modify-gate, session-end-log, session-logger, skill-activation-prompt, pre-commit) |

**Hook overlap warning:** `skill-activation-prompt` exists in 3 places (~/.claude/hooks/, ~/.claude/acos/hooks/, possibly elsewhere). Likely divergent. Audit needed.

## Re-verification commands

```bash
# Plugins
cat ~/.claude/plugins/installed_plugins.json | grep -E '"[a-z-]+@'

# Counts
ls ~/.claude/agents/ | wc -l
ls ~/.claude/commands/ | wc -l
ls ~/.claude/skills/ | wc -l
ls ~/.claude/hooks/

# Project (run from ~/Arcanea)
ls .claude/skills/ | wc -l
ls .claude/hooks/

# Hook divergence check
for path in ~/.claude/hooks ~/.claude/acos/hooks ~/Arcanea/.claude/hooks; do
  echo "=== $path ==="; ls "$path" 2>/dev/null
done
```

## What's NOT installed (gaps)

- `agentic-creator-skills` marketplace (Frank's own — should self-install)
- `claude-flow` plugin (only referenced in skills, not actually installed)
- `knowledge-work-plugins` (cited as inspiration but not vendored)
- `claude-mem` (memory targeted absorption, AGPL — needs license review)

## Memory authoritative claims (verified)

Memory `project_acos_absorptions.md` claims gstack/ECC/GSD absorbed. **Verification pending** — need to grep for vendored markers. Until verified, treat as "patterns referenced in skill docs, not structurally absorbed."
