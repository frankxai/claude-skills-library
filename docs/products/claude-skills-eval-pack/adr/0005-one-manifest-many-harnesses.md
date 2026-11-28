# ADR-0005: One manifest and generated stubs for every agent harness

**Date**: 2026-11-07
**Status**: proposed (the artifacts exist; no live install or publication is authorized)
**Deciders**: OpenCode, on Frank's 2026-11-07 directive to cover any agent, not only Claude Code,
OpenCode and Claws. Frank still rules on new repositories and publication.

## Context

`frankxai/claude-skills-library` shipped six runtime adapter docs (Claude Code, OpenCode, Codex,
Gemini CLI, Cursor, Antigravity) and a `MULTI_RUNTIME.md` marked documentation v0.1 from
2026-05-27 with broken encoding. The estate runs more harnesses than that: Hermes, Grok, Kilo,
OpenClaw/Claws, Copilot, Factory Droid, the Starlight Claws runtime family and the `~/.agents`
projection all appear in local repos, home configs or estate skills. A per-harness hand-copied
pack breaks pack-relative references such as `../../references`; a new repo per harness duplicates
an estate that already holds 337 local repos and 300 frankxai GitHub repos.

## Decision

Keep one machine-readable manifest at `runtimes/harnesses.json`. Generate short adapter stubs and
the index from it with `scripts/gen-harness-adapters.mjs`. Emit install plans for any harness with
`scripts/install-any-agent.mjs --harness <id> --json`. The pack root `free-skills/<skill>/` stays
the only source of truth; stubs discover, they never contain a second skill body. The six existing
adapter docs are preserved, not regenerated. Discovery paths that were not measured are written as
`[OPEN]`. No repository is created.

### Alternatives considered

**A hand-written adapter doc per harness, copied from the pack**
- Pros: no generator to maintain, familiar Markdown.
- Cons: 14 copies drift, pack-relative references break when a single `SKILL.md` is copied out,
  and a wrong absolute path leaks into a distributed artifact.
- Why not: it is the exact failure mode `multi-agent-skill-surface-ops` names.

**One new config repo per harness**
- Pros: a clean home for each harness's config.
- Cons: five new repos for harnesses with no measured install surface; duplicates
  `claude-codex-gemini-opencode-settings` and `starlight-agent-config`; repository creation and
  first-time publication are Frank's gates; `WORKFLOW.md` says do not invent a repo from a keyword.
- Why not: extend the existing estate first. The five gaps are recorded in
  `HARNESS-COVERAGE.md` as routing checks, not as repos to create.

**MCP-only bridge, no discovery docs**
- Pros: one protocol, identical semantics across MCP-aware runtimes.
- Cons: several harnesses still need a local discovery path or a config entry; MCP does not tell
  Hermes which `external_dirs` item to add or where Grok reads `SKILL.md`.
- Why not: keep the MCP bridge as the long-term direction named in `MULTI_RUNTIME.md`, and ship
  the discovery layer it cannot replace.

## Consequences

### Positive
- 14 harness surfaces from one file; adding a fifteenth is one manifest row plus one generated
  stub.
- `--check` proves byte-idempotency and creates nothing; `--verify` fails closed on a missing
  adapter, a missing marker or an operator-specific path.
- The six pre-existing docs survive untouched; no `SKILL.md` is modified.
- An agent can read `--json` and install without a human translating prose.

### Negative
- Eight generated stubs are documentation, not working installs. Five harnesses still have
  `[OPEN]` discovery paths.
- A live install still needs a separate authorized action and a dated receipt under
  `queen/reports/`.
- The generated `runtimes/README.md` replaces a historical index; `MULTI_RUNTIME.md` is kept as
  evidence but is no longer the current index.

### Risks
- A stub could be mistaken for a working install. Mitigation: every stub opens with "Status:
  generated stub... not a live install" and ends with a "Not done here" section.
- Windows junctions are not symlinks. Mitigation: the manifest and every stub carry the reparse
  point guard; no live installer writes through a junction.
- Hermes `external_dirs` substring matching. Mitigation: the Hermes plan states exact YAML list
  item matching, never `if path in cfg`.
