# G2 report: a stranger installs `skills-with-evals` from a clean clone

Independent tester, fresh simulated machine. Nothing in the repository was changed: `git status` in the clone is clean
after every step, and nothing was written to GitHub. Every claude and codex command ran with a new empty HOME
(`HOME=$STRANGER CODEX_HOME=$STRANGER/.codex`, where `$STRANGER` came from `mktemp -d /agent/workspace/g2-home-XXXX`). The real
`~/.claude` and `~/.codex` were not touched: no file in them is newer than the start of this run.

## What was tested

| Item | Value |
|---|---|
| Repo / branch | `https://github.com/frankxai/claude-skills-library.git`, branch `agent/hyperagent/eval-pack-rc1` (HTTPS clone) |
| Commit tested | `12228498b880fc045b38c04782fec126633f7962` (2026-10-24T02:58:44+02:00, "chore(evals): move langgraph-patterns outcome-b to _legacy-2026-10-06"). This is the expected SHA. |
| Remote default branch | `main` at `8f323a8b59a9bf706edbf940d040b5a2a6798efc` (from `git ls-remote --symref ... HEAD`) |
| Claude Code | `2.1.310 (Claude Code)` |
| OpenAI Codex CLI | `codex-cli 0.164.0` |
| Node / git | `v24.22.1` / `2.49.0` |
| Run window (UTC) | 2026-10-24T01:00:12Z (clone) to 2026-10-24T01:04:26Z (last command) |
| Throwaway HOMEs | local install: `g2-home-uEVl`; remote Claude: `g2-home-4YBb`; remote Codex: `g2-home-m5Oc`; extra probe: `g2-home-BMCj` (Claude), `g2-home-lvm7` (Codex). All under `/agent/workspace/`. |
| Login | None. No model provider login was attempted or needed. |

## What a newcomer reads first

- `products/skills-with-evals/README.md` has **no end-user install commands**. Its "Commands" block lists only
  `node scripts/install-test.mjs` (a test harness), the trigger lint, the eval runner and the tests.
- The install commands are only in the `## Install` section of each `evals/<skill>/CARD.md`. All 10 cards have the same section
  (same md5):
  ```bash
  # Claude Code
  claude plugin marketplace add frankxai/claude-skills-library
  claude plugin install skills-with-evals@claude-skills-library
  # Codex
  codex plugin marketplace add frankxai/claude-skills-library
  codex plugin add skills-with-evals@claude-skills-library
  ```
  The cards give no branch or ref and no local-path option.

## Steps

Exit codes come from the wrapper (`run.sh`), which captured stdout+stderr verbatim to `transcripts/<step>.out`.

