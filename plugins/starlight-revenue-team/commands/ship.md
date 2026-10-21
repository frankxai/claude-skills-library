---
description: Take one pull request to the merge handoff - CI evidence, a review from a different model provider, every finding answered, the repo's merge gate
argument-hint: <pr number or url>
---

Load the `revenue-protocol` skill. Dispatch the `ship-steward` agent with this target: $ARGUMENTS

The steward reports; you act on its report. Steps:

1. Read the PR: base, head SHA, draft state, checks, files, linked intent (issue,
   task or the operator's message). No linked intent means stop and ask for one.
2. Checks: use the PR's CI results. Never run the PR's own scripts (lint, test,
   build) on this machine, because a pull request controls them. Run them only
   inside an isolated sandbox with no credentials and no outbound network; if none
   is available, say the local run was skipped and why.
3. Get one review from a different provider than the one that wrote the branch.
   Use the `content-critic` recipe: `codex exec --sandbox read-only "<prompt>" < /dev/null`,
   then `gemini -p`, then `agy`. Give it the diff and the PR's stated intent.
4. Answer every finding: a fix commit, or a decline with the reason. A declined
   P0 or P1 needs a second provider to agree before it stays declined.
5. Merge gate. The default is to stop and hand the merge to a person with the
   evidence: head SHA, checks, review, answered findings.
   - If the repo has `tools/pr-gate.mjs`, run `verify` and include its output. The
     sign-off must come from a different harness than the branch prefix names and
     is bound to the current head SHA; a new push invalidates it.
   - Run the gate's own `merge` command only when `.studio/config.json` sets
     `"allowGateMerge": true` and `verify` passes. Never call `gh pr merge` directly.
6. After any merge, check the production surface it deploys to and say what you saw.

Never self-merge, never use `--admin`, never merge a draft, never bypass hooks.
Pull requests that delete a public route, touch money, change visibility, or
publish something for the first time always wait for the operator.
