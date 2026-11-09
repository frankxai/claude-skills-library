# Recorded clean install: skills-with-evals on Claude Code and Codex (fresh HOME)

An independent tester who had never seen the project followed only the public README of
`frankxai/claude-skills-library` (branch `agent/hyperagent/eval-pack-rc1`, section **Install**, block
"The tested pack (release candidate)"). The terminal was recorded as it happened with a real pty
recorder. Nothing was faked, hard-coded or edited after the fact. The tester made no writes to GitHub,
did not log in to any model provider and did not touch the real `~/.claude` or `~/.codex` (no file in
either changed during the session).

**Recorded clean install: PASS**

## Tools and versions

| Tool | Version |
|---|---|
| Claude Code | 2.1.310 (`~/.local/bin/claude`) |
| codex-cli | 0.164.0 (`~/.local/bin/codex`) |
| asciinema | 3.2.1 (headless, 110x32, idle-time-limit 2) |
| agg | 1.9.0 (`--font-size 15 --speed 1.5 --idle-time-limit 2`) |
| ffmpeg | 7.0.2-static |
| git / node | 2.49.0 / v24.22.1 |

## What was installed

- **Commit:** `2602f49b604b6fee099d8e47a53a412f7460bea8` (`git ls-remote` inside the recording; the fresh clone's
  HEAD was the same commit, dated 2026-10-24T04:08:16+02:00, message "feat(evals): eval-card --json, the card facts as data for the buyer page").
  After the recording, a check showed that Claude Code's marketplace clone, Codex's marketplace clone and Claude's
  `installed_plugins.json` (`gitCommitSha`) all point to this same commit.
- **README:** the copy read before recording (`README.snapshot.md`) is byte-identical to the README at the recorded
  commit. Both have sha256 `88d21f65…c956d2`.
- **Fresh HOME:** `/agent/workspace/g2-rec/home-1dDO`. At the start, `ls -A $HOME` showed only `.codex`.
  `HOME` and `CODEX_HOME` were exported inside `walkthrough.sh`.

## Timing and takes

- Recording start (UTC): 2026-10-24 02:10:50 (from the first `date -u` and the cast header timestamp 1792807850)
- Recording end (UTC): 2026-10-24 02:10:54 (from the last `date -u`)
- About 4.5 s of real time. The commands are fast, so the rendered video is short (MP4 6.03 s).
- **Takes: 2. Only take 2 was kept.** Take 1 stalled because of a step I added myself, not because of the
  README. I had put in `git log -1`, which opened a pager in the headless pty and waited at
  "WARNING: terminal is not fully functional / Press RETURN to continue". All README steps before it had
  already passed in take 1. I changed that line to `git --no-pager log -1`, deleted take 1's cast and HOME,
  and re-recorded from scratch with a new HOME.

## Steps (take 2)

| # | Command (as shown in the recording) | Exit | Result |
|---|---|---|---|
| a1 | `date -u` | 0 | Sat Oct 24 02:10:50 UTC 2026 |
| a2 | `echo $HOME` | 0 | `/agent/workspace/g2-rec/home-1dDO` |
| a3 | `ls -A $HOME` | 0 | `.codex` only |
| a4 | `claude --version` | 0 | 2.1.310 (Claude Code) |
| a5 | `codex --version` | 0 | codex-cli 0.164.0 |
| a6 | `git ls-remote https://github.com/frankxai/claude-skills-library refs/heads/agent/hyperagent/eval-pack-rc1` | 0 | `2602f49b604b6fee099d8e47a53a412f7460bea8` |
| b1 | `claude plugin marketplace add frankxai/claude-skills-library#agent/hyperagent/eval-pack-rc1` | 0 | "✔ Successfully added marketplace: claude-skills-library" (cloned over HTTPS, ref set to the branch) |
| b2 | `claude plugin install skills-with-evals@claude-skills-library` | 0 | "✔ Successfully installed plugin: skills-with-evals@claude-skills-library (scope: user)" |
| b3 | `claude plugin details skills-with-evals@claude-skills-library` | 0 | "Skills (10)", Agents/Hooks/MCP/LSP 0, always-on cost ~727 tok |
| c1 | `codex plugin marketplace add frankxai/claude-skills-library@agent/hyperagent/eval-pack-rc1` | 0 | "Added marketplace `claude-skills-library` from …git#agent/hyperagent/eval-pack-rc1" |
| c2 | `codex plugin add skills-with-evals@claude-skills-library` | 0 | "Added plugin `skills-with-evals` from marketplace `claude-skills-library`" |
| c3 | `codex debug prompt-input "Review this pull request diff before I merge it" \| sed 's/\\n/\n/g' \| grep -E '^- skills-with-evals:' \| cut -c1-105` (**filtered**) | 0 (pipeline 0 0 0 0) | 10 `- skills-with-evals:<skill>:` lines in the model-visible skill list |
| c4 | same, piped to `grep -c '^- skills-with-evals:'` (**filtered count**) | 0 (pipeline 0 0 0) | `10` |
| d1 | `git clone --depth 1 --branch agent/hyperagent/eval-pack-rc1 https://github.com/frankxai/claude-skills-library.git $HOME/clone` | 0 | 1485 objects, 5.62 MiB |
| d2 | `cd $HOME/clone` | 0 | n/a |
| d3 | `git --no-pager log -1 --format="%H %cd" --date=iso-strict` (I added this; it is not in the README) | 0 | `2602f49b… 2026-10-24T04:08:16+02:00`, which matches a6 |
| d4 | `claude plugin validate .` | 0 | "Validating marketplace manifest: …/.claude-plugin/marketplace.json ✔ Validation passed" |
| d5 | `node scripts/install-test.mjs` | 0 | "PASS claude-code: 10 skill(s) visible, 0 missing", "PASS codex: 10 skill(s) visible, 0 missing", "install-test: PASS (10 pack skills expected in each runtime)" |
| d6 | `date -u` | 0 | Sat Oct 24 02:10:54 UTC 2026 |

