# G2 · Real recording of a clean install

**What it is:** a live terminal recording made with [asciinema](https://asciinema.org) 3.2.1. It captures
the real output stream of a pseudo-terminal with its timing, as the commands ran. It is not a pixel capture of
a screen. An independent "stranger" agent wrote its own walkthrough from the public README alone, used a brand-new
empty HOME, and did not log in anywhere or write to GitHub.

**Result: PASS.** 19 steps, every one exit 0. Installed commit `2602f49` (shown by `git ls-remote` inside the
recording). `Skills (10)` in Claude Code, 10 skills in Codex's model-visible list, `✔ Validation passed`, and
`install-test: PASS` from a fresh clone. Details: [`RECORDING.md`](RECORDING.md) (the recorder's report, verbatim).

| File | What |
|---|---|
| `clean-install.cast` | **The recording.** asciicast v3, 243 output events, 4.54 s of real time, not edited. Replay: `asciinema play clean-install.cast` |
| `clean-install.txt` | Plain-text conversion (`asciinema convert`), for reading and grepping |
| `walkthrough.sh` | The script the stranger wrote and recorded. Each command prints a prompt line, then runs for real |
| `SHA256SUMS` | Checksums of the cast, the script and the stranger's GIF and MP4 renders |
| `SHA256SUMS.watchable` | Checksums of the slowed-down GIF and MP4 (rendered from the same cast with `agg --speed 0.3 --last-frame-duration 8`, about 23 s) |

The GIF and MP4 renders are binary, and the GitHub connector used here can only write text, so they are attached
in the Hyperagent thread instead. Their checksums are above. Anyone can re-render them from the cast:
`agg --speed 0.3 clean-install.cast out.gif`.

Two takes were recorded; only the second is kept. Take 1 stalled on a step the recorder had added (`git log -1`
opened a pager in the headless terminal). The README steps before it had already passed. Take 2 uses
`git --no-pager log -1`.

## What the recording surfaced, and what changed

| Finding | Status |
|---|---|
| The branch moves until merge: take 1 installed `ef5d4d5`, take 2 `2602f49`, minutes apart | Documented. Codex can pin an exact commit (`@<sha>`, verified). Claude Code 2.1.310 accepts only a branch or tag after `#` (`#<sha>` fails: "Remote branch … not found"). A fixed RC version for both runtimes needs a git tag; proposed, not created |
| A user who already added the marketplace from `main` cannot add the branch: Claude Code "source doesn't match its extraKnownMarketplaces entry", Codex "already added from a different source" | Verified. `marketplace remove claude-skills-library` then add works in both runtimes. README, pack README and cards now say so |
| README uses `#` for Claude Code and `@` for Codex, and mixes `/plugin` with `claude plugin` without saying why | README now explains both |
