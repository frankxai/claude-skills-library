# agent-hygiene

The quality bar for any agent that writes the files other agents run on: agent definitions, skills,
commands, hooks, `AGENTS.md`, `CLAUDE.md`. One installable skill that states the bar, one linter that
enforces the mechanical half of it on every PR, and one Stop hook that asks for a verification line
and checks the line is true.

It is the pack the strategy page called for under bet 2: the estate's Band A guardrails and the
Karpathy-distilled hygiene list as a single file, with the enforcement that turns a reminder into a
default.

## Why this pack exists

A 2026-10-17 lint of the checked-out estate (`agent-lint.py --all`, seven repos, 741 agent files):

| Repo | Files | Errors | Warnings | What the errors are |
|---|---:|---:|---:|---|
| `FrankX` | 234 | 50 | 616 | 29 generated-prestige phrases, 7 no frontmatter, 7 no description, 4 over 800 lines, 2 dated model ids |
| `arcanea` | 157 | 67 | 570 | 37 files with no frontmatter (undiscoverable by the harness), 24 prestige phrases, 4 over 800 lines |
| `agentic-creator-os` | 155 | 28 | 492 | 24 prestige phrases, 4 over 800 lines |
| `Starlight-Intelligence-System` | 151 | 146 | 258 | 144 identity cards with no `description` (the routing text) |
| `gencreator.ai` | 18 | 1 | 20 | one "in conclusion" |
| `arcanea-ai-app` | 15 | 5 | 47 | 2 no name, 1 no frontmatter, 1 no description, 1 prestige phrase |
| `ai-architect` | 11 | 0 | 1 | the cleanest roster in the estate |

The warnings are dominated by three things: descriptions with no trigger cue (so the agent never
fires on its own), no boundary section (so nothing says what the agent must not do), and names that
differ from their file. None of this is caught today by anything that runs. The 2026-09-19 absorption
audit found the same disease from the other side: 40 percent of SIS agent cards in near-identical
clusters, carrying no knowledge of the systems they name.

The pack does not fix the debt. It stops it growing: the linter runs as a ratchet on changed files, so
a PR that touches an agent file has to leave that file clean, and a PR that does not touch one is
never blocked.

## What it installs

| Piece | Where it lands | Does |
|---|---|---|
| `agent-hygiene` skill | `.claude/skills/agent-hygiene/` | The bar, the agent-file contract, the skill-file contract, the verification line, model and effort routing. Canonical copy: [`free-skills/agent-hygiene`](../../free-skills/agent-hygiene). |
| `agent-lint.py` | `.claude/ci/agent-lint.py` | 7 error checks and 10 warning checks over agent and skill files. Zero dependencies. `--changed` for the ratchet, `--all` for the inventory, `--strict`, `--json`. |
| `agent-hygiene.yml` | `.github/workflows/` (written only when absent) | Runs the linter on the files a PR changed. |
| `agent-hygiene-stop.py` | `.claude/hooks/` + a `Stop` entry in `.claude/settings.json` | When a turn changed files, requires the hand-back to end with `Verified: <command> → <result>` or `Unverified: <why>`, and checks the named command actually ran. Blocks at most once per change set. |

## Install

```bash
# from a clone of this repo
packs/agent-hygiene/install.sh /path/to/your/repo

# from anywhere
git clone --depth 1 https://github.com/frankxai/claude-skills-library /tmp/csl \
  && /tmp/csl/packs/agent-hygiene/install.sh "$PWD"
```

Idempotent; re-run to upgrade. `--dry-run` shows the diff, `--skills-only` skips the hook and CI,
`--no-ci` skips the linter and workflow. A local skill copy that differs from canon is set aside to
`.claude/skills/.replaced/agent-hygiene/` and named, never deleted. The settings merge is by script
name: other hooks (`estate-guard`, `web-excellence`) are untouched and a re-run upgrades the entry
in place rather than adding a second one.

Then one line in the repo's `CLAUDE.md`, so the contract is in the prompt and not only in the hook:

