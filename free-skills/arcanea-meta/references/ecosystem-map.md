# Ecosystem Map

Spot-checked 2026-04-15 against `~/.claude/projects/C--Users-frank-Arcanea/memory/reference_repo_index.md` (23 days old). 8/11 sampled repos verified local. Treat as ~85% accurate; re-verify before citing specific repo state.

## Spot-check results (2026-04-15)

| Repo | On disk at ~/<repo>? | Notes |
|---|---|---|
| arcanea-ai-app | ✅ | Production web (deployed arcanea.ai) |
| arcanea-code | ✅ | Flagship CLI (OpenCode fork) |
| oh-my-arcanea | ✅ | Active harness overlay |
| arcanea-orchestrator | ✅ | Multi-agent orchestrator |
| arcanea | ✅ | OSS monorepo |
| arcanea-claw | ❌ at ~/, ✅ at ~/Arcanea/arcanea-claw/ | Index says top-level; reality is nested |
| arcanea-author | ❌ | Not on this machine |
| arcanea-vault | ✅ | Cross-AI capture |
| agentic-creator-os | ✅ + 4 drift copies | Canonical = ~/agentic-creator-os/ |
| arcanea-flow | ✅ | claude-flow fork |
| knowledge-work-plugins | ❌ | Referenced in skills, not vendored |

## Active core repos (per memory, verify before citing)

- `arcanea-ai-app` — Main web platform monorepo
- `arcanea-code` — Flagship CLI (OpenCode fork)
- `oh-my-arcanea` — OpenCode harness overlay
- `claude-arcanea` — Claude Code harness
- `arcanea-orchestrator` — Multi-agent orchestrator (`ao`)
- `arcanea` — OSS monorepo (skills, agents, lore)
- `arcanea-records` — Music studio assets

## Intelligence systems

- `Starlight-Intelligence-System` — 5-layer cognitive architecture
- `acos-intelligence-system` — ARCHIVED (Feb 2026), absorbed into agentic-creator-os
- `agentic-creator-os` — Canonical ACOS, 90+ skills
- `arcanea-intelligence-os` — Mythology orchestration (reference)
- `arcanea-flow` — Multi-agent (claude-flow fork)

## Content & creative

`arcanea-claw`, `arcanea-author`, `author-os`, `author-os-skills`, `arcanea-infogenius`, `suno-mcp-server`, `arcanea-video-pipeline`, `visual-intelligence`

## Extensions

`arcanea-vscode`, `arcanea-openclaw`, `arcanean-open-webui`, `arcanea-lobechat-labs`, `arcanea-vault`, `arcanea-plugins`

## Web3

`arcanea-onchain`, `arcanea-marketplace`

## Skills & config

`agentic-creator-skills`, `claude-code-hooks`, `claude-code-config`, `context-engineering-for-creators`, `claude-scientific-skills`, `arcanean-prompt-language`

## Reference / academy

`ai-architect-academy`, `knowledge-work-plugins`, `starlight-horizon-dataset`

## Archive / superseded

| Old | Replaced by |
|---|---|
| arcanea-opencode | oh-my-arcanea |
| arcanea-platform | arcanea-ai-app |
| arcanea-ecosystem | Main monorepo |
| gemini-arcanea | arcanea-code |
| codex-arcanea | arcanea-code |
| lobe-chat-* | arcanea-lobechat-labs |

## Re-verification command

```bash
for repo in arcanea-ai-app arcanea-code oh-my-arcanea arcanea-orchestrator arcanea arcanea-vault agentic-creator-os arcanea-flow; do
  [ -d "$HOME/$repo" ] && echo "LOCAL: $repo" || echo "MISSING: $repo"
done
```

For nested repos under `~/Arcanea/`, also check `[ -d "$HOME/Arcanea/$repo" ]`.

For GitHub-side existence, use `gh repo view frankxai/<name>` (requires gh auth).
