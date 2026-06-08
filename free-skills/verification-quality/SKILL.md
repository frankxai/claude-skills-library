---
name: verification-quality
description: Truth scoring, code-quality verification, and automatic rollback with a high accuracy threshold. Use when validating agent output before it ships, gating changes on quality, or adding a verify-and-rollback safety loop.
version: "2.0.0"
category: "quality-assurance"
tags: ["verification", "truth-scoring", "quality", "rollback", "metrics", "ci-cd"]
---

# Verification & Quality Assurance Skill

## What This Skill Does

This skill provides a comprehensive verification and quality assurance system that ensures code quality and correctness through:

- **Truth Scoring**: Real-time reliability metrics (0.0-1.0 scale) for code, agents, and tasks
- **Verification Checks**: Automated code correctness, security, and best practices validation
- **Automatic Rollback**: Instant reversion of changes that fail verification (default threshold: 0.95)
- **Quality Metrics**: Statistical analysis with trends, confidence intervals, and improvement tracking
- **CI/CD Integration**: Export capabilities for continuous integration pipelines
- **Real-time Monitoring**: Live dashboards and watch modes for ongoing verification

## Prerequisites

- Claude Flow installed (`npx claude-flow@alpha`)
- Git repository (for rollback features)
- Node.js 18+ (for dashboard features)

## Quick Start

```bash
# View current truth scores
npx claude-flow@alpha truth

# Run verification check
npx claude-flow@alpha verify check

# Verify specific file with custom threshold
npx claude-flow@alpha verify check --file src/app.js --threshold 0.98

# Rollback last failed verification
npx claude-flow@alpha verify rollback --last-good
```

---


## Reference


The full detail lives in `references/` and loads only when needed:

- [`references/guide.md`](references/guide.md) — truth scoring, verification checks, rollback, reports, dashboard, configuration & advanced workflows.

---

## Operations

### Performance Metrics

**Verification Speed:**
- Single file check: <100ms
- Directory scan: <500ms (per 100 files)
- Full codebase analysis: <5s (typical project)
- Truth score calculation: <50ms

**Rollback Speed:**
- Git-based rollback: <1s
- Selective file rollback: <500ms
- Backup creation: <2s

**Dashboard Performance:**
- Initial load: <1s
- Real-time updates: <100ms latency (WebSocket)
- Chart rendering: 60 FPS

### Troubleshooting

#### Common Issues

**Low Truth Scores:**
```bash
# Get detailed breakdown
npx claude-flow@alpha truth --verbose --threshold 0.0

# Check specific criteria
npx claude-flow@alpha verify check --verbose

# View agent-specific issues
npx claude-flow@alpha truth --agent <agent-name> --format json
```

**Rollback Failures:**
```bash
# Check git status
git status

# View rollback history
npx claude-flow@alpha verify rollback --history

# Manual rollback
git reset --hard HEAD~1
```

**Verification Timeouts:**
```bash
# Increase timeout
npx claude-flow@alpha verify check --timeout 60s

# Verify in batches
npx claude-flow@alpha verify batch --batch-size 10
```

### Exit Codes

Verification commands return standard exit codes:

- `0`: Verification passed (score ≥ threshold)
- `1`: Verification failed (score < threshold)
- `2`: Error during verification (invalid input, system error)

### Related Commands

- `npx claude-flow@alpha pair` - Collaborative development with verification
- `npx claude-flow@alpha train` - Training with verification feedback
- `npx claude-flow@alpha swarm` - Multi-agent coordination with quality checks
- `npx claude-flow@alpha report` - Generate comprehensive project reports

### Best Practices

1. **Set Appropriate Thresholds**: Use 0.99 for critical code, 0.95 for standard, 0.90 for experimental
2. **Enable Auto-rollback**: Prevent bad code from persisting
3. **Monitor Trends**: Track improvement over time, not just current scores
4. **Integrate with CI/CD**: Make verification part of your pipeline
5. **Use Watch Mode**: Get immediate feedback during development
6. **Export Metrics**: Track quality metrics in your monitoring system
7. **Review Rollbacks**: Understand why changes were rejected
8. **Train Agents**: Use verification feedback to improve agent performance

### Additional Resources

- Truth Scoring Algorithm: See `/docs/truth-scoring.md`
- Verification Criteria: See `/docs/verification-criteria.md`
- Integration Examples: See `/examples/verification/`
- API Reference: See `/docs/api/verification.md`