> Agent, skill and command files meet the `agent-hygiene` bar: lint with
> `python3 .claude/ci/agent-lint.py --changed` before a PR and end every hand-back with a
> `Verified:` line. See `.claude/skills/agent-hygiene/SKILL.md`.

## The verification line

```
Verified: python3 .claude/ci/agent-lint.py --changed --base origin/main → 3 files, 0 errors, 1 warning
```

The hook reads the session transcript and accepts the line only if the command it names appears as
the input of a Bash call that ran, in the main session or a subagent. Prose that looks like a receipt
is blocked, once, with the cited command quoted back. `Unverified: <reason>` is always accepted:
honesty about what was not run is part of the bar, not a violation of it.

Opt out of the hook for a session with `AGENT_HYGIENE_NO_STOP=1`.

## The linter, in one table

| Errors (fail) | Warnings (fail with `--strict`) |
|---|---|
| E1 frontmatter missing or malformed | W1 name not hyphen-case, or not equal to the file or folder name |
| E2 no `name` | W2 description under 50 characters or without a trigger cue |
| E3 no `description` | W3 no `model`, or not a tier word or model id (Claude Code subagents only) |
| E4 generated-prestige phrase in an agent file | W4 `Task`/`Agent` declared, body never dispatches |
| E5 dated or retired model id | W5 no boundary section and fewer than three negation lines |
| E6 agent body over 800 lines | W6 no procedure section |
| E7 skill name or description outside the Agent Skills spec | W7 no done cue (test, smoke, eval, receipt, exit 0, evidence) |
| | W8 Arcanea canon proper nouns outside an Arcanea repo |
| | W9 agent body over 400 lines; skill body over 500 |
| | W10 CRLF line endings |

Registries, readmes and contracts that live inside agent directories (`CLAUDE.md`, `AGENTS.md`,
`README.md`, `*_REGISTRY.md`, `AGENT_STANDARDIZATION.md`, `PRODUCT_TEAMS.md`) are skipped by name.
Harness-agnostic identity cards (SIS `agents/*.md`, no `tools`) are not nagged about `model`.
The full contract with the four admissible file shapes:
[`references/agent-file-contract.md`](../../free-skills/agent-hygiene/references/agent-file-contract.md).

## Tests

```bash
python3 packs/agent-hygiene/tests/test_hooks.py        # 15 checks
python3 packs/agent-hygiene/tests/test_agent_lint.py   # 36 checks
python3 packs/agent-hygiene/tests/test_install.py      # 32 checks
```

83 checks, no dependencies, run by `.github/workflows/pack-tests.yml`. The load-bearing ones:
`test_cited_command_must_have_run` (a receipt-shaped sentence is not a receipt),
`test_skill_text_cannot_satisfy` (a command seen in a tool result does not count as run),
`test_changed_mode_is_a_ratchet` (old debt never blocks a PR that did not touch it),
`test_registry_files_are_skipped`, and `test_settings_merge_preserves_other_hooks`.

## Keeping it honest

The skill's canonical copy is `free-skills/agent-hygiene`; the pack is a manifest plus installer over
it, like `agent-infrastructure`. Fixes land there, consumers re-run `install.sh`. Never edit a
consumer repo's installed copy: that is how the drift this library exists to end started. The tests
are not vendored into target repos; the workflow there smoke-tests that the vendored files still parse.

## Flagged for Frank (decisions this pack did not make)

1. **The 144 SIS identity cards without a `description`.** The linter treats a missing description
   as an error because it is the routing text. Under the ratchet nothing fails until a card is
   touched. A one-pass backfill (one sentence each, from the card's Identity section) is Sonnet work
   and would clear the largest error count in the estate.
2. **37 Arcanea agent files with no frontmatter** (`guardians/*.md`, `oss/*`, `departments/design/*`).
   The harness cannot discover them. Adding frontmatter is mechanical; whether they should be agents
   at all is the roster owner's call.
3. **Whether W5 (no boundary section) should become an error** once the current debt is paid. The
   contract says every agent states what it does not do; the linter warns today so the ratchet does
   not stall on the 109 to 133 files per repo that lack it.