19 steps were recorded and all 19 exited 0. The recording contains no error or warning text.

## Skills seen per runtime

Expected 10: ui-ux-design-expert, github-code-review, nextjs-expert, mcp-architecture, ai-architect-review,
langgraph-patterns, skill-builder, product-management-expert, book-publishing, excellence-book-writing.

| Runtime | Count | Source in recording | Missing | Extra |
|---|---|---|---|---|
| Claude Code (public remote install) | **10** | `claude plugin details` → `Skills (10)` | none | none |
| Codex (public remote install) | **10** | `codex debug prompt-input` (filtered) → 10 lines, `grep -c` = 10 | none | none |
| Claude Code (repo `install-test.mjs`, local clone) | 10 | "PASS claude-code: 10 skill(s) visible, 0 missing" | none | none |
| Codex (repo `install-test.mjs`, local clone) | 10 | "PASS codex: 10 skill(s) visible, 0 missing" | none | none |

## `claude plugin validate .`

Passed (exit 0). The output says it validated the **marketplace manifest**
(`.claude-plugin/marketplace.json`). It does not say whether the individual plugin manifests were
checked on their own.

## What a newcomer could trip over in the README

1. **The branch pin is not a commit pin.** "Until it merges, pin the branch" installs whatever the branch
   head is at that moment. During this test the branch moved: take 1 (about 02:03 UTC) installed `ef5d4d54…`
   and take 2 (02:10 UTC) installed `2602f49b…`, which was committed at 02:08:16 UTC. Two newcomers a few
   minutes apart can end up with different code. The README itself did not change.
2. **Two different separators for the same pin.** Claude Code uses `…/claude-skills-library#<branch>`,
   while Codex uses `…/claude-skills-library@<branch>`. Copying the commands exactly works, but writing
   one from memory for the other runtime is an easy mistake. (A swapped separator was not tested.)
3. **Two styles of command.** Option 1 uses in-session slash commands (`/plugin marketplace add`,
   `/plugin install`), while the tested-pack block uses the `claude plugin …` CLI. Both are valid, but the
   README never says they are equivalent. The CLI form needed no login here. The slash form needs an
   interactive session, which was not tested.
4. **Same marketplace name for main and the RC branch.** Both are added as `claude-skills-library`. The README
   does not say what happens if a user has already followed option 1 (unpinned main) and then runs the
   pinned `marketplace add`, or how to switch back after the merge. This was not tested; a fresh HOME was used.
5. Minor: Claude uses `plugin install` and Codex uses `plugin add`. Codex puts the marketplace under
   `$CODEX_HOME/.tmp/marketplaces/…`, a directory named `.tmp` holding a persistent install, and
   records the plugin version as `local`, while Claude records the commit SHA.

## Files (in /agent/workspace/g2-rec/)

| File | Bytes | Note |
|---|---|---|
| `clean-install.cast` | 32,648 | asciicast v3 with a valid header on line 1, 243 `"o"` events, not edited |
| `clean-install.gif` | 1,375,348 | agg, font 15, speed 1.5 |
| `clean-install.mp4` | 853,227 | 1008x692, duration 6.030000 s |
| `clean-install.txt` | 6,945 | `asciinema convert` plain-text output; shows all 19 prompt lines and `# exit` lines |
| `walkthrough.sh` | 3,714 | the script that was recorded |
| `SHA256SUMS` | n/a | sums for the cast, gif, mp4 and walkthrough.sh |
| `README.snapshot.md` | 23,875 | README as read before recording |
| `home-1dDO/` | n/a | the stranger HOME from take 2, kept as evidence |

```
3b7b1e2135d4bb27670189b0ca5478375f3d642bdb22bb2e679c4928e6a3d116  clean-install.cast
95e65a68228153d9ac6630f6fe9cb066f9fc183228aa6dd9f9c15bda15eff038  clean-install.gif
64ae4f57e2e2ca1fd9b955f5d6e5a63e2acc818cada63148a661edf27d40e3f1  clean-install.mp4
9f5e5b8a0a80f474ecab2fba139813798ef7b9dea78faeae871df96324a4681c  walkthrough.sh
```

**Recorded clean install: PASS**
