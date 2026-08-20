---
name: your-skill-name
description: One or two sentences that say WHAT this skill does AND WHEN the agent should load it. Write in the third person, name concrete tasks, and include trigger keywords a user would actually say. Example: "Generate professional release notes from a git history. Use when cutting a release, drafting a changelog, or summarizing commits since the last tag."
---

# Your Skill Name

> Delete this template's comments as you fill it in. Keep the body under ~500 lines —
> push deep material into `references/`, deterministic helpers into `scripts/`, and
> templates/fonts/icons into `assets/`. See `../spec/README.md` for the full standard.

## When to use this

Describe the situations this skill is for, in one tight paragraph. Be specific — this
reinforces the `description` and helps the model trigger correctly.

## Instructions

Give the agent clear, opinionated guidance: the workflow, the decisions, the gotchas.
Prefer numbered steps for fragile or order-dependent procedures, prose for open ones.
Assume the reader is a capable engineer — don't explain the basics.

1. Step one.
2. Step two.
3. Step three.

## References (optional)

Link to deeper docs the agent should read only when needed:

- `references/deep-dive.md` — loaded on demand (link it once the file exists).

## Scripts (optional)

Describe any executable helpers and whether the agent should **run** or **read** them:

- `scripts/do_thing.py` — run to perform X deterministically.

## Examples (optional)

Show one or two worked examples so the agent can pattern-match the desired output.
