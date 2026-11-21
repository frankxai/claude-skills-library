---
description: Sweep every registered property, rank where the studio should work next, and draft proposals
argument-hint: [targets.json or properties.graph.json] [--only tier-1]
---

Load the `proactive-sweep` skill and follow it.

Targets: $ARGUMENTS
If no targets file is given, look for `graph/properties.graph.json` in the
Starlight estate root, then `.studio/targets.json` in this repo. If neither
exists, ask for a list of URLs and stop.

1. Run the sweep script with those targets and write the board under `.studio/sweeps/`.
2. Compare with the previous board if one exists and call out regressions first.
3. Dispatch `site-scout` on the top three by opportunity, in parallel.
4. Write one `proposal.md` per property with route, roles, files, expected score
   change, and the human gate it needs.
5. Stay within the autonomy ladder. Report: the ranked board, regressions, the
   proposals, and any draft PRs opened.
