# Hook Configuration

> Reference for the `hooks-automation` skill. See [`../SKILL.md`](../SKILL.md).

### Configuration

#### Basic Configuration

Edit `.claude/settings.json` to configure hooks:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "^(Write|Edit|MultiEdit)$",
        "hooks": [{
          "type": "command",
          "command": "npx claude-flow hook pre-edit --file '${tool.params.file_path}' --memory-key 'swarm/editor/current'"
        }]
      },
      {
        "matcher": "^Bash$",
        "hooks": [{
          "type": "command",
          "command": "npx claude-flow hook pre-bash --command '${tool.params.command}'"
        }]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "^(Write|Edit|MultiEdit)$",
        "hooks": [{
          "type": "command",
          "command": "npx claude-flow hook post-edit --file '${tool.params.file_path}' --memory-key 'swarm/editor/complete' --auto-format --train-patterns"
        }]
      },
      {
        "matcher": "^Bash$",
        "hooks": [{
          "type": "command",
          "command": "npx claude-flow hook post-bash --command '${tool.params.command}' --update-metrics"
        }]
      }
    ]
  }
}
```

#### Advanced Configuration

Complete hook configuration with all features:

```json
{
  "hooks": {
    "enabled": true,
    "debug": false,
    "timeout": 5000,

    "PreToolUse": [
      {
        "matcher": "^(Write|Edit|MultiEdit)$",
        "hooks": [
          {
            "type": "command",
            "command": "npx claude-flow hook pre-edit --file '${tool.params.file_path}' --auto-assign-agent --validate-syntax",
            "timeout": 3000,
            "continueOnError": true
          }
        ]
      },
      {
        "matcher": "^Task$",
        "hooks": [
          {
            "type": "command",
            "command": "npx claude-flow hook pre-task --description '${tool.params.task}' --auto-spawn-agents --load-memory",
            "async": true
          }
        ]
      },
      {
        "matcher": "^Grep$",
        "hooks": [
          {
            "type": "command",
            "command": "npx claude-flow hook pre-search --query '${tool.params.pattern}' --check-cache"
          }
        ]
      }
    ],

    "PostToolUse": [
      {
        "matcher": "^(Write|Edit|MultiEdit)$",
        "hooks": [
          {
            "type": "command",
            "command": "npx claude-flow hook post-edit --file '${tool.params.file_path}' --memory-key 'edits/${tool.params.file_path}' --auto-format --train-patterns",
            "async": true
          }
        ]
      },
      {
        "matcher": "^Task$",
        "hooks": [
          {
            "type": "command",
            "command": "npx claude-flow hook post-task --task-id '${result.task_id}' --analyze-performance --store-decisions --export-learnings",
            "async": true
          }
        ]
      },
      {
        "matcher": "^Grep$",
        "hooks": [
          {
            "type": "command",
            "command": "npx claude-flow hook post-search --query '${tool.params.pattern}' --cache-results --train-patterns"
          }
        ]
      }
    ],

    "SessionStart": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "npx claude-flow hook session-start --session-id '${session.id}' --load-context"
          }
        ]
      }
    ],

    "SessionEnd": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "npx claude-flow hook session-end --session-id '${session.id}' --export-metrics --generate-summary --cleanup-temp"
          }
        ]
      }
    ]
  }
}
```

#### Protected File Patterns

Add protection for sensitive files:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "^(Write|Edit|MultiEdit)$",
        "hooks": [
          {
            "type": "command",
            "command": "npx claude-flow hook check-protected --file '${tool.params.file_path}'"
          }
        ]
      }
    ]
  }
}
```

#### Automatic Testing

Run tests after file modifications:

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "^Write$",
        "hooks": [
          {
            "type": "command",
            "command": "test -f '${tool.params.file_path%.js}.test.js' && npm test '${tool.params.file_path%.js}.test.js'",
            "continueOnError": true
          }
        ]
      }
    ]
  }
}
```
