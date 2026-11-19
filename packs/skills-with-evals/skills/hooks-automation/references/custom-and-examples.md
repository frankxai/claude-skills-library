# Custom Hooks & Real-World Examples

> Reference for the `hooks-automation` skill. See [`../SKILL.md`](../SKILL.md).

### Custom Hook Creation

Create custom hooks for specific workflows:

#### Custom Hook Template

```javascript
// .claude/hooks/custom-quality-check.js

module.exports = {
  name: 'custom-quality-check',
  type: 'pre',
  matcher: /\.(ts|js)$/,

  async execute(context) {
    const { file, content } = context;

    // Custom validation logic
    const complexity = await analyzeComplexity(content);
    const securityIssues = await scanSecurity(content);

    // Store in memory
    await storeInMemory({
      key: `quality/${file}`,
      value: { complexity, securityIssues }
    });

    // Return decision
    if (complexity > 15 || securityIssues.length > 0) {
      return {
        continue: false,
        reason: 'Quality checks failed',
        warnings: [
          `Complexity: ${complexity} (max: 15)`,
          `Security issues: ${securityIssues.length}`
        ]
      };
    }

    return {
      continue: true,
      reason: 'Quality checks passed',
      metadata: { complexity, securityIssues: 0 }
    };
  }
};
```

#### Register Custom Hook

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "^(Write|Edit)$",
        "hooks": [
          {
            "type": "script",
            "script": ".claude/hooks/custom-quality-check.js"
          }
        ]
      }
    ]
  }
}
```

### Real-World Examples

#### Example 1: Full-Stack Development Workflow

```bash
# Session start - initialize coordination
npx claude-flow hook session-start --session-id "fullstack-feature"

# Pre-task planning
npx claude-flow hook pre-task \
  --description "Build user profile feature - frontend + backend + tests" \
  --auto-spawn-agents \
  --optimize-topology

# Backend work
npx claude-flow hook pre-edit --file "api/profile.js"
# ... implement backend ...
npx claude-flow hook post-edit \
  --file "api/profile.js" \
  --memory-key "profile/backend" \
  --train-patterns

# Frontend work (reads backend details from memory)
npx claude-flow hook pre-edit --file "components/Profile.jsx"
# ... implement frontend ...
npx claude-flow hook post-edit \
  --file "components/Profile.jsx" \
  --memory-key "profile/frontend" \
  --train-patterns

# Testing (reads both backend and frontend from memory)
npx claude-flow hook pre-task \
  --description "Test profile feature" \
  --load-memory

# Session end - export everything
npx claude-flow hook session-end \
  --session-id "fullstack-feature" \
  --export-metrics \
  --generate-summary
```

#### Example 2: Debugging with Hooks

```bash
# Start debugging session
npx claude-flow hook session-start --session-id "debug-memory-leak"

# Pre-task: analyze issue
npx claude-flow hook pre-task \
  --description "Debug memory leak in event handlers" \
  --load-memory \
  --estimate-complexity

# Search for event emitters
npx claude-flow hook pre-search --query "EventEmitter"
# ... search executes ...
npx claude-flow hook post-search \
  --query "EventEmitter" \
  --cache-results

# Fix the issue
npx claude-flow hook pre-edit \
  --file "services/events.js" \
  --backup-file
# ... fix code ...
npx claude-flow hook post-edit \
  --file "services/events.js" \
  --memory-key "debug/memory-leak-fix" \
  --validate-output

# Verify fix
npx claude-flow hook post-task \
  --task-id "memory-leak-fix" \
  --analyze-performance \
  --generate-report

# End session
npx claude-flow hook session-end \
  --session-id "debug-memory-leak" \
  --export-metrics
```

#### Example 3: Multi-Agent Refactoring

```bash
# Initialize swarm for refactoring
npx claude-flow hook pre-task \
  --description "Refactor legacy codebase to modern patterns" \
  --auto-spawn-agents \
  --optimize-topology

# Agent 1: Code Analyzer
npx claude-flow hook pre-task --description "Analyze code complexity"
# ... analysis ...
npx claude-flow hook post-task \
  --task-id "analysis" \
  --store-decisions

# Agent 2: Refactoring (reads analysis from memory)
npx claude-flow hook session-restore \
  --session-id "swarm-refactor" \
  --restore-memory

for file in src/**/*.js; do
  npx claude-flow hook pre-edit --file "$file" --backup-file
  # ... refactor ...
  npx claude-flow hook post-edit \
    --file "$file" \
    --memory-key "refactor/$file" \
    --auto-format \
    --train-patterns
done

# Agent 3: Testing (reads refactored code from memory)
npx claude-flow hook pre-task \
  --description "Generate tests for refactored code" \
  --load-memory

# Broadcast completion
npx claude-flow hook notify \
  --message "Refactoring complete - all tests passing" \
  --broadcast
```
