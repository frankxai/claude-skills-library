---
description: Turn a set of skills into an installable, eval-backed plugin pack and stage it for release
argument-hint: <skill paths> [pack name]
---

Load the `revenue-protocol` skill. Skills and pack name: $ARGUMENTS

If the environment has a skill foundry team (for example `skill-foundry-lead`,
`skill-judge`, `marketplace-manager`), hand the work to it and report its result.
Otherwise:

1. Lint each skill: frontmatter `name` matches its folder, the description says
   when to use it, the body stays under 500 lines, no secrets, no `$` followed by
   a digit in prose.
2. Eval each skill against a no-skill baseline. Use `claude plugin eval` when the CLI
   has it. A skill that does not beat the baseline on its own trigger prompts does
   not go in the pack.
3. Package: `.claude-plugin/plugin.json`, a README that says what the pack does for
   whom in one paragraph, and the marketplace entry.
4. Validate with `claude plugin validate <path>` if available, and run the repo's
   own skill validator.
5. Stage the release notes and version. Stop there.

Publishing to a registry, setting a price, or opening a checkout is the operator's
call. Give them the exact command to run.
