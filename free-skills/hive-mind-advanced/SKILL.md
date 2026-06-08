---
name: hive-mind-advanced
description: Queen-led collective-intelligence coordination with consensus mechanisms and persistent shared memory. Use when orchestrating a large swarm of agents under a lead coordinator, building consensus across agents, or maintaining durable cross-agent memory.
version: 1.0.0
category: coordination
tags: [hive-mind, swarm, queen-worker, consensus, collective-intelligence, multi-agent, coordination]
author: Claude Flow Team
---

# Hive Mind Advanced Skill

Master the advanced Hive Mind collective intelligence system for sophisticated multi-agent coordination using queen-led architecture, Byzantine consensus, and collective memory.

## Overview

The Hive Mind system represents the pinnacle of multi-agent coordination in Claude Flow, implementing a queen-led hierarchical architecture where a strategic queen coordinator directs specialized worker agents through collective decision-making and shared memory.

## Core Concepts

### Architecture Patterns

**Queen-Led Coordination**
- Strategic queen agents orchestrate high-level objectives
- Tactical queens manage mid-level execution
- Adaptive queens dynamically adjust strategies based on performance

**Worker Specialization**
- Researcher agents: Analysis and investigation
- Coder agents: Implementation and development
- Analyst agents: Data processing and metrics
- Tester agents: Quality assurance and validation
- Architect agents: System design and planning
- Reviewer agents: Code review and improvement
- Optimizer agents: Performance enhancement
- Documenter agents: Documentation generation

**Collective Memory System**
- Shared knowledge base across all agents
- LRU cache with memory pressure handling
- SQLite persistence with WAL mode
- Memory consolidation and association
- Access pattern tracking and optimization

### Consensus Mechanisms

**Majority Consensus**
Simple voting where the option with most votes wins.

**Weighted Consensus**
Queen vote counts as 3x weight, providing strategic guidance.

**Byzantine Fault Tolerance**
Requires 2/3 majority for decision approval, ensuring robust consensus even with faulty agents.

## Getting Started

### 1. Initialize Hive Mind

```bash
# Basic initialization
npx claude-flow hive-mind init

# Force reinitialize
npx claude-flow hive-mind init --force

# Custom configuration
npx claude-flow hive-mind init --config hive-config.json
```

### 2. Spawn a Swarm

```bash
# Basic spawn with objective
npx claude-flow hive-mind spawn "Build microservices architecture"

# Strategic queen type
npx claude-flow hive-mind spawn "Research AI patterns" --queen-type strategic

# Tactical queen with max workers
npx claude-flow hive-mind spawn "Implement API" --queen-type tactical --max-workers 12

# Adaptive queen with consensus
npx claude-flow hive-mind spawn "Optimize system" --queen-type adaptive --consensus byzantine

# Generate Claude Code commands
npx claude-flow hive-mind spawn "Build full-stack app" --claude
```

### 3. Monitor Status

```bash
# Check hive mind status
npx claude-flow hive-mind status

# Get detailed metrics
npx claude-flow hive-mind metrics

# Monitor collective memory
npx claude-flow hive-mind memory
```


## Reference


The full detail lives in `references/` and loads only when needed:

- [`references/workflows-and-config.md`](references/workflows-and-config.md) — advanced workflows, integration, performance, configuration, hooks & troubleshooting.
- [`references/api-and-examples.md`](references/api-and-examples.md) — aPI reference & examples.

---

## Skill Progression

### Beginner
1. Initialize hive mind
2. Spawn basic swarms
3. Monitor status
4. Use majority consensus

### Intermediate
1. Configure queen types
2. Implement session management
3. Use weighted consensus
4. Access collective memory
5. Enable auto-scaling

### Advanced
1. Byzantine fault tolerance
2. Memory optimization
3. Custom worker types
4. Multi-hive coordination
5. Neural pattern training
6. Session export/import
7. Performance tuning

## Related Skills

- `swarm-orchestration`: Basic swarm coordination
- `consensus-mechanisms`: Distributed decision making
- `memory-systems`: Advanced memory management
- `sparc-methodology`: Structured development workflow
- `github-integration`: Repository coordination

## References

- [Hive Mind Documentation](https://github.com/ruvnet/claude-flow/docs/hive-mind)
- [Collective Intelligence Patterns](https://github.com/ruvnet/claude-flow/docs/patterns)
- [Byzantine Consensus](https://github.com/ruvnet/claude-flow/docs/consensus)
- [Memory Optimization](https://github.com/ruvnet/claude-flow/docs/memory)

---

**Skill Version**: 1.0.0
**Last Updated**: 2025-10-19
**Maintained By**: Claude Flow Team
**License**: MIT
