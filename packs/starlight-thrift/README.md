# starlight-thrift

Spend fewer tokens without lowering the ceiling. Two skills, one small CLI, and a stack map that says which compressor does which job.

Thrift does not ship a compressor. RTK, headroom and caveman already do that work well and are Apache-2.0 projects with active maintainers. This pack decides how a task runs (`thrift`), proves the savings on your own repos (`thrift-ledger`), and tells you what is wired (`doctor`).

## What is in the pack

| Piece | Job |
|---|---|
| `skills/thrift` | Front door. Tightens the ask, picks model tier and execution shape, picks an output profile, keeps input clean, states the choice in one line. |
| `skills/thrift-ledger` | Same-task before and after protocol. Records only measured numbers, with the quality check beside them. |
| `scripts/thrift.mjs` | `doctor` shows which tools and hooks are wired. `bench` compares raw and RTK-filtered command output in bytes. |
| `install.mjs` | Copies the skills into a repo or `~/.claude/skills`. Dry run by default. Never edits `settings.json`. |

## The stack: one tool per stage

Token cost has four sources. Pick one tool for each and do not stack two on the same stream until the ledger shows stacking helps.

| Stage | What costs tokens | Tool | Status here |
|---|---|---|---|
| Shell output | `git`, `ls`, `grep`, test runners | RTK (Rust, single binary) | Installed 2026-10-12, hook not yet enabled |
| Tool results, logs, JSON, history | Everything else the agent reads | headroom (library, proxy, MCP) | Installed, CLI and MCP tool present, proxy not benchmarked |
| What the model writes | Preamble, recap, narration | Thrift Lean profile, or upstream caveman for Terse | Lean ships here, caveman optional |
| Always-loaded instructions | Global instructions, rules, memory index, every turn | `caveman-compress` on a backup copy, then measure | Not run |

Orchestration sits above the stack: `thrift` for the decision, then your existing `model-routing`, `skill-router` and Prompt Hub agents for the mechanics.

## Measured so far

RTK 0.50.0 on this repository, 2026-10-12, Windows 11 and Git Bash. One repo, one machine, bytes not tokens.

| Command | Raw | RTK | Saved |
|---|---|---|---|
| `git log -n 40` | 52,767 | 9,987 | 81% |
| `git diff HEAD~5` | 99,882 | 27,221 | 73% |
| `ls -la .` | 1,904 | 342 | 82% |
| `grep -rn TODO .` | 846 | 846 | 0% |
| `grep -rn 'name:' free-skills` | 28,229 | 15,179 | 46% |

Where output is long and repetitive the filter removes most of it. Where output is already small it does nothing. File reads and passing test runs came out unchanged.

headroom: not yet measured. Its Python library excluded a synthetic tool result in a first attempt (`router:excluded:tool`), so it needs a real run through the proxy before any number is quoted.

Caveman's own published figures (its README, not ours): 33.2% fewer input tokens through its proxy across 54 Claude Code runs with 18 of 18 answers correct, and 22.8% to 49.1% smaller memory files with `caveman-compress`. Treat these as claims until `thrift-ledger` reproduces them.

## Install

```
node packs/starlight-thrift/install.mjs --user            # dry run
node packs/starlight-thrift/install.mjs --user --apply    # copy skills to ~/.claude/skills
node packs/starlight-thrift/scripts/thrift.mjs doctor     # see what is wired
```

For one repo, pass its path instead of `--user`. Then, if you want the compressors:

```
winget install rtk-ai.rtk && rtk init -g       # shell-output hook, edits your Claude Code hooks
uv tool install --python 3.13 "headroom-ai[all]"
```

`rtk init -g` changes global hooks for every Claude Code session on the machine. Run it deliberately, then run `rtk gain` after a normal working day.

## Boundaries

- **Do not compress what is persisted.** Code, commits, docs, memory files and messages to other people stay in plain prose.
- **Do not compress the user's prompt.** Thrift tightens it. Compressing it made answers longer and worse in the work caveman cites.
- **No second proxy on the same stream.** Pick headroom's proxy or caveman's proxy, measure, then decide.
- **Other tools worth knowing, not bundled.** `context-mode` (sandboxes tool output, Elastic License 2.0, so use it as a dependency and do not vendor it). `ast-grep` and `difftastic` ship inside headroom as `headroom sg` and `headroom diff`.

## Attribution

RTK, headroom and caveman are separate Apache-2.0 projects by their authors. "Caveman" is a trademark of Julius Brussee. This pack refers to caveman nominatively and does not use the name for its own product. See `SOURCES.md`.
