# Starlight revenue team

A production team for Claude Code that turns finished work into shipped, measured
work. Seven commands, three fallback agents, one rubric, and gates that keep every
send, spend and merge with a person.

Most agent setups build plenty. What they lack is landing the work and knowing
who would pay for it. This team is built around those two gaps.

## Install

```
/plugin marketplace add frankxai/claude-skills-library
/plugin install starlight-revenue-team@claude-skills-library
```

Then run `node <plugin>/bin/team-doctor.mjs` in your repo to see what is missing.
The team works best with a second model provider on your PATH (`codex`, `gemini`
or `agy`), because the maker never scores its own work.

## Commands

| Command | What it does | Stops at |
|---|---|---|
| `/today` | Reads your rulings and capacity, picks at most three actions, runs them | anything you have not approved |
| `/ship <pr>` | Local checks, a review from a different provider, every finding answered, the merge gate | merge without an independent sign-off |
| `/piece <brand> <topic>` | Brief, your own material, research, draft, refinement pass, score | a scheduler draft; you press send |
| `/critic <target>` | Scores on the 30-point rubric through a different provider | a same-provider score, marked missing |
| `/demand <product>` | Installs or verifies a per-product waitlist, reads would-pay demand | checkout before a release gate passes |
| `/pack <skills>` | Lints and evals skills against a baseline, packages them | publishing or pricing |
| `/harvest <owner/repo>` | Licence check, adapt with credit, eval before registering | copying text with no permissive licence |

## Wires into your existing collective

If you already run specialist agents (a revenue or marketing lead, a skill
foundry, a design corps, a polish agent), the commands hand work to them. The
plugin's own agents, `content-critic`, `harvester` and `ship-steward`, are the
fallback, so a fresh install works too.

## The rubric

Six criteria scored 0 to 5: source truth, says something new, voice, reader
outcome, craft, brand fit. Ship at 26 of 30, revise at 22 to 25, restart below.
`bin/rubric-check.mjs` enforces the thresholds and marks a score from the maker's
own provider as missing. Details in `skills/revenue-protocol/SKILL.md`.

## Gates

No command publishes, posts, sends, spends, calls a metered tool without your
yes, changes a price, or registers a schedule. `/ship` hands the merge to you; it runs
your repo's merge gate only after you say yes to that PR in the conversation and the
gate, run from the base branch, passes with an independent sign-off.

Installed plugin commands are namespaced: `/starlight-revenue-team:ship` and so on.
The short names above are used for reading.

## Tests

```
node --test plugins/starlight-revenue-team/tests/*.test.mjs
```

Credits for what this learned from, with licences checked: `docs/borrowed-from.md`.
