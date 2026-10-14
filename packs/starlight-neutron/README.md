# Starlight Neutron

The token-compaction toolkit for AI agents. *A sun's worth of intelligence, a city's width of context.*

A neutron star holds a sun's mass in a city's width. Neutron aims at the same trade for an agent session: keep the intelligence, shed the bulk, and prove it with your own numbers. It ships a router skill, a measurement protocol, a doctor/bench CLI, and a fail-open hook that routes shell commands through RTK.

Neutron does not ship a compressor. RTK, headroom and caveman already do that work and are Apache-2.0 projects. This pack decides how a task runs (`neutron`), proves savings on your own repos (`neutron-log`), reports what is wired (`doctor`), and wires the one layer that has measured evidence so far (RTK).

## What is in the pack

| Piece | Job |
|---|---|
| `.claude-plugin/plugin.json`, `hooks/` | Plugin manifest and a `PreToolUse` hook on `Bash`. The hook passes each command to `rtk hook claude`, which rewrites `git log` to `rtk git log` and similar. If RTK is missing or errors, the command runs untouched. |
| `skills/neutron` | Tightens a multi-part ask, picks model tier, effort, execution shape and output profile, keeps input clean, states the choice in one line. |
| `skills/neutron-log` | Same-task before and after protocol. Records only measured numbers, with the quality check beside them. |
| `scripts/neutron.mjs` | `doctor` shows what is wired. `bench` compares raw and RTK-filtered output in bytes and skips a row when the filter fails. |
| `install.mjs` | For non-plugin use: copies skills and scripts to a repo or `~/.claude`, moving any existing copy to a backup folder. Dry run by default. Never edits `settings.json`. |
| `results/` | Raw bench output, the source for every number below. |

## Measured

RTK 0.50.0, this repository, 2026-10-12, Windows 11 with Git Bash. Bytes, not tokens. One repo, one machine. Source: `results/2026-10-12-rtk-bench.json`.

| Command | Raw bytes | RTK bytes | Saved |
|---|---|---|---|
| `git log -n 40` | 53,307 | 10,374 | 81% |
| `git diff HEAD~5` | 131,357 | 27,621 | 79% |
| `git status` | 672 | 293 | 56% |
| `grep -rn name: free-skills` | 28,229 | 15,179 | 46% |

The `git diff` row drifts by a few hundred bytes as commits land, so the percentage is the result and the byte counts are a snapshot. Output that is already small or already compact is not reduced.

This proves RTK shrinks command output. It does not prove an agent finishes a task cheaper end to end. No same-task session has been run yet, so there is no billed-token result in this pack.

## What is not proven

- **headroom.** Installed here at 0.20.15 (latest upstream is v0.40.0, untested). A first library call excluded a synthetic tool result and saved nothing, so it has no number in this pack. Caveman's own benchmark, run by a competitor, reports "Headroom on the same suite got 15 of 18 right and used 6.7% fewer tokens on those 15", against 18 of 18 and 33.2% fewer input tokens for caveman's own proxy. That is a vendor comparison on one suite. It is still a reason to test headroom for answer quality before trusting it with tool results, and the reason RTK, a deterministic filter, is the only compressor the hook enables.
- **caveman.** Its published figures (33.2% fewer input tokens across 54 Claude Code runs; memory files 22.8% to 49.1% smaller with `caveman-compress`) are its README's claims. Not reproduced here.
- **End-to-end savings.** Needs the session protocol in `neutron-log` with billed tokens and an acceptance check.
- **Always-loaded instructions.** On the author's machine, global instructions, rules, the memory index and the home `AGENTS.md` total 61.9 KB (about 15.5k tokens at bytes/4; measured with a byte count on 2026-10-12, one machine, not part of the committed results) before skill and agent listings. That is likely the largest single cost and no tool here has touched it yet.

## Ledger

`neutron.mjs ledger` turns billed usage into a savings figure only when quality was checked. Rows are JSONL: `date, harness, model, taskId, arm, uncachedInput, cacheWrite, cacheRead, output, check, notes`. `arm` is `baseline` or a candidate name. `check` is `pass`, `fail` or `not-checked`.

```
node scripts/neutron.mjs ledger add --file l.jsonl --date 2026-10-01 --harness claude-code --task t1 --arm baseline --uncached 100 --cache-write 0 --cache-read 1000 --output 200 --check pass
node scripts/neutron.mjs ledger import-ccusage sessions.json --arm baseline --harness claude-code --out l.jsonl
node scripts/neutron.mjs ledger compare --baseline base.jsonl --candidate cand.jsonl [--prices prices.json] [--json]
```

Rules, enforced in `scripts/ledger.mjs` and covered by `tests/ledger.test.mjs`:

- Rows pair by `taskId`. A pair counts only if both rows are `pass`. Failed, unchecked and unpaired tasks are listed and left out of every total.
- With fewer than 5 counted pairs, `compare` prints `n=N, too few to call this a result` and no percentage.
- Prices come only from `--prices` (per million tokens, keys `uncachedInput`, `cacheWrite`, `cacheRead`, `output`). None are built in.
- `import-ccusage` reads the `data` array of `ccusage session --json` (older releases: `sessions`). The shape was taken from the ccusage docs and is tested against a hand-written fixture, not output from a real run. Missing fields become `null` and the row's `notes` says which. ccusage has no task or quality information, so imported rows are `not-checked` and `taskId` is the session id until you set them.