| # | Command (run with the fresh HOME) | Exit | Result |
|---|---|---|---|
| 1a | `git clone --branch agent/hyperagent/eval-pack-rc1 https://github.com/frankxai/claude-skills-library.git /agent/workspace/g2-clone` | 0 | Cloned |
| 1b | `git rev-parse HEAD` | 0 | `12228498b880fc045b38c04782fec126633f7962` |
| 2a | `claude plugin marketplace add /agent/workspace/g2-clone` | 0 | `✔ Successfully added marketplace: claude-skills-library (declared in user settings)` |
| 2b | `claude plugin install skills-with-evals@claude-skills-library` | 0 | `✔ Successfully installed plugin: skills-with-evals@claude-skills-library (scope: user)` |
| 2c | `claude plugin list` | 0 | `skills-with-evals@claude-skills-library`, Version `12228498b880`, Status `✔ enabled` |
| 3a | `claude plugin details skills-with-evals@claude-skills-library` | 0 | `Skills (10)`, all 10 pack skills; Always-on `~727 tok` |
| 3b | `claude plugin validate /agent/workspace/g2-clone` | **1** | `✘ Validation failed`: reserved name on `plugins[0]` (`claude-skills-library`), not on `skills-with-evals`. Full text below. |
| 4a | `codex plugin marketplace add /agent/workspace/g2-clone` | 0 | ``Added marketplace `claude-skills-library` `` |
| 4b | `codex plugin add skills-with-evals@claude-skills-library` | 0 | ``Added plugin `skills-with-evals` `` |
| 4c | `codex debug prompt-input "Review this pull request diff for bugs before I merge it"` | 0 | 68,035 bytes of JSON; 10 of 10 `skills-with-evals:<skill>` entries in `### Available skills` |
| 4f | `codex plugin list` | 0 | `skills-with-evals@claude-skills-library  installed, enabled  local` |
| 5 | `node scripts/install-test.mjs --repo /agent/workspace/g2-clone --json /agent/workspace/g2-receipts/install-test.json` | 0 | `PASS claude-code: 10 skill(s) visible, 0 missing`, `PASS codex: 10 skill(s) visible, 0 missing`, `install-test: PASS`. It also printed the Codex PATH-alias WARNING. |
| 6a | `node scripts/trigger-lint.mjs --pack products/skills-with-evals/pack.json` | 0 | The `--pack` flag works. `10 checked, 0 failed, 7 with warnings (Codex cutoff 100)` |
| 6b | `node --test scripts/tests/eval-pack.test.mjs scripts/tests/eval-skill.test.mjs` | 0 | `tests 12, pass 12, fail 0` |
| 7a | `claude plugin marketplace add frankxai/claude-skills-library` (new HOME) | 0 | Cloned `main` over HTTPS, `✔ Successfully added marketplace` |
| 7b | `claude plugin install skills-with-evals@claude-skills-library` | **1** | `✘ Failed to install plugin "skills-with-evals@claude-skills-library": Plugin "skills-with-evals" not found in marketplace "claude-skills-library"` |
| 7c | inspect cached marketplace | 0 | `8f323a8b…` on `main`; plugins on main: `['claude-skills-library', 'creator-os-core', 'starlight-academy', 'starlight-department-lab']` |
| 7g | `claude plugin validate <cached main marketplace>` | **1** | Same reserved-name error, so it also exists on `main` |
| 7d | `codex plugin marketplace add frankxai/claude-skills-library` (new HOME) | 0 | ``Added marketplace `claude-skills-library` from https://github.com/frankxai/claude-skills-library.git.`` |
| 7e | `codex plugin add skills-with-evals@claude-skills-library` | **1** | ``Error: plugin `skills-with-evals` was not found in marketplace `claude-skills-library` `` |
| 7f | `codex plugin list` | 0 | 4 plugins listed, no `skills-with-evals` |
| 8a–b | EXTRA (not a public instruction): `claude plugin marketplace add 'https://github.com/frankxai/claude-skills-library.git#agent/hyperagent/eval-pack-rc1'` then install + details | 0 | Installed; `Skills (10)`, all 10 |
| 8c–d | EXTRA: `codex plugin marketplace add frankxai/claude-skills-library --ref agent/hyperagent/eval-pack-rc1` then add + prompt-input count | 0 | Installed; 10 visible `skills-with-evals:` entries |

### `claude plugin validate /agent/workspace/g2-clone`: full output (exit 1)

```
Validating marketplace manifest: /agent/workspace/g2-clone/.claude-plugin/marketplace.json

✘ Found 1 error:

  ❯ plugins[0].name: Plugin name "claude-skills-library" is reserved: it passes as one of Anthropic's own. A third party's plugin name cannot start with "claude-", "anthropic-", "anthropics-", or "cc-plugin-", be "claude", "anthropic", "anthropics", "claude-code", or "claude-mods", or put "official" beside "claude" or "anthropic". Name it for what it does.

✘ Validation failed
```

## Skills seen per runtime (expected: 10)

| Skill | Claude Code (local clone) | Codex (local clone) | Claude Code (remote, as written) | Codex (remote, as written) |
|---|---|---|---|---|
| ui-ux-design-expert | yes | yes | no (install failed) | no (install failed) |
| github-code-review | yes | yes | no | no |
| nextjs-expert | yes | yes | no | no |
| mcp-architecture | yes | yes | no | no |
| ai-architect-review | yes | yes | no | no |
| langgraph-patterns | yes | yes | no | no |
| skill-builder | yes | yes | no | no |
| product-management-expert | yes | yes | no | no |
| book-publishing | yes | yes | no | no |
| excellence-book-writing | yes | yes | no | no |
| **Total** | **10 / 10, 0 missing, 0 extra** | **10 / 10, 0 missing, 0 extra** | **0 / 10** | **0 / 10** |

Claude Code source: `claude plugin details` "Skills (10)" line. Codex source: `- skills-with-evals:<skill>:` lines in the
`### Available skills` block of `codex debug prompt-input`. The repo's `install-test.mjs` reports the same: 10/10 in both runtimes.

## Problems and confusing points a newcomer would hit

1. **The public install command in the cards only works after merge.** `frankxai/claude-skills-library` resolves to
   the default branch `main` (8f323a8b), which has no `skills-with-evals` entry. The marketplace add succeeds in both runtimes,
   then the install fails:
   - Claude Code: `✘ Failed to install plugin "skills-with-evals@claude-skills-library": Plugin "skills-with-evals" not found in marketplace "claude-skills-library"`
   - Codex: ``Error: plugin `skills-with-evals` was not found in marketplace `claude-skills-library` ``

   The cards do not mention this. Pinning the same remote to the PR branch (step 8, not a public instruction) installs all
   10 skills in both runtimes. So the failure comes only from the content not being on `main` yet.
