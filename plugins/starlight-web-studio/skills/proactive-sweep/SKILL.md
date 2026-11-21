---
name: proactive-sweep
description: Run the studio without being asked - sweep every registered property, rank where an hour of work moves the most, turn the top findings into proposals, and open draft PRs only for the low-risk hygiene class. Use for /studio-sweep, a scheduled or looped studio run, "what should we improve across all sites", portfolio-wide design or SEO review, or deciding the studio's next job. Defines the autonomy ladder and what always waits for a person.
---

# Proactive sweep

The work a person usually has to prompt for: noticing that a site slipped,
deciding what to fix first, and drafting the fix. The sweep does the noticing
and the ranking every time; people keep the decisions that are theirs.

## The loop

1. **Sweep.** `node "${CLAUDE_PLUGIN_ROOT}/bin/studio-sweep.mjs" --targets <file> --out .studio/sweeps`
   Targets are a JSON array of `{id, url, tier, repo}` or a Starlight
   `properties.graph.json`. Output: `machine-<date>.jsonl` and `board-<date>.md`.
2. **Compare.** Diff today's board against the last one. A score that dropped is
   a regression and outranks a score that was always low.
3. **Look.** For the top three by opportunity, dispatch `site-scout` for the
   visual capture and the eye rubric. The machine board ranks; eyes decide.
4. **Propose.** One proposal per property in `.studio/<id>/proposal.md`: the
   problem with evidence, the route (R2 to R5 from `studio-protocol`), the roles,
   the files, the expected score change, and the human gate it needs if any.
5. **Act, within the ladder.** Then stop and report.

## The autonomy ladder

| Level | What the studio may do alone | Examples |
|---|---|---|
| L0 observe | always | sweep, capture, score, write the board |
| L1 propose | always | proposals, signature briefs, direction boards |
| L2 hygiene PR | draft PR, one per repo per run | missing meta description, canonical, JSON-LD, alt text, viewport, manifest, theme-color |
| L3 page PR | draft PR, marked as needing design approval | copy rewrites, a redesigned section, motion |
| L4 human | never alone | new public pages or routes, removing over half a page, prices and checkout, DNS, external sends, paid generation, merging |

A draft PR is a proposal with a diff, not a release. It merges only through the
repo's review gate with a reviewer from a different provider than the maker.

## Guardrails

- Check the repo's open-PR budget before opening one. Over budget: write the
  proposal and skip the PR.
- One writer per repo per run, on its own `agent/<harness>/studio-<scope>` branch
  or worktree.
- Every scheduled run leaves a durable artifact (the board and proposals,
  committed or written to a known path). A run that reports only to its own log
  is a dead loop.
- A sweep that failed to fetch a property says so on the board; it never reuses
  yesterday's score.

## Scheduling

Do not register schedules yourself. Write the command a person can run once to
schedule it, for example a `/loop 24h /studio-sweep` in an interactive session
or the harness's scheduled-task facility, and leave the decision to them.
