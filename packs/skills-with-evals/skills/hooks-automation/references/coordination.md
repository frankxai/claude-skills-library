# MCP, Memory & Response Coordination

> Reference for the `hooks-automation` skill. See [`../SKILL.md`](../SKILL.md).

### MCP Tool Integration

Hooks automatically integrate with MCP tools for coordination:

#### Pre-Task Hook with Agent Spawning

```javascript
// Hook command
npx claude-flow hook pre-task --description "Build REST API"

// Internally calls MCP tools:
mcp__claude-flow__agent_spawn {
  type: "backend-dev",
  capabilities: ["api", "database", "testing"]
}

mcp__claude-flow__memory_usage {
  action: "store",
  key: "swarm/task/api-build/context",
  namespace: "coordination",
  value: JSON.stringify({
    description: "Build REST API",
    agents: ["backend-dev"],
    started: Date.now()
  })
}
```

#### Post-Edit Hook with Memory Storage

```javascript
// Hook command
npx claude-flow hook post-edit --file "api/auth.js"

// Internally calls MCP tools:
mcp__claude-flow__memory_usage {
  action: "store",
  key: "swarm/edits/api/auth.js",
  namespace: "coordination",
  value: JSON.stringify({
    file: "api/auth.js",
    timestamp: Date.now(),
    changes: { added: 45, removed: 12 },
    formatted: true,
    linted: true
  })
}

mcp__claude-flow__neural_train {
  pattern_type: "coordination",
  training_data: { /* edit patterns */ }
}
```

#### Session End Hook with State Persistence

```javascript
// Hook command
npx claude-flow hook session-end --session-id "dev-2024"

// Internally calls MCP tools:
mcp__claude-flow__memory_persist {
  sessionId: "dev-2024"
}

mcp__claude-flow__swarm_status {
  swarmId: "current"
}

// Generates metrics and summary
```

### Memory Coordination Protocol

All hooks follow a standardized memory coordination pattern:

#### Three-Phase Memory Protocol

**Phase 1: STATUS** - Hook starts
```javascript
mcp__claude-flow__memory_usage {
  action: "store",
  key: "swarm/hooks/pre-edit/status",
  namespace: "coordination",
  value: JSON.stringify({
    status: "running",
    hook: "pre-edit",
    file: "src/auth.js",
    timestamp: Date.now()
  })
}
```

**Phase 2: PROGRESS** - Hook processes
```javascript
mcp__claude-flow__memory_usage {
  action: "store",
  key: "swarm/hooks/pre-edit/progress",
  namespace: "coordination",
  value: JSON.stringify({
    progress: 50,
    action: "validating syntax",
    file: "src/auth.js"
  })
}
```

**Phase 3: COMPLETE** - Hook finishes
```javascript
mcp__claude-flow__memory_usage {
  action: "store",
  key: "swarm/hooks/pre-edit/complete",
  namespace: "coordination",
  value: JSON.stringify({
    status: "complete",
    result: "success",
    agent_assigned: "backend-dev",
    syntax_valid: true,
    backup_created: true
  })
}
```

### Hook Response Format

Hooks return JSON responses to control operation flow:

#### Continue Response
```json
{
  "continue": true,
  "reason": "All validations passed",
  "metadata": {
    "agent_assigned": "backend-dev",
    "syntax_valid": true,
    "file": "src/auth.js"
  }
}
```

#### Block Response
```json
{
  "continue": false,
  "reason": "Protected file - manual review required",
  "metadata": {
    "file": ".env.production",
    "protection_level": "high",
    "requires": "manual_approval"
  }
}
```

#### Warning Response
```json
{
  "continue": true,
  "reason": "Syntax valid but complexity high",
  "warnings": [
    "Cyclomatic complexity: 15 (threshold: 10)",
    "Consider refactoring for better maintainability"
  ],
  "metadata": {
    "complexity": 15,
    "threshold": 10
  }
}
```
