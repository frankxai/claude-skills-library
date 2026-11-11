---
name: hooks-automation
description: Configure and automate Claude Code hooks in .claude/settings.json (PreToolUse, PostToolUse, UserPromptSubmit, Stop, SubagentStop, SessionEnd), including claude-flow pre/post-task, memory-coordination and session hooks. Use when setting up Claude Code hooks to auto-format files after edits, run pre-commit or safety checks before Bash commands, guard secrets or protected files, save session state on Stop or SessionEnd, or wire claude-flow and MCP hook runners for swarm coordination. Not for React hooks (useState, useEffect), plain .git/hooks scripts, or HTTP webhooks.
metadata:
  version: "2.0.0"
---

# Claude Code Hooks Automation

Configure deterministic lifecycle hooks in `.claude/settings.json` (project) or `~/.claude/settings.json` (user) so Claude Code automatically formats edited files, gates risky shell or Git commands before execution, blocks secret leaks or protected-file writes, and persists session state on completion.

## Trigger Boundaries

- **Activate when**: Setting up or debugging `.claude/settings.json` or `~/.claude/settings.json` `"hooks"`, writing `PreToolUse` / `PostToolUse` / `UserPromptSubmit` / `Stop` / `SubagentStop` / `SessionEnd` scripts, enforcing `exit 2` blocking gates, or returning structured JSON decisions on stdout.
- **Do NOT activate when**: Writing React hooks (`useState`, `useEffect`), Git-only `.git/hooks/` without Claude Code lifecycle integration, or generic webhook endpoints (Stripe/Polar/GitHub HTTP webhooks).

## Native Claude Code Hooks (`settings.json`)

Claude Code executes shell commands registered under the `"hooks"` key in `.claude/settings.json` at specific lifecycle events. Every hook receives a JSON payload on **stdin** and communicates back via **exit codes** and **stdout/stderr**.

### Hook Lifecycle Events

| Event | When It Fires | Common Use Cases |
|---|---|---|
| `PreToolUse` | Before a tool call executes (matches `tool_name` via regex `matcher`) | Block unsafe `Bash` commands, run pre-commit checks before `git commit`, guard secrets and protected files |
| `PostToolUse` | After a tool call completes successfully | Auto-format files after `Write`, `Edit`, or `MultiEdit`; run targeted tests |
| `UserPromptSubmit` | When the user submits a prompt, before Claude processes it | Inject repository context, validate prompt constraints |
| `Stop` | When the main Claude Code agent finishes responding | Save session state, log trajectory metrics, verify completion checks |
| `SubagentStop` | When a spawned subagent (`Task`) finishes responding | Aggregate subagent outputs, verify handoff receipts |
| `SessionEnd` | When a Claude Code session closes or terminates | Persist final session state, export metrics, clean up temporary artifacts |

### Exit Code, Stdin & JSON Stdout Decision Contract

- **Stdin JSON payload**: Every hook command receives JSON on `stdin` containing `session_id`, `transcript_path`, `cwd`, `hook_event_name`, and (for tool hooks) `tool_name`, `tool_input`, and `tool_response`.
- **Exit code `0` (Allow)**: Operation proceeds normally. When exiting `0`, a hook may also print structured JSON to `stdout` for fine-grained decision control:
  ```json
  {
    "hookSpecificOutput": {
      "hookEventName": "PreToolUse",
      "permissionDecision": "allow",
      "permissionDecisionReason": "Verified safe read-only command"
    }
  }
  ```
  *(Supported `permissionDecision` values for `PreToolUse`: `"allow"`, `"deny"`, `"ask"`; for `Stop` / `SubagentStop`: `{"decision": "block", "reason": "Run test suite before stopping"}`.)*
- **Exit code `2` (Block)**: Immediately blocks the action (for `PreToolUse`, prevents the tool call; for `Stop`, prevents stopping) and feeds **`stderr`** directly back to Claude so it can self-correct.
- **Any other non-zero exit code**: Non-blocking warning; logged to debug output while execution continues.

---

## Primary Recipes (`.claude/settings.json`)

### Recipe 1: Auto-Format After Every Edit + Pre-Commit Check + Secret/File Guard

Place this configuration in `.claude/settings.json` to:
1. Guard against secret leaks and protected file edits (`PreToolUse` on `Write|Edit|MultiEdit`),
2. Run a pre-commit check before `git commit` (`PreToolUse` on `Bash`), and
3. Run Prettier automatically after every file edit (`PostToolUse` on `Write|Edit|MultiEdit`):

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Write|Edit|MultiEdit",
        "hooks": [
          {
            "type": "command",
            "command": ".claude/hooks/file-and-secret-guard.sh"
          }
        ]
      },
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": ".claude/hooks/pre-commit-check.sh"
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Write|Edit|MultiEdit",
        "hooks": [
          {
            "type": "command",
            "command": "f=\"$(jq -r '.tool_input.file_path // empty')\"; if [ -n \"$f\" ]; then npx prettier --write -- \"$f\"; fi"
          }
        ]
      }
    ]
  }
}
```

#### Blocking Pre-Commit Gate (`.claude/hooks/pre-commit-check.sh`)

```bash
#!/usr/bin/env bash
set -euo pipefail
# Fail closed: any unexpected error (bad JSON, missing jq) blocks with exit 2.
trap 'echo "pre-commit-check: hook error, blocking until fixed" >&2; exit 2' ERR
PAYLOAD="$(cat)"
CMD="$(printf '%s' "$PAYLOAD" | jq -r '.tool_input.command // empty')"
# Matches `git commit`, `git -C repo commit`, `git -c k=v commit`, and chained forms.
# Over-matches some read-only commands (e.g. `git log --grep commit`): that only runs the checks.
COMMIT_RE='(^|[;&|(`[:space:]])git([[:space:]]+[^;&|]*)?[[:space:]]commit([[:space:]]|$)'

