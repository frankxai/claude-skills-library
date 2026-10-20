# catalog

`skills.json` is a machine-readable index of this marketplace for agents and tools.

It lists every plugin in `.claude-plugin/marketplace.json` with its brand, source and
install lines for Claude Code, Codex and the `skills` CLI. For plugins stored in this repo it
also lists each skill: `name` and `description` from the SKILL.md frontmatter, the folder
`path`, and `hasEvals` (whether the folder has an `evals/` directory). Plugins sourced from
other repos carry `repo`, `path` and pinned `sha`; their skills are not fetched, so
`skills` is `null`.

How an agent should use it: read `totals` for scale, match a task against
`plugins[].skills[].description`, then follow that plugin's `install` entry. Fields in
`install.note` say which instructions were checked against upstream docs and which are
assumed.

Regenerate after changing skills or the marketplace:

    node scripts/build-catalog.mjs          # write
    node scripts/build-catalog.mjs --check  # exit 1 if stale (runs in CI)

Do not edit `skills.json` by hand; counts come from the generator.
