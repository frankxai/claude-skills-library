# web-excellence

A portable pack that makes website and web-design work go through the same
sequence in every repo, whether the session is running on a laptop or in a cloud
container.

It is three things:

1. **Eleven vendored skills** from the best public sources (Vercel, Emil Kowalski,
   nextlevelbuilder, arvindrk, Leonxlnx) — pinned to commits, re-syncable, MIT.
   See [SOURCES.md](SOURCES.md) for provenance and the assessment of each.
2. **Three native skills** that fill what none of them do: sequencing
   (`web-release-gate`), measurement (`core-web-vitals`), and evidence
   (`visual-proof`).
3. **Three hooks** that make the sequence the default instead of a suggestion.

## Install

```bash
# from a clone of this repo
packs/web-excellence/install.sh /path/to/your/repo

# from anywhere
git clone --depth 1 https://github.com/frankxai/claude-skills-library /tmp/csl \
  && /tmp/csl/packs/web-excellence/install.sh "$PWD"
```

Idempotent — re-run to upgrade. `--dry-run` shows the diff first. `--no-db`
skips `ui-ux-pro-max` (~1.8 MB of CSV) if repo size matters.

Then add one line to the repo's `CLAUDE.md`:

> Website / web-design work goes through the `web-release-gate` skill first.
> See `.claude/skills/web-release-gate/SKILL.md`.

## What actually enforces it

Skills alone do not enforce anything. Claude Code loads a skill when the task
matches its `description` — that makes a skill *available*, not *mandatory*, and
a skill with no valid YAML frontmatter is never loaded at all. Three layers,
weakest to strongest:

| Layer | Mechanism | Strength |
|---|---|---|
| Frontmatter | `description` matches the task → skill offered | availability only |
| `CLAUDE.md` line | in the system prompt every turn | strong, but competes with everything else in the file |
| **Hooks** | code that runs on real events | deterministic |

The hooks:

| Hook | Event | What it does |
|---|---|---|
| `web-excellence-session.py` | `SessionStart` | Injects the gate contract as `additionalContext`, and names the repo's own `design.md` / `taste.md` / `tailwind.config` as outranking the pack. Records which files were already uncommitted, so the Stop hook can tell this session's shell edits from earlier work. Silent if the pack is not installed. |
| `web-excellence-gate.py` | `PreToolUse` on `Edit\|Write\|MultiEdit\|NotebookEdit` | Fires the moment a UI file is written — `app/`, `components/`, `styles/`, any `.css` — with the checklist. Skips `api/`, `lib/`, tests, `route.ts`. Never blocks. Once per session (`WEB_GATE_EVERY_EDIT=1` to repeat). |
| `web-excellence-stop.py` | `Stop` | Closes the loop: if UI files were touched (through Edit/Write, or left uncommitted by a shell command since the session began) and the transcript shows no executed audit and capture, blocks the stop **once** with what is missing. Guarded three ways against looping. `WEB_GATE_NO_STOP=1` to disable. |

That last one is the loop. PreToolUse opens it, Stop closes it, and the state
file in `$TMPDIR` carries the touched-file list between them.

**The Stop hook's evidence check must never match a skill *name*.** The first
version did, and the PreToolUse reminder names the very skills it asks for — so
the reminder text landed in the transcript, the check saw the names, and the
gate passed on the strength of its own nagging. The loop was a no-op and nothing
caught it. `tests/test_hooks.py::test_reminder_cannot_satisfy_evidence` fails the
build if a marker ever reappears in the reminder.

Matching the markers as free text failed the same way one level down: the
`web-design-guidelines` skill quotes the guidelines URL, so loading the skills
closed the gate. A receipt now counts only where a run leaves it: the URL in
the input of a fetch call, and the capture line in the result of a Bash call
that executed `capture.mjs`. Subagent transcripts are read too.
`test_skill_text_cannot_satisfy_evidence` holds that line.

Re-running `install.sh` never overwrites a `.github/workflows/web-excellence.yml` that differs from the pack's. A repo tunes its workflow (action pins, draft gating), so the installer reports the difference instead.

Commands in `settings.json` go through `${CLAUDE_PROJECT_DIR}`. Hooks run in the
session's current directory, so a relative path stops resolving after the
agent `cd`s into a subdirectory.

Known gap: a UI change made by a shell command *and committed in the same turn*
is not seen; only uncommitted changes are compared, because comparing commits
would also flag everything a `git pull` brought in. The PR workflow still lints
those lines.

## Tests

```bash
python3 packs/web-excellence/tests/test_hooks.py
```

22 checks, no dependencies: gate path matching, fire-once-per-session, stop
blocks-then-never-again, no chaining, opt-out, case-insensitive contract
detection, `0600` state file, path-traversal-safe session ids, and the linter's
ratchet semantics both ways.

## Cloud sessions

Claude Code on the web, in a GitHub Action, or fired by a Routine runs in a
fresh container that clones the repo and nothing else. Consequences:

- **`.claude/` committed to the repo travels; `~/.claude/` does not.** Anything
  in a personal skills directory, or installed by a plugin marketplace on a
  laptop, is absent. This is why the pack installs *into the repo* and why the
  hooks are committed files rather than user settings.
- **Hooks run normally** in cloud sessions — same `.claude/settings.json`.
- **Playwright is preinstalled** at `/opt/pw-browsers` with
  `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1`. Never run `playwright install`;
  `visual-proof` honors `PLAYWRIGHT_CHROMIUM_EXECUTABLE` for this.
- **The container is ephemeral.** Screenshots and Lighthouse JSON are evidence
  for the turn, not artifacts — they are gitignored by the installer. Anything
  worth keeping gets committed and pushed.
- `web-design-guidelines` fetches its rules over the network at run time. In a
  no-egress environment it will fail; say the audit could not run rather than
  substituting a remembered version of the rules.

## Recurring enforcement

Hooks cover the session. For drift between sessions, schedule the audit:

- A **Routine** (`/loop`, or a cron trigger) running the gate across changed
  routes weekly, writing findings to a PR or a committed file. A scheduled run
  that reports only into run history is a void loop — always leave a durable
  artifact.
- A **CI job** running the static half — the `web-design-guidelines` rule list
  is a fetchable markdown file, so a grep-based subset works without a model.

## Layout

```
packs/web-excellence/
├── README.md              this file
├── SOURCES.md             upstream pins + why each skill was adopted or skipped
├── install.sh             install into a repo (idempotent)
├── sync-upstream.sh       re-vendor from upstream, rewrite the pin table
├── settings.snippet.json  the hooks block install.sh merges
├── ci/                    the model-free linter + its workflow
├── hooks/                 the three hooks
├── tests/                 test_hooks.py — run it after touching a hook
└── skills/                14 skills — 11 vendored, 3 native
```

Vendored skills are verbatim copies. Never hand-edit one — `sync-upstream.sh`
overwrites it. Local behavior belongs in the native skills or the hooks.
