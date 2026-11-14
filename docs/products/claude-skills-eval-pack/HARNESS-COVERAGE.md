# Harness coverage and repo inventory

2026-11-07 · OpenCode · measured by command. This is the answer to "build out the repos we need
for any agent, not just Claude Code, OpenCode and Claws".

## The measured starting point

| Fact | Value | Command |
|---|---|---|
| Local repo directories | 337 | `Get-ChildItem <starlight-root>/repos -Directory` |
| frankxai GitHub repos listed | 300 | `gh repo list frankxai --limit 300 --json name` |
| Runtime adapter docs shipped | 6 | `Get-ChildItem runtimes -File` (before this slice) |
| Adapter docs after this slice | 14 | `node scripts/install-any-agent.mjs --all --verify` |
| Sourced discovery paths | 12 of 14 | `--verify` reports 2 unmeasured `[OPEN]` paths |
| Path states | 7 verified, 5 documented, 2 open | `node scripts/install-any-agent.mjs --all --verify` |
| Generated stubs | 8 | `node scripts/gen-harness-adapters.mjs --check` |
| Pre-existing docs preserved | 6 | generator refuses to overwrite them |

The estate does not lack repos. It lacked adapter surfaces. Creating a new repository for each
harness would duplicate 337 existing ones, so this slice extends `frankxai/claude-skills-library`
and names the canonical repo (or the measured gap) for every harness. No GitHub repo was created.

## Coverage table

| Harness | Kind | Surface | Discovery | Path state | Canonical repo | Gap |
|---|---|---|---|---|---|---|
| Claude Code | harness | existing doc | `~/.claude/skills/<skill>/SKILL.md` | verified | `frankxai/claude-code-config` | none |
| OpenCode | harness | existing doc | `<project>/.opencode/skills/` | verified | `frankxai/opencode` | none |
| Codex CLI | harness | existing doc | `~/.codex/AGENTS.md` or MCP wrap | verified | `frankxai/claude-codex-gemini-opencode-settings` | none |
| Gemini CLI | harness | existing doc | `~/.gemini/GEMINI.md` | documented | none measured | no config repo |
| Cursor | harness | existing doc | `.cursor/rules/<skill>.mdc` | documented | none measured | no config repo |
| Antigravity | harness | existing doc | `.antigravity/instructions.md` | documented | `frankxai/AntigravityCompanion` | none |
| Hermes | harness | generated stub | `skills.external_dirs` exact YAML item | documented | `frankxai/hermes` | none |
| Grok CLI | harness | generated stub | `~/.grok/skills/<skill>/SKILL.md` | verified | `frankxai/grok-operator` | none |
| Kilo | harness | generated stub | `~/.kilo/AGENTS.md` (home guide) | documented | none | no config repo, `~/.kilo` absent |
| OpenClaw / Claws | harness | generated stub | `[OPEN]` | open | product/template repos only | no config repo |
| GitHub Copilot CLI | harness | generated stub | `~/.copilot/skills/<skill>/SKILL.md` | verified | none | no config repo |
| Factory Droid | harness | generated stub | `~/.factory/skills/<skill>/SKILL.md` | verified | none | no config repo |
| Starlight Claws | runtime-family | generated stub | `[OPEN]` | open | `frankxai/starlight-agent-config` | no install surface measured |
| `~/.agents` | projection | generated stub | `skills-index.json` stubs | verified | `frankxai/starlight-agent-config` | none |

Full machine-readable form: [`runtimes/harnesses.json`](../../../runtimes/harnesses.json) with an
`evidence` field, a `pathState` and a `probe` for the five previously open rows.

**Path state definitions.** `verified` means a concrete discovery path was measured on disk on
2026-11-07. `documented` means the path comes from a named source (adapter doc, skill or home
guide) but the directory was not verified on this machine. `open` means no path could be sourced
or measured. A documented path is not a working install.

## Path probes (T12, read-only, 2026-11-07)

