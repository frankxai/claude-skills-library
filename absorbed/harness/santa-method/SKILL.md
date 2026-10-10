---
name: santa-method
description: "Send a finished change to two reviewers who did not write it, using one rubric, and stop after three rounds. Use before a public page, a priced artifact, or a pull request that changes behavior."
license: MIT
---

# Two reviewers, then stop

The author does not grade the work. Two other readers use the same rubric. Neither sees the other's notes until both have answered.

## Order

1. Run the deterministic checks first: build, types, tests. This pass is for behavior, claims, and omissions.
2. Give both reviewers the spec and the diff. Ask for a pass or a fail per criterion, with a file or a line. A pass that cites nothing is not a pass.
3. Ship only when both pass. If either fails, fix the cited items and ask again with fresh readers.
4. Stop after three rounds. The remaining list goes to a person.

## Estate gates that sit on top

- The author harness does not sign its own pull request. Open a draft.
- Frank's inspection is not the quality layer. A second provider still reads a public or priced artifact.
- Do not merge from the chair that wrote the change.

## Rubric, minimum

- The claim matches a file, a command, or a page you can open.
- The change does what the task asked, including the edge the task named.
- No secret, no invented metric, no second coordinator smuggled in as a helper.

## Where this came from

The two-reviewer loop follows affaan-m/ECC `skills/santa-method` at `4eb71d92a39cab44ad40ac9d8a6a5ccb4029d6c2` (MIT). The three-round cap, the draft-PR rule, and the ban on self-signoff are estate law.

Built on SIP.
