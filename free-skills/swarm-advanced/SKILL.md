---
name: swarm-advanced
description: Advanced swarm-orchestration patterns for research, development, testing, and complex distributed workflows. Use when scaling beyond a few agents, designing dynamic swarm topologies, or coordinating large parallel agent workloads.
version: 2.0.0
category: orchestration
tags: [swarm, distributed, parallel, research, testing, development, coordination]
author: Claude Flow Team
---

# Advanced Swarm Orchestration

Master advanced swarm patterns for distributed research, development, and testing workflows. This skill covers comprehensive orchestration strategies using both MCP tools and CLI commands.

## Quick Start

### Prerequisites
```bash
# Ensure Claude Flow is installed
npm install -g claude-flow@alpha

# Add MCP server (if using MCP tools)
claude mcp add claude-flow npx claude-flow@alpha mcp start
```

### Basic Pattern
```javascript
// 1. Initialize swarm topology
mcp__claude-flow__swarm_init({ topology: "mesh", maxAgents: 6 })

// 2. Spawn specialized agents
mcp__claude-flow__agent_spawn({ type: "researcher", name: "Agent 1" })

// 3. Orchestrate tasks
mcp__claude-flow__task_orchestrate({ task: "...", strategy: "parallel" })
```

## Core Concepts

### Swarm Topologies

**Mesh Topology** - Peer-to-peer communication, best for research and analysis
- All agents communicate directly
- High flexibility and resilience
- Use for: Research, analysis, brainstorming

**Hierarchical Topology** - Coordinator with subordinates, best for development
- Clear command structure
- Sequential workflow support
- Use for: Development, structured workflows

**Star Topology** - Central coordinator, best for testing
- Centralized control and monitoring
- Parallel execution with coordination
- Use for: Testing, validation, quality assurance

**Ring Topology** - Sequential processing chain
- Step-by-step processing
- Pipeline workflows
- Use for: Multi-stage processing, data pipelines

### Agent Strategies

**Adaptive** - Dynamic adjustment based on task complexity
**Balanced** - Equal distribution of work across agents
**Specialized** - Task-specific agent assignment
**Parallel** - Maximum concurrent execution


## Reference


The full detail lives in `references/` and loads only when needed:

- [`references/patterns.md`](references/patterns.md) — research / development / testing / analysis swarm patterns & advanced techniques.

---

## Best Practices

### 1. Choosing the Right Topology

- **Mesh**: Research, brainstorming, collaborative analysis
- **Hierarchical**: Structured development, sequential workflows
- **Star**: Testing, validation, centralized coordination
- **Ring**: Pipeline processing, staged workflows

### 2. Agent Specialization

- Assign specific capabilities to each agent
- Avoid overlapping responsibilities
- Use coordination agents for complex workflows
- Leverage memory for agent communication

### 3. Parallel Execution

- Identify independent tasks for parallelization
- Use sequential execution for dependent tasks
- Monitor resource usage during parallel execution
- Implement proper error handling

### 4. Memory Management

- Use namespaces to organize memory
- Set appropriate TTL values
- Create regular backups
- Implement state snapshots for checkpoints

### 5. Monitoring and Optimization

- Monitor swarm health regularly
- Collect and analyze metrics
- Optimize topology based on performance
- Use neural patterns to learn from success

### 6. Error Recovery

- Implement fault tolerance strategies
- Use auto-recovery mechanisms
- Analyze error patterns
- Create fallback workflows

## Real-World Examples

### Example 1: AI Research Project
```javascript
// Research AI trends, analyze findings, generate report
mcp__claude-flow__swarm_init({ topology: "mesh", maxAgents: 6 })
// Spawn: 2 researchers, 2 analysts, 1 synthesizer, 1 documenter
// Parallel gather → Analyze patterns → Synthesize → Report
```

### Example 2: Full-Stack Application
```javascript
// Build complete web application with testing
mcp__claude-flow__swarm_init({ topology: "hierarchical", maxAgents: 8 })
// Spawn: 1 architect, 2 devs, 1 db engineer, 2 testers, 1 reviewer, 1 devops
// Design → Parallel implement → Test → Review → Deploy
```

### Example 3: Security Audit
```javascript
// Comprehensive security analysis
mcp__claude-flow__swarm_init({ topology: "star", maxAgents: 5 })
// Spawn: 1 coordinator, 1 code analyzer, 1 security scanner, 1 penetration tester, 1 reporter
// Parallel scan → Vulnerability analysis → Penetration test → Report
```

### Example 4: Performance Optimization
```javascript
// Identify and fix performance bottlenecks
mcp__claude-flow__swarm_init({ topology: "mesh", maxAgents: 4 })
// Spawn: 1 profiler, 1 bottleneck analyzer, 1 optimizer, 1 tester
// Profile → Identify bottlenecks → Optimize → Validate
```

## Troubleshooting

### Common Issues

**Issue**: Swarm agents not coordinating properly
**Solution**: Check topology selection, verify memory usage, enable monitoring

**Issue**: Parallel execution failing
**Solution**: Verify task dependencies, check resource limits, implement error handling

**Issue**: Memory persistence not working
**Solution**: Verify namespaces, check TTL settings, ensure backup configuration

**Issue**: Performance degradation
**Solution**: Optimize topology, reduce agent count, analyze bottlenecks

## Related Skills

- `sparc-methodology` - Systematic development workflow
- `github-integration` - Repository management and automation
- `neural-patterns` - AI-powered coordination optimization
- `memory-management` - Cross-session state persistence

## References

- [Claude Flow Documentation](https://github.com/ruvnet/claude-flow)
- [Swarm Orchestration Guide](https://github.com/ruvnet/claude-flow/wiki/swarm)
- [MCP Tools Reference](https://github.com/ruvnet/claude-flow/wiki/mcp)
- [Performance Optimization](https://github.com/ruvnet/claude-flow/wiki/performance)

---

**Version**: 2.0.0
**Last Updated**: 2025-10-19
**Skill Level**: Advanced
**Estimated Learning Time**: 2-3 hours