2. **`claude plugin validate` fails on the repo (exit 1)** because of the reserved name on a different entry, `plugins[0]`
   `claude-skills-library`. It does not block installing `skills-with-evals`, and the same error is already on `main`. A
   newcomer who runs validate as a sanity check still sees `✘ Validation failed`.
3. **The README has no install section.** The only commands it lists are maintainer and test commands. To find the user
   install commands you have to open a CARD.
4. **Trigger cue vs. the "~100 characters Codex shows".** trigger-lint exits 0 but warns on 7 of 10 skills (cue at char 103–165:
   ui-ux-design-expert 165, langgraph-patterns 135, nextjs-expert 131, skill-builder 131, product-management-expert 126,
   mcp-architecture 113, excellence-book-writing 103). It also warns that three bodies exceed 500 lines (ui-ux 713, nextjs 707,
   skill-builder 907). The cards report "Outside the ~100 characters" accurately. One observation: in this Codex 0.164.0 run,
   `debug prompt-input` showed every description **in full** (for example, all 279 characters for ui-ux-design-expert), with 14
   skills installed. I did not see the ~100-character truncation that the README and lint assume. It may only apply under
   other conditions, such as more skills or a context budget. I did not investigate.
5. **Codex PATH-alias warning.** `WARNING: proceeding, even though we could not create PATH aliases: Refusing to create helper binaries under temporary dir "/tmp" (codex_home: AbsolutePathBuf("/tmp/skills-install-home-hBT2kM/.codex"))`.
   This appeared only in `install-test.mjs`, which puts its HOME under `os.tmpdir()`. My manual Codex runs under
   `/agent/workspace/` did not print it. It is harmless, but the text also ends up inside `install-test.json` at `versions.codex`.
6. **The marketplace entry's homepage 404s until merge.** `homepage` is `https://github.com/frankxai/claude-skills-library/tree/main/evals`,
   which returns HTTP 404 today (`main` has no `evals/` or `products/`). The same path on the PR branch returns 200.
7. Minor: `install-test.mjs` checks Codex with `codex debug prompt-input hello`, not a review prompt. The skill list is the same
   either way. I ran the review prompt separately (step 4c) and got the same 10 skills.
8. Not tested, by design: the `eval-skill.mjs` measured-lift command needs a signed-in `claude`. Every card says "Not measured yet.
   No lift is claimed."

## Screenshots (rendered from the captured transcripts, text unaltered)

Rendered by `render.py` from `transcripts/*.out`. Lines are wrapped at 120 characters. Glyphs that Liberation Mono lacks
(✔ ✘ ❯ ℹ) are drawn with DejaVu Sans. The PATH/HOME exports are shown as their own prompt lines, and the HOME path in commands
appears as `$STRANGER`, with its value printed at the top of each screenshot.

- `01-clone.png`: clone, commit SHA, remote default branch
- `02-claude-install.png`: Claude marketplace add (local), install, plugin list
- `03-claude-details-validate.png`: plugin details (10 skills) and the full validate failure
- `04-codex-install-and-visible-skills.png`: Codex marketplace add, plugin add, model-visible skills. **Filtered**:
  `codex debug prompt-input "…" | sed 's/\\n/\n/g' | grep -E '^(### Available skills|- skills-with-evals:)'`. The full
  unfiltered output is in `transcripts/04c-codex-prompt-input.out`.
- `05-install-test.png`: `scripts/install-test.mjs`
- `06-tests-and-lint.png`: trigger-lint and `node --test`
- `07-remote-command.png`: the CARD's remote commands as written (both fail at install), what `main` contains, validate on `main`
- `08-extra-probe-branch-pinned-remote.png`: EXTRA, labelled as not a public instruction: the remote pinned to the PR branch works

Honesty note: `01b` was re-run once with a narrower command (dropped `git branch -a`, which printed about 50 remote branches).
Both runs printed the same SHA.

## Verdict

- **G2 local clean-clone install: PASS.** Claude Code and Codex each install `skills-with-evals@claude-skills-library` from the clean
  clone and expose exactly the 10 pack skills, with 0 missing and 0 extra. The repo's install test, trigger lint (warnings only)
  and 12/12 unit tests pass. `claude plugin validate` fails on a different plugin entry's reserved name, which is already on `main`.
- **G2 public remote install: FAIL** (the CARD command `… marketplace add frankxai/claude-skills-library` resolves to `main`, which has no
  `skills-with-evals` entry. Both runtimes report the plugin as not found. The command will only work after the branch is merged,
  and a branch-pinned remote does work today.)
