# Receipt: plugin id `claude-skills-library` → `frankx-skills` · 2026-10-24

**Decision:** Frank (CEO lane, cycle 2): rename the full-library plugin to `frankx-skills`, to match the
`frankx-skills` launcher. The launcher itself is local to Frank's machine (per `product-plans` notes: v0.2,
not on GitHub or npm), so only the name could be matched, not its behaviour.

**What changed:** `plugins[0].name` in `.claude-plugin/marketplace.json`. The marketplace keeps the name
`claude-skills-library`, so every `marketplace add` command is unchanged. Install ids become
`frankx-skills@claude-skills-library` (full library) and `skills-with-evals@claude-skills-library` (the pack).
Updated: README (Claude Code + Codex + pack install, migration note), `runtimes/codex.md`, `docs/index.html`
via `scripts/generate_site.py`, `catalog/skills.json` via `scripts/build-catalog.mjs`.

## Validation (Claude Code 2.1.310)

| | Before | After |
|---|---|---|
| `claude plugin validate .` | `✘ plugins[0].name: Plugin name "claude-skills-library" is reserved … ✘ Validation failed` | `✔ Validation passed` |
| `node scripts/build-catalog.mjs --check` | stale (pack entry added without regenerating) | up to date |
| `python3 scripts/generate_site.py --check` | n/a | up to date |
| `node --test …eval-pack… …eval-skill…` | 12/12 | 13/13 (new test: no marketplace plugin uses a reserved name) |

## What happens to someone who already installed the old plugin

Tested in throwaway HOMEs: install the old name, then switch the marketplace source to the renamed version.

| Runtime | After the rename | Fix (verified) |
|---|---|---|
| Claude Code 2.1.310 | `claude plugin list` shows `claude-skills-library@claude-skills-library` with `Error: Plugin claude-skills-library not found in marketplace claude-skills-library`; `claude plugin update` fails with `Plugin "claude-skills-library" not found` | `claude plugin uninstall claude-skills-library@claude-skills-library`, then `claude plugin install frankx-skills@claude-skills-library` → 114 skills |
| codex-cli 0.164.0 | No error. The cached old plugin keeps serving all 114 skills under the old name, but it no longer appears in `codex plugin list` and will not receive updates | `codex plugin remove claude-skills-library@claude-skills-library`, then `codex plugin add frankx-skills@claude-skills-library` → 114 skills |

Not tested: a Git-sourced marketplace (`owner/repo`) after the rename merges to `main`; only local-path
marketplaces were used. The Claude Code error should be the same; Codex `marketplace upgrade` was not exercised.

**No alias is possible:** an entry that keeps the old name would fail validation, which is the reason for the
rename. Existing users have to run the two commands above. The README carries them.

## Side effects measured

- **Context cost in Claude Code** (`claude plugin details`): `frankx-skills` (114 skills) `Always-on: ~10,007 tok`
  per session; `skills-with-evals` (10 skills) `~727 tok`.
- **Codex trimming:** the plugin name is part of every line in Codex's skill list, so the shorter name frees
  budget. With all 114 skills installed, descriptions now show 110–114 characters (was 102–106 as
  `claude-skills-library`).
- **Catalog fixes made alongside:** totals count a skill listed by two plugins once (114, not 124), and
  `hasEvals` now sees suites under `evals/<skill>/`: 17 skills have a suite (the 10 pack skills plus 7 from
  #33/#46). `hasEvals` means a suite exists, not that lift was measured.
