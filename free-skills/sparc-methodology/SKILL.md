---
name: sparc-methodology
description: SPARC (Specification, Pseudocode, Architecture, Refinement, Completion) development methodology with multi-agent orchestration. Use when running a structured spec-to-code workflow or decomposing a feature through the SPARC phases.
version: 2.7.0
category: development
tags:
  - sparc
  - tdd
  - architecture
  - orchestration
  - methodology
  - multi-agent
author: Claude Flow
---

# SPARC Methodology - Comprehensive Development Framework

## Overview

SPARC (Specification, Pseudocode, Architecture, Refinement, Completion) is a systematic development methodology integrated with Claude Flow's multi-agent orchestration capabilities. It provides 17 specialized modes for comprehensive software development, from initial research through deployment and monitoring.

## Table of Contents

1. [Core Philosophy](#core-philosophy)
2. [Development Phases](#development-phases)
3. [Available Modes](#available-modes)
4. [Activation Methods](#activation-methods)
5. [Orchestration Patterns](#orchestration-patterns)
6. [TDD Workflows](#tdd-workflows)
7. [Best Practices](#best-practices)
8. [Integration Examples](#integration-examples)
9. [Common Workflows](#common-workflows)

---

## Core Philosophy

SPARC methodology emphasizes:

- **Systematic Approach**: Structured phases from specification to completion
- **Test-Driven Development**: Tests written before implementation
- **Parallel Execution**: Concurrent agent coordination for 2.8-4.4x speed improvements
- **Memory Integration**: Persistent knowledge sharing across agents and sessions
- **Quality First**: Comprehensive reviews, testing, and validation
- **Modular Design**: Clean separation of concerns with clear interfaces

### Key Principles

1. **Specification Before Code**: Define requirements and constraints clearly
2. **Design Before Implementation**: Plan architecture and components
3. **Tests Before Features**: Write failing tests, then make them pass
4. **Review Everything**: Code quality, security, and performance checks
5. **Document Continuously**: Maintain current documentation throughout

---

## Development Phases

### Phase 1: Specification
**Goal**: Define requirements, constraints, and success criteria

- Requirements analysis
- User story mapping
- Constraint identification
- Success metrics definition
- Pseudocode planning

**Key Modes**: `researcher`, `analyzer`, `memory-manager`

### Phase 2: Architecture
**Goal**: Design system structure and component interfaces

- System architecture design
- Component interface definition
- Database schema planning
- API contract specification
- Infrastructure planning

**Key Modes**: `architect`, `designer`, `orchestrator`

### Phase 3: Refinement (TDD Implementation)
**Goal**: Implement features with test-first approach

- Write failing tests
- Implement minimum viable code
- Make tests pass
- Refactor for quality
- Iterate until complete

**Key Modes**: `tdd`, `coder`, `tester`

### Phase 4: Review
**Goal**: Ensure code quality, security, and performance

- Code quality assessment
- Security vulnerability scanning
- Performance profiling
- Best practices validation
- Documentation review

**Key Modes**: `reviewer`, `optimizer`, `debugger`

### Phase 5: Completion
**Goal**: Integration, deployment, and monitoring

- System integration
- Deployment automation
- Monitoring setup
- Documentation finalization
- Knowledge capture

**Key Modes**: `workflow-manager`, `documenter`, `memory-manager`

---


## Reference


The full detail lives in `references/` and loads only when needed:

- [`references/modes.md`](references/modes.md) — available sparc modes & activation methods.
- [`references/patterns.md`](references/patterns.md) — orchestration patterns, tdd workflows, best practices & integration examples.

---

## Advanced Features

### Neural Pattern Training

```javascript
// Train patterns from successful workflows
mcp__claude-flow__neural_train {
  pattern_type: "coordination",
  training_data: "successful_tdd_workflow.json",
  epochs: 50
}
```

### Cross-Session Memory

```javascript
// Save session state
mcp__claude-flow__memory_persist {
  sessionId: "feature-auth-v1"
}

// Restore in new session
mcp__claude-flow__context_restore {
  snapshotId: "feature-auth-v1"
}
```

### GitHub Integration

```javascript
// Analyze repository
mcp__claude-flow__github_repo_analyze {
  repo: "owner/repo",
  analysis_type: "code_quality"
}

// Manage pull requests
mcp__claude-flow__github_pr_manage {
  repo: "owner/repo",
  pr_number: 123,
  action: "review"
}
```

### Performance Monitoring

```javascript
// Real-time swarm monitoring
mcp__claude-flow__swarm_monitor {
  swarmId: "current",
  interval: 5000
}

// Bottleneck analysis
mcp__claude-flow__bottleneck_analyze {
  component: "api-layer",
  metrics: ["latency", "throughput", "errors"]
}

// Token usage tracking
mcp__claude-flow__token_usage {
  operation: "feature-development",
  timeframe: "24h"
}
```

---

## Performance Benefits

**Proven Results**:
- **84.8%** SWE-Bench solve rate
- **32.3%** token reduction through optimizations
- **2.8-4.4x** speed improvement with parallel execution
- **27+** neural models for pattern learning
- **90%+** test coverage standard

---

## Support and Resources

- **Documentation**: https://github.com/ruvnet/claude-flow
- **Issues**: https://github.com/ruvnet/claude-flow/issues
- **NPM Package**: https://www.npmjs.com/package/claude-flow
- **Community**: Discord server (link in repository)

---

## Quick Reference

### Most Common Commands

```bash
# List modes
npx claude-flow sparc modes

# Run specific mode
npx claude-flow sparc run <mode> "task"

# TDD workflow
npx claude-flow sparc tdd "feature"

# Full pipeline
npx claude-flow sparc pipeline "task"

# Batch execution
npx claude-flow sparc batch <modes> "task"
```

### Most Common MCP Calls

```javascript
// Initialize swarm
mcp__claude-flow__swarm_init { topology: "hierarchical" }

// Execute mode
mcp__claude-flow__sparc_mode { mode: "coder", task_description: "..." }

// Monitor progress
mcp__claude-flow__swarm_monitor { interval: 5000 }

// Store in memory
mcp__claude-flow__memory_usage { action: "store", key: "...", value: "..." }
```

---

Remember: **SPARC = Systematic, Parallel, Agile, Refined, Complete**
