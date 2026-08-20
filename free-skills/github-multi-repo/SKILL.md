---
name: github-multi-repo
version: 1.0.0
description: Multi-repository coordination, synchronization, and architecture management across many GitHub repos. Use when changes span several repositories, keeping repos in sync, or planning cross-repo architecture and dependency work.
category: github-integration
tags: [multi-repo, synchronization, architecture, coordination, github]
author: Claude Flow Team
requires:
  - ruv-swarm@^1.0.11
  - gh-cli@^2.0.0
capabilities:
  - cross-repository coordination
  - package synchronization
  - architecture optimization
  - template management
  - distributed workflows
---

# GitHub Multi-Repository Coordination Skill

## Overview

Advanced multi-repository coordination system that combines swarm intelligence, package synchronization, and repository architecture optimization. This skill enables organization-wide automation, cross-project collaboration, and scalable repository management.

## Core Capabilities

### 🔄 Multi-Repository Swarm Coordination
Cross-repository AI swarm orchestration for distributed development workflows.

### 📦 Package Synchronization
Intelligent dependency resolution and version alignment across multiple packages.

### 🏗️ Repository Architecture
Structure optimization and template management for scalable projects.

### 🔗 Integration Management
Cross-package integration testing and deployment coordination.

## Quick Start

### Initialize Multi-Repo Coordination
```bash
# Basic swarm initialization
npx claude-flow skill run github-multi-repo init \
  --repos "org/frontend,org/backend,org/shared" \
  --topology hierarchical

# Advanced initialization with synchronization
npx claude-flow skill run github-multi-repo init \
  --repos "org/frontend,org/backend,org/shared" \
  --topology mesh \
  --shared-memory \
  --sync-strategy eventual
```

### Synchronize Packages
```bash
# Synchronize package versions and dependencies
npx claude-flow skill run github-multi-repo sync \
  --packages "claude-code-flow,ruv-swarm" \
  --align-versions \
  --update-docs
```

### Optimize Architecture
```bash
# Analyze and optimize repository structure
npx claude-flow skill run github-multi-repo optimize \
  --analyze-structure \
  --suggest-improvements \
  --create-templates
```


## Reference


The full detail lives in `references/` and loads only when needed:

- [`references/reference.md`](references/reference.md) — features, configuration, communication, synchronization, architecture & monitoring.

---

## Best Practices

### 1. Repository Organization
- Clear repository roles and boundaries
- Consistent naming conventions
- Documented dependencies
- Shared configuration standards

### 2. Communication
- Use appropriate sync strategies
- Implement circuit breakers
- Monitor latency and failures
- Clear error propagation

### 3. Security
- Secure cross-repo authentication
- Encrypted communication channels
- Audit trail for all operations
- Principle of least privilege

### 4. Version Management
- Semantic versioning alignment
- Dependency compatibility validation
- Automated version bump coordination

### 5. Testing Integration
- Cross-package test validation
- Integration test automation
- Performance regression detection

## Performance Optimization

### Caching Strategy
```bash
npx claude-flow skill run github-multi-repo cache-strategy \
  --analyze-patterns \
  --suggest-cache-layers \
  --implement-invalidation
```

### Parallel Execution
```bash
npx claude-flow skill run github-multi-repo parallel-optimize \
  --analyze-dependencies \
  --identify-parallelizable \
  --execute-optimal
```

### Resource Pooling
```bash
npx claude-flow skill run github-multi-repo resource-pool \
  --share-agents \
  --distribute-load \
  --monitor-usage
```

## Troubleshooting

### Connectivity Issues
```bash
npx claude-flow skill run github-multi-repo diagnose-connectivity \
  --test-all-repos \
  --check-permissions \
  --verify-webhooks
```

### Memory Synchronization
```bash
npx claude-flow skill run github-multi-repo debug-memory \
  --check-consistency \
  --identify-conflicts \
  --repair-state
```

### Performance Bottlenecks
```bash
npx claude-flow skill run github-multi-repo perf-analysis \
  --profile-operations \
  --identify-bottlenecks \
  --suggest-optimizations
```

## Advanced Features

### 1. Distributed Task Queue
```bash
npx claude-flow skill run github-multi-repo queue \
  --backend redis \
  --workers 10 \
  --priority-routing \
  --dead-letter-queue
```

### 2. Cross-Repo Testing
```bash
npx claude-flow skill run github-multi-repo test \
  --setup-test-env \
  --link-services \
  --run-e2e \
  --tear-down
```

### 3. Monorepo Migration
```bash
npx claude-flow skill run github-multi-repo to-monorepo \
  --analyze-repos \
  --suggest-structure \
  --preserve-history \
  --create-migration-prs
```

## Examples

### Full-Stack Application Update
```bash
npx claude-flow skill run github-multi-repo fullstack-update \
  --frontend "org/web-app" \
  --backend "org/api-server" \
  --database "org/db-migrations" \
  --coordinate-deployment
```

### Cross-Team Collaboration
```bash
npx claude-flow skill run github-multi-repo cross-team \
  --teams "frontend,backend,devops" \
  --task "implement-feature-x" \
  --assign-by-expertise \
  --track-progress
```

## Metrics and Reporting

### Sync Quality Metrics
- Package version alignment percentage
- Documentation consistency score
- Integration test success rate
- Synchronization completion time

### Architecture Health Metrics
- Repository structure consistency score
- Documentation coverage percentage
- Cross-repository integration success rate
- Template adoption and usage statistics

### Automated Reporting
- Weekly sync status reports
- Dependency drift detection
- Documentation divergence alerts
- Integration health monitoring

## Integration Points

### Related Skills
- `github-workflow` - GitHub workflow automation
- `github-pr` - Pull request management
- `sparc-architect` - Architecture design
- `sparc-optimizer` - Performance optimization

### Related Commands
- `/github sync-coordinator` - Cross-repo synchronization
- `/github release-manager` - Coordinated releases
- `/github repo-architect` - Repository optimization
- `/sparc architect` - Detailed architecture design

## Support and Resources

- Documentation: https://github.com/ruvnet/claude-flow
- Issues: https://github.com/ruvnet/claude-flow/issues
- Examples: `.claude/examples/github-multi-repo/`

---

**Version:** 1.0.0
**Last Updated:** 2025-10-19
**Maintainer:** Claude Flow Team
