---
name: stream-chain
description: Stream-JSON chaining for multi-agent pipelines, data transformation, and sequential workflows. Use when piping output between agents/tools as streaming JSON or building a sequential transform pipeline.
version: 1.0.0
category: workflow
tags: [streaming, pipeline, chaining, multi-agent, workflow]
---

# Stream-Chain Skill

Execute sophisticated multi-step workflows where each agent's output flows into the next, enabling complex data transformations and sequential processing pipelines.

## Overview

Stream-Chain provides two powerful modes for orchestrating multi-agent workflows:

1. **Custom Chains** (`run`): Execute custom prompt sequences with full control
2. **Predefined Pipelines** (`pipeline`): Use battle-tested workflows for common tasks

Each step in a chain receives the complete output from the previous step, enabling sophisticated multi-agent coordination through streaming data flow.

---

## Quick Start

### Run a Custom Chain

```bash
claude-flow stream-chain run \
  "Analyze codebase structure" \
  "Identify improvement areas" \
  "Generate action plan"
```

### Execute a Pipeline

```bash
claude-flow stream-chain pipeline analysis
```

---


## Reference


The full detail lives in `references/` and loads only when needed:

- [`references/pipelines.md`](references/pipelines.md) — custom chains, predefined pipelines, custom pipeline definitions & advanced use cases.

---

## Best Practices

### 1. Clear and Specific Prompts

**Good:**
```bash
"Analyze authentication.js for SQL injection vulnerabilities"
```

**Avoid:**
```bash
"Check security"
```

### 2. Logical Progression

Order prompts to build on previous outputs:
```bash
1. "Identify the problem"
2. "Analyze root causes"
3. "Design solution"
4. "Implement solution"
5. "Verify implementation"
```

### 3. Appropriate Timeouts

- Simple tasks: 30 seconds (default)
- Analysis tasks: 45-60 seconds
- Implementation tasks: 60-90 seconds
- Complex workflows: 90-120 seconds

### 4. Verification Steps

Include validation in your chains:
```bash
claude-flow stream-chain run \
  "Implement feature X" \
  "Write tests for feature X" \
  "Verify tests pass and cover edge cases"
```

### 5. Iterative Refinement

Use chains for iterative improvement:
```bash
claude-flow stream-chain run \
  "Generate initial implementation" \
  "Review and identify issues" \
  "Refine based on issues found" \
  "Final quality check"
```

---

## Integration with Claude Flow

### Combine with Swarm Coordination

```bash
# Initialize swarm for coordination
claude-flow swarm init --topology mesh

# Execute stream chain with swarm agents
claude-flow stream-chain run \
  "Agent 1: Research task" \
  "Agent 2: Implement solution" \
  "Agent 3: Test implementation" \
  "Agent 4: Review and refine"
```

### Memory Integration

Stream chains automatically store context in memory for cross-session persistence:

```bash
# Execute chain with memory
claude-flow stream-chain run \
  "Analyze requirements" \
  "Design architecture" \
  --verbose

# Results stored in .claude-flow/memory/stream-chain/
```

### Neural Pattern Training

Successful chains train neural patterns for improved performance:

```bash
# Enable neural training
claude-flow stream-chain pipeline optimize --debug

# Patterns learned and stored for future optimizations
```

---

## Troubleshooting

### Chain Timeout

If steps timeout, increase timeout value:

```bash
claude-flow stream-chain run "complex task" --timeout 120
```

### Context Loss

If context not flowing properly, use `--debug`:

```bash
claude-flow stream-chain run "step 1" "step 2" --debug
```

### Pipeline Not Found

Verify pipeline name and custom definitions:

```bash
# Check available pipelines
cat .claude-flow/config.json | grep -A 10 "streamChain"
```

---

## Performance Characteristics

- **Throughput**: 2-5 steps per minute (varies by complexity)
- **Context Size**: Up to 100K tokens per step
- **Memory Usage**: ~50MB per active chain
- **Concurrency**: Supports parallel chain execution

---

## Related Skills

- **SPARC Methodology**: Systematic development workflow
- **Swarm Coordination**: Multi-agent orchestration
- **Memory Management**: Persistent context storage
- **Neural Patterns**: Adaptive learning

---

## Examples Repository

### Complete Development Workflow

```bash
# Full feature development chain
claude-flow stream-chain run \
  "Analyze requirements for user profile feature" \
  "Design database schema and API endpoints" \
  "Implement backend with validation" \
  "Create frontend components" \
  "Write comprehensive tests" \
  "Generate API documentation" \
  --timeout 60 \
  --verbose
```

### Code Review Pipeline

```bash
# Automated code review workflow
claude-flow stream-chain run \
  "Analyze recent git changes" \
  "Identify code quality issues" \
  "Check for security vulnerabilities" \
  "Verify test coverage" \
  "Generate code review report with recommendations"
```

### Migration Assistant

```bash
# Framework migration helper
claude-flow stream-chain run \
  "Analyze current Vue 2 codebase" \
  "Identify Vue 3 breaking changes" \
  "Create migration checklist" \
  "Generate migration scripts" \
  "Provide updated code examples"
```

---

## Conclusion

Stream-Chain enables sophisticated multi-step workflows by:

- **Sequential Processing**: Each step builds on previous results
- **Context Preservation**: Full output history flows through chain
- **Flexible Orchestration**: Custom chains or predefined pipelines
- **Agent Coordination**: Natural multi-agent collaboration pattern
- **Data Transformation**: Complex processing through simple steps

Use `run` for custom workflows and `pipeline` for battle-tested solutions.
