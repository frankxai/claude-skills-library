---
name: github-code-review
version: 2.0.0
description: Comprehensive GitHub pull-request code review with multi-agent coordination. Use when reviewing a PR or diff, auditing changes for correctness/security/style before merge, or generating actionable inline review comments.
category: github
tags: [code-review, github, security, pr-management]
author: Claude Code Flow (review method rewritten 2026-10-24 for the FrankX library)
requires:
  - github-cli (only to read and post reviews on GitHub)
capabilities:
  - Merge-blocking review of a pull request or diff, line by line
  - Correctness, security, data-integrity and error-handling checks
  - Actionable comments with location, impact and fix
  - Optional multi-agent review (references/swarm-review.md)
---

# GitHub Code Review

Reviews a pull request the way a careful senior engineer does: find what must block the merge, say exactly where and
why, and give the fix. Style comes last, and only if asked.

## How to review a diff

1. **Read the description, then the whole diff**, before writing anything. Note what the change claims to do.
2. **Trace untrusted input.** Follow every value that comes from outside (path and query params, body, headers,
   files, environment, third-party responses) to where it is used: queries, shell, file paths, HTML, logs, payments.
3. **Check every changed function against the list below.** Keep going after the first problem; a review that stops
   at one finding misses the rest.
4. **Check what the diff affects but does not show:** callers, route registration order, schema and migrations,
   config, retries.
5. **Report** in the format at the end.

## What blocks a merge

### Access
- Object-level authorization: every read or write of a record checks that it belongs to the caller (user, tenant,
  org), not only that someone is logged in.
- New endpoints carry the same authentication as their neighbours.

### Injection and untrusted input
- Queries use bound parameters. No SQL, shell command, file path, HTML or template built by concatenating input.
- Inputs are parsed and bounded: integers parsed as integers, limits and sizes capped, strings truncated, enums
  checked, negative or zero amounts rejected.

### Correctness
- Every async call whose result or side effect matters is awaited, and its failure is handled.
- Off-by-one errors: pagination (page 1 must mean offset 0), ranges, loop bounds, inclusive or exclusive dates.
- Routing: frameworks that match in registration order (Express, Koa, Flask) need specific paths before
  parameterised paths that would capture them, or the specific route is dead code.
- Money and units: integer minor units, rounding, currency, time zones.

### State, money and external side effects
- Multi-step writes happen in one transaction. Concurrent requests cannot apply the same change twice (row locks,
  unique constraints, idempotency keys).
- Calls with external effects (payments, refunds, emails, webhooks) are idempotent and ordered so that a later
  failure cannot leave the system lying: if the effect happened, the code and the response say so.
- Amounts and state changes are checked against current state (no refund above what was paid, no change to a closed
  record).

### Errors and logs
- No swallowed errors. A failure is never reported as success; a catch block logs useful context and returns an
  honest status.
- No secrets, tokens, credentials or full personal data in logs, error messages or responses.

### Tests and rollout
- Changed behaviour has tests, including the failure path.
- Migrations can be rolled back, or the PR says how to recover.

## Severity

| Level | Use for |
|---|---|
| **Block** | Security hole, data exposure or loss, wrong money, wrong results, a crash or dead code on a main path |
| **Should fix** | Missing tests on edge paths, performance problems at expected scale, misleading names or messages |
| **Optional** | Style and preference. Label it optional, or leave it out |

## Output

For each blocking issue: the location (file and line, or the quoted line), what goes wrong in production, and the
concrete fix (code if it is short). Then the should-fix items. **If nothing blocks the merge, say so plainly.** Do not
invent problems to fill a review; a reviewer who cannot say "this is fine" is not useful.

## Posting on GitHub

```bash
gh pr view 123 --json title,body,files     # context
gh pr diff 123                             # the diff to review
gh pr review 123 --request-changes --body-file review.md   # or --comment / --approve
```

Inline comments on specific lines go through `gh api repos/{owner}/{repo}/pulls/123/comments` with `path`, `line` and
`commit_id`.

## Optional: multi-agent review

The original swarm-based orchestration (ruv-swarm, claude-flow: parallel security, performance and architecture
agents, auto-merge gates) is kept in [`references/swarm-review.md`](references/swarm-review.md), with more detail in
[`references/reference.md`](references/reference.md). Use it only when those tools are installed. It does not
replace the checks above.

## License

Part of the Claude Code Flow project, MIT License. The review method above was rewritten on 2026-10-24.
