# Git Integration & Agent Coordination

> Reference for the `hooks-automation` skill. See [`../SKILL.md`](../SKILL.md).

### Git Integration

Hooks can integrate with Git operations for quality control:

#### Pre-Commit Hook
```bash
# Add to .git/hooks/pre-commit or use husky

#!/bin/bash
# Run quality checks before commit

# Get staged files
FILES=$(git diff --cached --name-only --diff-filter=ACM)

for FILE in $FILES; do
  # Run pre-edit hook for validation
  npx claude-flow hook pre-edit --file "$FILE" --validate-syntax

  if [ $? -ne 0 ]; then
    echo "Validation failed for $FILE"
    exit 1
  fi

  # Run post-edit hook for formatting
  npx claude-flow hook post-edit --file "$FILE" --auto-format
done

# Run tests
npm test

exit $?
```

#### Post-Commit Hook
```bash
# Add to .git/hooks/post-commit

#!/bin/bash
# Track commit metrics

COMMIT_HASH=$(git rev-parse HEAD)
COMMIT_MSG=$(git log -1 --pretty=%B)

npx claude-flow hook notify \
  --message "Commit completed: $COMMIT_MSG" \
  --level info \
  --swarm-status
```

#### Pre-Push Hook
```bash
# Add to .git/hooks/pre-push

#!/bin/bash
# Quality gate before push

# Run full test suite
npm run test:all

# Run quality checks
npx claude-flow hook session-end \
  --generate-report \
  --export-metrics

# Verify quality thresholds
TRUTH_SCORE=$(npx claude-flow metrics score --format json | jq -r '.truth_score')

if (( $(echo "$TRUTH_SCORE < 0.95" | bc -l) )); then
  echo "Truth score below threshold: $TRUTH_SCORE < 0.95"
  exit 1
fi

exit 0
```

### Agent Coordination Workflow

How agents use hooks for coordination:

#### Agent Workflow Example

```bash
# Agent 1: Backend Developer
# STEP 1: Pre-task preparation
npx claude-flow hook pre-task \
  --description "Implement user authentication API" \
  --auto-spawn-agents \
  --load-memory

# STEP 2: Work begins - pre-edit validation
npx claude-flow hook pre-edit \
  --file "api/auth.js" \
  --auto-assign-agent \
  --validate-syntax

# STEP 3: Edit file (via Claude Code Edit tool)
# ... code changes ...

# STEP 4: Post-edit processing
npx claude-flow hook post-edit \
  --file "api/auth.js" \
  --memory-key "swarm/backend/auth-api" \
  --auto-format \
  --train-patterns

# STEP 5: Notify coordination system
npx claude-flow hook notify \
  --message "Auth API implementation complete" \
  --swarm-status \
  --broadcast

# STEP 6: Task completion
npx claude-flow hook post-task \
  --task-id "auth-api" \
  --analyze-performance \
  --store-decisions \
  --export-learnings
```

```bash
# Agent 2: Test Engineer (receives notification)
# STEP 1: Check memory for API details
npx claude-flow hook session-restore \
  --session-id "swarm-current" \
  --restore-memory

# Memory contains: swarm/backend/auth-api with implementation details

# STEP 2: Generate tests
npx claude-flow hook pre-task \
  --description "Write tests for auth API" \
  --load-memory

# STEP 3: Create test file
npx claude-flow hook post-edit \
  --file "api/auth.test.js" \
  --memory-key "swarm/testing/auth-api-tests" \
  --train-patterns

# STEP 4: Share test results
npx claude-flow hook notify \
  --message "Auth API tests complete - 100% coverage" \
  --broadcast
```
