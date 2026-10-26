---
name: hooks-automation
description: Configure and automate Claude Code hooks in .claude/settings.json (PreToolUse, PostToolUse, UserPromptSubmit, Stop, SubagentStop, SessionEnd). Use when setting up Claude Code hooks to auto-format files after edits, run pre-commit or safety checks before Bash commands, save session state on Stop or SessionEnd, or wire optional external CLI and MCP hook runners.
---

# Claude Code Hooks Automation

Configure deterministic lifecycle hooks in `.claude/settings.json` (project) or `~/.claude/settings.json` (user) so Claude Code automatically formats edited files, gates risky shell or Git commands before execution, and persists session state on completion.

## Native Claude Code Hooks (`settings.json`)

Claude Code executes shell commands registered under the `"hooks"` key in `.claude/settings.json` at specific lifecycle events. Every hook receives a JSON payload on **stdin** and communicates back via **exit codes** and **stdout/stderr**.

### Hook Lifecycle Events

| Event | When It Fires | Common Use Cases |
|---|---|---|
| `PreToolUse` | Before a tool call executes (matches `tool_name` via `matcher`) | Block unsafe `Bash` commands, run pre-commit checks before `git commit`, guard protected files |
| `PostToolUse` | After a tool call completes successfully | Auto-format files after `Write`, `Edit`, or `MultiEdit`; run targeted tests |
| `UserPromptSubmit` | When the user submits a prompt, before Claude processes it | Inject repository context, validate prompt constraints |
| `Stop` | When the main Claude Code agent finishes responding | Save session state, log trajectory metrics, verify completion checks |
| `SubagentStop` | When a spawned subagent (`Task`) finishes responding | Aggregate subagent outputs, verify handoff receipts |
| `SessionEnd` | When a Claude Code session closes or terminates | Persist final session state, export metrics, clean up temporary artifacts |

### Exit Code & Stdin Contract

- **Stdin JSON payload**: Every hook command receives JSON on `stdin` containing `session_id`, `transcript_path`, `cwd`, `hook_event_name`, and (for tool hooks) `tool_name`, `tool_input`, and `tool_response`.
- **Exit code `0` (Allow)**: Operation proceeds normally. For `UserPromptSubmit` or `PreToolUse`, stdout can optionally return structured JSON decisions.
- **Exit code `2` (Block)**: Blocks the action (for `PreToolUse`, prevents the tool call; for `Stop`, prevents stopping) and feeds **`stderr`** directly back to Claude so it can self-correct.
- **Any other non-zero exit code**: Non-blocking warning; logged to debug output while execution continues.

---

## Primary Recipes (`.claude/settings.json`)

### Recipe 1: Auto-Format After Every Edit + Pre-Commit Check Before `git commit`

Place this configuration in `.claude/settings.json` to run a formatter (`PostToolUse` on `Write|Edit|MultiEdit`) and enforce a pre-commit check (`PreToolUse` on `Bash` when the command contains `git commit`):

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "jq -r '.tool_input.command // empty' | grep -q 'git commit' && npm test || exit 0"
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
            "command": "jq -r '.tool_input.file_path // empty' | xargs -r npx prettier --write"
          }
        ]
      }
    ]
  }
}
```

To return a blocking error (`exit 2`) to Claude when the pre-commit check fails before `git commit`:

```bash
#!/usr/bin/env bash
# .claude/hooks/pre-commit-check.sh
set -euo pipefail
PAYLOAD="$(cat)"
CMD="$(printf '%s' "$PAYLOAD" | jq -r '.tool_input.command // empty')"

if [[ "$CMD" =~ git[[:space:]]+commit ]]; then
  if ! npm run lint --silent || ! npm test --silent; then
    echo "Pre-commit check failed: fix lint/test errors before committing." >&2
    exit 2
  fi
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

## Optional Integration: External CLI & Swarm Hook Runners

When running multi-agent swarms or external memory coordination alongside native `.claude/settings.json` hooks, you can wire optional CLI runners such as `claude-flow`:

```bash
# Optional: initialize claude-flow hook handlers
npx claude-flow init --hooks

# Optional: pre-task and post-edit swarm memory hooks
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

## Best Practices & Troubleshooting

1. **Keep Hooks Fast**: Target under 100ms for synchronous `PreToolUse` and `PostToolUse` hooks; offload heavy work or scope matchers tightly (`Write|Edit|MultiEdit`, `Bash`).
2. **Read JSON from Stdin**: Native Claude Code hooks pass tool inputs via stdin JSON (`jq -r '.tool_input.file_path'`), not positional shell arguments.
3. **Fail Closed with Exit Code `2`**: Use `exit 2` with a clear message on `stderr` only when Claude must halt and remediate (such as blocked secrets, protected files, or failing pre-commit gates).
4. **Verify `.claude/settings.json` Syntax**: Ensure valid JSON, executable script permissions (`chmod +x`), and accurate regex `matcher` strings.
