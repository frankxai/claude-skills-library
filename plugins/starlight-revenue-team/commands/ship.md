---
description: Take one pull request to merged - local checks, a review from a different model provider, every finding answered, then the merge gate
argument-hint: <pr number or url>
---

Load the `revenue-protocol` skill. Dispatch the `ship-steward` agent with this target: $ARGUMENTS

The steward reports; you act on its report. Steps:

1. Read the PR: base, head SHA, draft state, checks, files, linked intent (issue,
   task or the operator's message). No linked intent means stop and ask for one.
2. Run the repo's own checks locally where they are cheap (lint, typecheck, tests).
   Report each with its exit code.
3. Get one review from a different provider than the one that wrote the branch.
   Use the `content-critic` recipe: `codex exec --sandbox read-only "<prompt>" < /dev/null`,
   then `gemini -p`, then `agy`. Give it the diff and the PR's stated intent.
4. Answer every finding: a fix commit, or a decline with the reason. A declined
   P0 or P1 needs a second provider to agree before it stays declined.
5. Merge gate:
   - If the repo has `tools/pr-gate.mjs`, run `verify`. The sign-off must come from a
     different harness than the branch prefix names, bound to the current head SHA.
     A new push invalidates it.
   - Otherwise stop at "ready for human merge" with the evidence.
6. After a merge, check the production surface it deploys to and say what you saw.

Never self-merge, never use `--admin`, never merge a draft, never bypass hooks.
Pull requests that delete a public route, touch money, change visibility, or
publish something for the first time wait for the operator.
