# Absorption Log

Strict provenance for every claim of "we absorbed X." No vague "inspired by" entries.

## Format

```
| # | Source repo | Source URL | Commit SHA | Patterns | Integrated at | Date | Verified by | Status |
```

Status enum: `cloned` | `extracted` | `integrated` | `verified` | `removed`

## Entries

| # | Source repo | URL | SHA | Patterns | Integrated at | Date | Verified by | Status |
|---|---|---|---|---|---|---|---|---|
| 1 | superpowers (anthropic) | claude-plugins-official marketplace | git: ba93bfdea8c54dfec2e6e8550689f2f90e98a097 (registry) | superpowers v5.0.7 plugin (full skill bundle: brainstorming, executing-plans, systematic-debugging, TDD, writing-skills, etc.) | `~/.claude/plugins/cache/claude-plugins-official/superpowers/5.0.7/` | 2026-04-06 | Frank (install) | **integrated** (active plugin) |
| 2 | superpowers-lab (obra) | superpowers-marketplace | (registry) | superpowers-lab v0.4.0 (mcp-cli, finding-duplicate-functions, slack-messaging, windows-vm, tmux-interactive) | `~/.claude/plugins/cache/superpowers-marketplace/superpowers-lab/0.4.0/` | 2026-04-06 | Frank (install) | **integrated** (active plugin) |
| 3 | claude-flow / RuFlo v3.5 (ruvnet) | https://github.com/ruvnet/claude-flow | `01070ede81fa6fbae93d01c347bec1af5d6c17f0` | 1) `.agents/skills/` — 60+ agent skill templates (swarm topologies, consensus, benchmarks, hive-mind, GOAP planner); 2) `agents/*.yaml` — architect/coder/reviewer/tester role defs; 3) `v3/mcp/` — MCP server transport layer; 4) `v3/plugins/` — plugin system architecture; 5) `ruflo/` — WASM/Rust policy engine patterns | target: `~/.claude/skills/swarm-orchestration/`, `~/.claude/skills/hive-mind-advanced/`, selective agent role imports | 2026-04-15 | Claude (disk-verified SHA) | **cloned** (at `~/sources/claude-flow/`) |

## Pending audits

These memory claims need verification before they get an entry:

- `gstack` — memory says absorbed into ACOS. Action: grep for vendored code or remove claim.
- `ECC` (Extended Context Compression) — same.
- `GSD` (Get Stuff Done) — same.
- `claude-mem` — flagged for absorption but AGPL license. Action: license review before clone.
- `planning-with-files` — flagged target. Used in Arcanea/planning-with-files/. Verify if absorbed or referenced.
- `trailofbits` — flagged target. Action: clarify what specifically.

## How to add an entry

```
1. After cloning to ~/sources/<name>/:
   git -C ~/sources/<name> rev-parse HEAD  # get SHA
2. Identify 3-5 specific patterns/files (not "the whole repo")
3. Decide integration target paths (skill dir, package, hook, etc.)
4. Add row to table above with status: cloned
5. Update status as work progresses: cloned → extracted → integrated → verified
6. After verified: keep clone for ref, OR rm -rf and update path to "removed"
```

## Anti-pattern (do NOT do)

- "Absorbed patterns from claude-flow" with no clone, no SHA, no specific files.
- "Inspired by knowledge-work-plugins" with no integration target.
- Updating status to `integrated` without a commit/PR proving the integration.

If you can't fill all 9 columns, the absorption hasn't happened.
