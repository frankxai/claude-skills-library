---
name: verification-loop
description: "After a feature or refactor on this Windows estate, run six checks in order and write a PASS or FAIL note before a draft pull request. Use when work is about to be committed, pushed, or handed to another harness."
license: MIT
---

# Estate verification loop

Run the checks in this order. Stop at the first hard failure. Record a result for every check you could not run. A missing tool is not a pass.

1. Install and build with the repo's package manager. Prefer `pnpm` when `pnpm-lock.yaml` is present. Prefer `uv` for Python. Do not switch the repo to npm because a snippet says `npm run build`.
2. Types. For TypeScript, `pnpm exec tsc --noEmit` from the package that owns the change. For Python, `uv run pyright` only when that project already uses it.
3. Lint with the formatter the repo already configured. Do not add a new linter config to make this step green.
4. Tests the change can affect. State the command, the pass count, and the fail count from the tool output.
5. Secret scan of the diff for private-key blocks, `sk-ant`, GitHub token prefixes, and Slack token prefixes. Reading a local env file during development is normal on this machine. Committing one is not.
6. `git diff --stat` against the branch you will push. Name the files. Confirm you did not sweep another agent's untracked work.

## How to score

- Build, types, and tests are hard gates when those tools exist for the files you changed.
- A coverage number near 80 percent is a target for product code. It does not block a docs-only change or an ops handover.
- `console.log` left in application code is a warning. It does not fail the build by itself.
- If a check cannot run, write `NOT RUN` and the reason. Do not invent a pass.

## Report

```
VERIFICATION
build:    PASS | FAIL | NOT RUN
types:    PASS | FAIL | NOT RUN
lint:     PASS | FAIL | NOT RUN
tests:    PASS | FAIL | NOT RUN
secrets:  PASS | FAIL | NOT RUN
diff:     <n files>
ready:    YES | NO
```

The person who writes this report does not sign the pull request. Open a draft. A different harness reviews the exact SHA.

## Where this came from

The six-check shape follows affaan-m/ECC `skills/verification-loop` at `4eb71d92a39cab44ad40ac9d8a6a5ccb4029d6c2` (MIT). The commands, the Windows package managers, the coverage exception, and the maker-checker split are estate law.

Built on SIP.
