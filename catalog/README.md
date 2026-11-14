# catalog

`skills.json` is a machine-readable index of this marketplace for agents and tools. It is a
registry, not a list: every skill says who owns it, which version is canonical, what evidence
exists for it, and how to install it.

It lists every plugin in `.claude-plugin/marketplace.json` with its brand, source and
install lines for Claude Code, Codex and the `skills` CLI. For plugins stored in this repo it
also lists each skill:

| Field | Meaning |
|---|---|
| `name`, `description` | from the SKILL.md frontmatter |
| `path` | the folder inside this repo |
| `version` | the canonical version, from the owning repo when one is known |
| `hasEvals` | whether an eval suite exists for the skill, anywhere it ships |
| `evalSuites` | the eval suite paths that exist on disk |
| `eval` | the estate's verdict, with `verdict`, `evaluatedAt` and `receipt`, when one exists |
| `owner` | the canonical owning repo and path |
| `uri` | a stable install URI, `github:<owner repo>/<owner path>[@version]` |
| `versionConflict` | present only when the published copy and the canonical owner disagree on version |

Plugins sourced from other repos carry `repo`, `path` and pinned `sha`; their skills are not
fetched, so `skills` is `null`.

`ownership.json` is the estate-published input for owner, canonical version and eval verdict. It
is never hand-edited here; the estate skill resolver produces it and publishes it into this repo.

How an agent should use it: read `totals` for scale, match a task against
`plugins[].skills[].description`, then install it with `uri`. A skill whose `owner.repo` is not
this repo is a mirror here, and `uri` points at the canonical copy. Fields in
`install.note` say which instructions were checked against upstream docs and which are
assumed.

`totals` also carries `skillsWithEvalVerdict` (skills with an estate verdict),
`skillsWithVersion`, `skillsOwnedElsewhere` and `versionConflicts`, so a reader can see the
state of the namespace without walking every entry.

Regenerate after changing skills, packs or the marketplace:

    node scripts/build-catalog.mjs          # write
    node scripts/build-catalog.mjs --check  # exit 1 if stale (runs in CI)

Do not edit `skills.json` by hand; counts come from the generator.
