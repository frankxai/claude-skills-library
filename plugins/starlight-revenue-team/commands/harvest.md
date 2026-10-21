---
description: Bring the best of another GitHub repo into your own collective - licence check first, then adapt, credit and eval before anything is registered
argument-hint: <owner/repo> [path inside the repo]
---

Load the `revenue-protocol` skill. Dispatch the `harvester` agent on: $ARGUMENTS

1. Run `node "${CLAUDE_PLUGIN_ROOT}/bin/harvest-license.mjs" <owner/repo> [path]` and
   report the JSON it prints. The verdict holds only for the `sha` it names.
   - needs-path: the root is permissive but no path was named. Run it again with one.
   - needs-review: licence files above or inside the path, a truncated tree, or a
     path that does not exist at that commit.
     Read them; copy nothing until a person decides.
   - permissive (MIT, Apache-2.0, BSD, ISC, CC0): text may be adapted, with a row in
     `THIRD_PARTY_NOTICES.md` naming the repo, commit, licence and files.
   - copyleft or none-unknown: copy no text. Write from the principles and credit
     the source in the skill's README.
2. Check what you already have before adding anything. If a skill with the same job
   exists, improve that one instead of adding a second.
3. Adapt: keep what is specific and tested, cut what is generic, and match this
   collective's gates (maker is never checker, every send stays with a person).
4. Eval the result against a no-skill baseline. No lift, no registration.
5. Register it where the collective resolves skill names, and open a draft pull
   request with the licence result, the source commit and the eval numbers.

Never install a second orchestrator or a whole agent catalogue wholesale. Harvest
one skill or agent at a time.