| Harness | Probe | Result |
|---|---|---|
| Kilo | `~/.kilo`, `~/.kilo/AGENTS.md`, `~/.config/kilo`; `Get-Command kilo`; home `AGENTS.md` Kilo clause | `kilo.ps1` launcher present; `~/.kilo` absent; path documented in the guide |
| OpenClaw / Claws | `~/.openclaw`, `~/.config/openclaw`; `Get-Command openclaw`, `claw`; `ops/skill-authority.json` skip list | all absent; skip-list entries `.openclaw` and `openclaw` found; no path resolved |
| GitHub Copilot CLI | `Get-ChildItem ~/.copilot` | `skills/`, `agents/`, `settings.json`, `mcp-config.json` present; path resolved |
| Factory Droid | `Get-ChildItem ~/.factory`, `~/.factory/skills`, `~/.factory/mcp.json` | `skills/` populated with skill folders; path resolved |
| Starlight Claws | `starlight/AGENTS.md`, `TRUTH.md`, `ops/agent-factory/REGISTRY.json`, `starlight-agent-config/core/claws` | no Claw refs, no Claw agent id, directory absent; no path resolved |

Three of the five `[OPEN]` rows resolved. Two remain open with the failed probes recorded in the
manifest. T12 is closed; T14 still tracks the config-repo routing gaps.

## Repos we need (measured, not invented)

Existing repos to extend, already on disk or GitHub:

- Claude Code: `claude-code-config`, `claude-code-hooks`, `claude-code-mcp`, `claude-infrastructure`
- OpenCode: `opencode`, `opencode-free-model-smoke`, `arcanea-opencode`
- Codex / Gemini / Cursor / Copilot settings: `claude-codex-gemini-opencode-settings`
- Antigravity: `AntigravityCompanion`
- Hermes: `hermes`, `hermes-cockpit`, `awesome-hermes-agent-skills`
- Grok: `grok-operator`, `grok-powertools`
- OpenClaw: `arcanea-openclaw`, `openclaw-acos-skills-railway-template`
- Universal projection: `starlight-agent-config`, `skills`, `creator-skills`, `~/.agents`
- Claws runtime family: `starlight-agent-config`

Five harnesses still have **no measured config repo**: Kilo, OpenClaw/Claws, GitHub Copilot CLI,
Factory Droid and Starlight Claws. Three of them now have a discovery path even so. That is a gap,
not a decision to create five repos. Per `WORKFLOW.md` and the workspace bootstrap rule, agents do
not invent a repository from a keyword. The next action for each is a named routing check and a
Frank gate, listed as T14 in [tasks/todo.md](tasks/todo.md).

## What was actually built

- `runtimes/harnesses.json`: one manifest, 14 entries, policy flags, evidence and path states per
  row, plus probe records for the five previously open harnesses.
- `runtimes/README.md`: regenerated clean index (the previous copy carried broken encoding).
- Eight stub adapters. Each points at the pack root, states the safety rules, and says plainly
  what is not done.
- `scripts/gen-harness-adapters.mjs`: deterministic generator with `--check` and `--write`.
- `scripts/install-any-agent.mjs`: `--list`, `--harness <id> --json`, `--all --json`, `--verify`
  with stable exit codes and a verified / documented / open breakdown.
- `scripts/tests/harness-surface.test.mjs`: nine regression tests, written RED first for the
  path-state behavior, then GREEN.
- `SPEC-harness-surface.md`, ADR-0005, the capability map and the goal scoreboard entries G11
  and G12.

## What was deliberately not done

No live install, no junction, no stub written into a home directory, no Hermes
`external_dirs` edit, no global config change, and no install receipt claiming one happened.
`multi-agent-skill-surface-ops` requires a receipt under `queen/reports/` for every live install;
there was no live install, so there is no receipt. New repositories, publication and repo
visibility remain Frank's gates.

## Done condition

`node scripts/install-any-agent.mjs --all --verify` exits 0 and reports 14 adapter docs with 12
sourced paths (7 verified, 5 documented, 2 open), `node scripts/gen-harness-adapters.mjs --check`
exits 0 twice, a second `--write` writes 0 files, the six pre-existing adapter docs are
byte-unchanged, and `node --test scripts/tests/harness-surface.test.mjs` passes 9/9. All held on
2026-11-07. The two `[OPEN]` surfaces are tracked as T12 follow-up.