Worked example, **fixture data, not a result** (`tests/fixtures/example-*.jsonl`; the prices file holds placeholder values, not current prices). Six tasks per arm, the sixth failed in both arms:

```
pairs counted (both rows pass): n=5
metric            n      baseline     candidate          diff  saved
uncachedInput     5           520           420          -100  19%
cacheWrite        5             0             0             0  -
cacheRead         5          4950          3950         -1000  20%
output            5          1010           930           -80  8%
weighted          5        0.0182        0.0164       -0.0018  10%
excluded t5: baseline fail, candidate fail
```

No real session has been through the ledger yet, so this pack still has no measured end-to-end saving.

## Policy vectors

`policy-vectors/` holds a language-neutral spec of the permission guard: `schema.json` (JSON Schema 2020-12) and 189 golden cases in `cases/`, written with rules as Claude Code writes them. `tests/vectors.test.mjs` checks every case against `commandHitsRule` through the same settings reader the hook uses. A case marked `overmatch` is one where the guard is stricter than Claude Code; a case marked `knownGap` is one the guard currently gets wrong, with the reason in `gapReason`. No case is flagged `knownGap` now; the PowerShell alias and bare-tool-rule gaps were fixed in 4601a1e. Run `node --test packs/starlight-neutron/tests/vectors.test.mjs`.

## Install

As a plugin, from a local checkout (not yet in the marketplace):

```
claude --plugin-dir path/to/claude-skills-library/packs/starlight-neutron
```

Without the plugin system:

```
node packs/starlight-neutron/install.mjs --user            # dry run
node packs/starlight-neutron/install.mjs --user --apply    # skills to ~/.claude/skills, scripts to ~/.claude/neutron
node ~/.claude/neutron/scripts/neutron.mjs doctor           # see what is wired
```

This path installs skills only, with no hook. Wire RTK's own with `rtk init -g`, which edits global hooks for every session on the machine, so run it deliberately.

Compressors (install the ones you want):

```
rtk       winget install rtk-ai.rtk | brew install rtk | cargo install --git https://github.com/rtk-ai/rtk
headroom  uv tool install --python 3.13 "headroom-ai[all]"
ccusage   npm install -g ccusage
```

## Boundaries

- **Do not compress what is persisted.** Code, commits, docs, memory files and messages to other people stay in plain prose.
- **Do not compress the user's prompt.** Neutron tightens it. Caveman's own write-up cites work finding that compressing the prompt makes answers longer and worse.
- **Permission rules still apply to what you wrote.** Claude Code checks permission rules against the command a hook returns, so a rewrite of `git commit` to `rtk git commit` would skip an `ask` rule written for `git commit`. The hook therefore leaves a command untouched when any `ask` or `deny` rule it can read could apply to it. The hook does not copy Claude Code's matcher; it tests two necessary conditions. A plain rule applies when every word of it appears in the command, so quoting, `bash -c`, env prefixes, subshells and options between the words do not hide a match. A glob rule such as `Bash(cat .env*)` applies when every literal piece between its `*` wildcards appears in the command text, so `cat .env.local` is caught. Case, spacing and quote characters are ignored. The cost is an occasional skipped rewrite. It reads managed settings files, user settings (including `CLAUDE_CONFIG_DIR`), and the settings of the working directory, of `CLAUDE_PROJECT_DIR`, and of every parent folder of both. If a settings file exists but cannot be read or parsed, nothing is rewritten. The hook rewrites only when the hook input carries a working directory, and it rebuilds the tool input from the original with just the `command` replaced, so RTK cannot add fields. Limit: rules that live only in server-managed settings, MDM policy, the Windows registry (`HKLM` or `HKCU\SOFTWARE\Policies\ClaudeCode`) or a `--settings` flag cannot be read from a hook; `doctor` reports when the registry policy exists. RTK itself also passes denied commands through.

  The hook rewrites; it never approves. When RTK reads one of your `allow` rules as a match it adds an auto-allow decision, and the hook strips it, so Claude Code decides on the rewritten command using its own parser. The cost is a prompt for `rtk git log` where you had allowed `git log`. Allow the read-only rewritten forms yourself, for example `Bash(rtk git log:*)`, `Bash(rtk git status:*)` and `Bash(rtk git diff:*)`. Avoid a blanket `Bash(rtk:*)`: it would auto-approve every rewritten command, including ones RTK wraps for write operations.
- **One input-side compressor per stream.** Do not run two proxies in a chain until a measured result shows it helps.
- **Not bundled.** `context-mode` (sandboxes tool output; Elastic License 2.0, so depend on it, do not vendor it). `ast-grep`, `difftastic` and `scc` ship inside headroom as `headroom sg`, `headroom diff`, `headroom loc`.

## Attribution

RTK, headroom and caveman are separate Apache-2.0 projects by their authors. "Caveman" is a trademark of Julius Brussee. This pack refers to caveman nominatively and does not use the name for its own product. See `SOURCES.md`.