if [[ "$CMD" =~ $COMMIT_RE ]]; then
  if ! npm run lint --silent || ! npm test --silent; then
    echo "Pre-commit check failed: fix lint/test errors before committing." >&2
    exit 2
  fi
fi
exit 0
```

#### Blocking Secret & Protected-File Guard (`.claude/hooks/file-and-secret-guard.sh`)

```bash
#!/usr/bin/env bash
set -euo pipefail
# Fail closed: a jq parse error or any other failure blocks with exit 2.
trap 'echo "file-and-secret-guard: hook error, blocking until fixed" >&2; exit 2' ERR
PAYLOAD="$(cat)"
FILE_PATH="$(printf '%s' "$PAYLOAD" | jq -r '.tool_input.file_path // empty')"
CONTENT="$(printf '%s' "$PAYLOAD" | jq -r '(.tool_input.content // .tool_input.new_string // empty)')"

if [[ "$FILE_PATH" =~ (^|/)(\.env|CANON_LOCKED\.md)$ ]]; then
  echo "Blocked write to protected file: $FILE_PATH" >&2
  exit 2
fi

# grep exits 0 on a match, 1 on no match, 2 on error; treat an error as a block.
rc=0
printf '%s' "$CONTENT" | grep -Eq '(sk-[A-Za-z0-9_-]{20,}|ghp_[A-Za-z0-9]{20,}|AKIA[0-9A-Z]{16})' || rc=$?
if [[ $rc -eq 0 ]]; then
  echo "Blocked write: detected hardcoded secret token in $FILE_PATH" >&2
  exit 2
elif [[ $rc -ne 1 ]]; then
  echo "file-and-secret-guard: secret scan failed (grep exit $rc), blocking" >&2
  exit 2
fi

exit 0
```

### Recipe 2: Save Session State When a Session Ends (`Stop` / `SessionEnd`)

Use `Stop` (end of turn/task) and `SessionEnd` (when the session closes) in `.claude/settings.json` to persist session state and transcript metadata:

```json
{
  "hooks": {
    "Stop": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": ".claude/hooks/save-session-state.sh"
          }
        ]
      }
    ],
    "SessionEnd": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": ".claude/hooks/save-session-state.sh"
          }
        ]
      }
    ]
  }
}
```

Example `.claude/hooks/save-session-state.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail
mkdir -p .claude/state
PAYLOAD="$(cat)"
SESSION_ID="$(printf '%s' "$PAYLOAD" | jq -r '.session_id // "unknown"')"
printf '%s\n' "$PAYLOAD" > ".claude/state/session-${SESSION_ID}.json"
exit 0
```

---

## Swarm Coordination, Memory & Learning Hooks (claude-flow)

For multi-agent swarms, cross-session memory, and pattern training, run the `claude-flow` hook runner from native hook `command` fields. It needs Node and the CLI (`npm install -g claude-flow@alpha`); it is not required for the native recipes above.

Initialize it once per project:

```bash
npx claude-flow init --hooks        # writes hook entries into .claude/settings.json and docs into .claude/commands/hooks/
npx claude-flow hook validate-config
```

Check the generated `.claude/settings.json` with `jq empty .claude/settings.json` and read the added `"hooks"` entries before committing them. Then call the runner from a hook command or script:

```bash
# Optional: pre-task and post-edit swarm memory hooks invoked from a command script
npx claude-flow hook pre-task --description "Implement authentication"
npx claude-flow hook post-edit --file "src/auth.js" --memory-key "auth/login"
npx claude-flow hook session-end --session-id "dev-session" --export-metrics
```

## Reference

Detailed catalogs and extended patterns live in `references/` and load on demand:

- [`references/hooks-reference.md`](references/hooks-reference.md) — pre/post/MCP/session hook catalog and options.
- [`references/configuration.md`](references/configuration.md) — extended `.claude/settings.json` hook examples.
- [`references/coordination.md`](references/coordination.md) — MCP tool integration and memory coordination protocols.
- [`references/git-and-agents.md`](references/git-and-agents.md) — Git hook integration and multi-agent workflows.
- [`references/custom-and-examples.md`](references/custom-and-examples.md) — custom hook scripts and end-to-end examples.

## Verification Checklist

1. **Valid JSON**: Verify `.claude/settings.json` parses cleanly with `jq empty .claude/settings.json`.
2. **Stdin Payload Test**: Pipe a synthetic payload (`echo '{"tool_name":"Bash","tool_input":{"command":"git commit -m test"}}' | .claude/hooks/pre-commit-check.sh`) and verify exit code `0` vs `2`.
3. **Fast Execution**: Keep synchronous `PreToolUse` and `PostToolUse` hooks under 100ms or scope `matcher` tightly (`Write|Edit|MultiEdit`, `Bash`).
4. **Fail Closed with Exit Code `2`**: Always write the blocking reason to `stderr` (`>&2`) before `exit 2` so Claude receives actionable feedback.
