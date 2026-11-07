# Spec: harness-surface

Module id `harness-surface` · added to [CAPABILITY-MAP.md](CAPABILITY-MAP.md) on 2026-11-07 ·
status: built as plan surfaces only, no live install.

## Objective

One skill pack must be discoverable by any agent harness in the estate, not just Claude Code and
OpenCode. The job: an agent running Hermes, Grok, Kilo, OpenClaw, Copilot, Factory Droid, a
Starlight Claw, or the `~/.agents` projection can find the pack root and load a skill without a
human hand-editing a config file per harness. The finished artifact is a machine-readable manifest,
a deterministic generator, an any-agent CLI, and one stub adapter per harness.

## Tech stack

Node 20+, JSON manifest, Markdown stub docs. No new dependency, no new repository, no global
config write. Pack format stays `SKILL.md` under `free-skills/<skill>/`.

## Commands

```text
node scripts/gen-harness-adapters.mjs --check
node scripts/gen-harness-adapters.mjs --write
node scripts/install-any-agent.mjs --list
node scripts/install-any-agent.mjs --harness hermes --json
node scripts/install-any-agent.mjs --all --json
node scripts/install-any-agent.mjs --all --verify
```

`--check` and every CLI mode are dry runs. No mode writes a skill, a junction, a stub into a home
directory, global configuration, or a receipt. Exit codes are stable and order-independent (the
highest active code wins, and every fault is listed):

| Code | `install-any-agent.mjs` | `gen-harness-adapters.mjs` |
|---|---|---|
| 0 | pass | pass / byte-identical |
| 1 | not used | drift under `--check` |
| 2 | unknown harness | bad arguments |
| 3 | missing adapter or marker | refusing to overwrite a non-generated doc |
| 4 | operator-specific path in a plan, stub or doc | operator-specific path in generated output |
| 5 | invalid manifest | invalid manifest |
| 6 | pack root missing | not used |
| 7 | bad arguments | not used |

## Project structure

```text
runtimes/harnesses.json          # the single source of truth (hand-authored, reviewed)
runtimes/README.md               # generated index
runtimes/<id>.md                 # 6 pre-existing docs (preserved) + 8 generated stubs
scripts/gen-harness-adapters.mjs # deterministic generator, --check / --write
scripts/install-any-agent.mjs    # plan CLI, --json / --verify / --list
docs/products/claude-skills-eval-pack/HARNESS-COVERAGE.md  # measured inventory
```

## Code style

One record per harness, no absolute machine paths, pack-relative references only:

```json
{
  "id": "hermes",
  "discovery": "AppData/Local/hermes config.yaml skills.external_dirs; ~/.hermes/skills",
  "install": "Add the pack root as an exact YAML list item under skills.external_dirs",
  "configRepo": "frankxai/hermes",
  "status": "adapter-generated"
}
```

`[OPEN]` is used where no install surface was measured. A guess is never written as a path.

## Testing strategy

- Deterministic: `gen-harness-adapters.mjs --check` twice after `--write`; both must report
  byte-identical output and 0 writes.
- Structural: `install-any-agent.mjs --all --verify` checks the manifest, the pack root, that all
  14 adapter docs exist, that generated stubs carry the marker, and that no distributed artifact
  contains an operator-specific path.
- Planted fault: remove a generated marker, run `--verify`, assert exit 3; add a machine-specific
  absolute path to a stub, assert exit 4; ask for an unknown harness, assert exit 2.
- Integrity: confirm the six pre-existing adapter docs are byte-unchanged after generation, and
  that no `SKILL.md` under `free-skills/` was modified.
- Idempotency: a second `--write` writes 0 files.

## Boundaries

- Always: stubs only, pack root as source of truth, detect Windows reparse points before any stub
  write, exact-match YAML list items for `external_dirs`, dry run by default.
- Ask first: any live install into `~/.agents`, `~/.claude`, `~/.grok` or Hermes config; any new
  repository; any change to the six pre-existing adapter docs.
- Never: overwrite a full skill body, copy a single `SKILL.md` out of a pack, bulk-copy a
  product mega-tree into a harness, write through a junction, put an operator-specific path in a
  distributed artifact, or claim an install happened without a dated receipt.

## Success criteria

14 harness entries in the manifest; 14 adapter docs on disk; `--all --verify` exits 0;
`--check` exits 0 twice; `--write` writes 0 files on a rerun; the six existing docs unchanged;
`HARNESS-COVERAGE.md` names the canonical repo or the measured gap for each harness. A live install
is a separate authorized action with its own receipt.

## Open questions

`[OPEN]` discovery paths for Kilo, OpenClaw/Claws, Copilot, Factory Droid and Starlight Claws.
`[OPEN]` whether a dedicated config repo is needed for those five. No repository is created until
Frank rules; the estate already has 337 local repos and 300 frankxai GitHub repos, and the
bootstrap rule is to extend existing repos.
