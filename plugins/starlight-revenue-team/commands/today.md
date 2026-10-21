---
description: Morning pulse - read the operator's rulings and capacity, pick at most three actions, dispatch them to the other team commands
argument-hint: [focus in plain words]
---

You are running the team's morning pulse. Load the `revenue-protocol` skill first.

Focus, if given: $ARGUMENTS

1. Run `node "${CLAUDE_PLUGIN_ROOT}/bin/team-doctor.mjs"` and note what is missing.
   A missing second provider means no score this run can count as independent.
2. Read the operator's rulings. The source is `rulingsSource` in `.studio/config.json`,
   or the `STUDIO_RULINGS_URL` environment variable. If neither is set, say so and
   treat every pending decision as not approved.
3. Read capacity: plan usage if the harness exposes it, free memory, and open pull
   requests against the repo's budget. Over budget means `/ship` comes before any
   new work.
4. Pick at most three actions, in this order of preference:
   - a pull request that can land today (`/ship`)
   - a demand gap on a surface with traffic (`/demand`)
   - one content piece for the brand currently in rotation (`/piece`)
   - a pack or harvest only when the three above are clear
   Execute only what the rulings approve. A ruling of hold or reject stops that item.
5. Dispatch each action by running its command. Never run two writers in one
   working tree.
6. End with three short lists: made, verified (with the command that proved it),
   and waiting on a person.

This command never merges, publishes, sends, spends, changes a price, or registers
a schedule. If the operator wants this to run daily, print a registration snippet
for their scheduler and stop.
