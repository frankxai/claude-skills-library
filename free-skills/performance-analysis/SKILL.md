---
name: performance-analysis
version: 1.0.0
description: Performance analysis, bottleneck detection, and optimization recommendations. Use when profiling slow code or systems, hunting a performance regression, or producing an optimization plan with measurable targets.
category: monitoring
tags: [performance, bottleneck, optimization, profiling, metrics, analysis]
author: Claude Flow Team
---

# Performance Analysis Skill

Comprehensive performance analysis suite for identifying bottlenecks, profiling swarm operations, generating detailed reports, and providing actionable optimization recommendations.

## Overview

This skill consolidates all performance analysis capabilities:
- **Bottleneck Detection**: Identify performance bottlenecks across communication, processing, memory, and network
- **Performance Profiling**: Real-time monitoring and historical analysis of swarm operations
- **Report Generation**: Create comprehensive performance reports in multiple formats
- **Optimization Recommendations**: AI-powered suggestions for improving performance

## Quick Start

### Basic Bottleneck Detection
```bash
npx claude-flow bottleneck detect
```

### Generate Performance Report
```bash
npx claude-flow analysis performance-report --format html --include-metrics
```

### Analyze and Auto-Fix
```bash
npx claude-flow bottleneck detect --fix --threshold 15
```


## Reference


The full detail lives in `references/` and loads only when needed:

- [`references/capabilities.md`](references/capabilities.md) — core capabilities & analysis details.

---

## Advanced Usage

### Continuous Monitoring
```bash
# Monitor performance in real-time
npx claude-flow swarm monitor --interval 5

# Generate hourly reports
while true; do
  npx claude-flow analysis performance-report \
    --format json \
    --output logs/perf-$(date +%Y%m%d-%H%M).json
  sleep 3600
done
```

### CI/CD Integration
```yaml
# .github/workflows/performance.yml
name: Performance Analysis
on: [push, pull_request]

jobs:
  analyze:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Run Performance Analysis
        run: |
          npx claude-flow analysis performance-report \
            --format json \
            --output performance.json
      - name: Check Performance Thresholds
        run: |
          npx claude-flow bottleneck detect \
            --threshold 15 \
            --export bottlenecks.json
      - name: Upload Reports
        uses: actions/upload-artifact@v2
        with:
          name: performance-reports
          path: |
            performance.json
            bottlenecks.json
```

### Custom Analysis Scripts
```javascript
// scripts/analyze-performance.js
const { exec } = require('child_process');
const fs = require('fs');

async function analyzePerformance() {
  // Run bottleneck detection
  const bottlenecks = await runCommand(
    'npx claude-flow bottleneck detect --format json'
  );

  // Generate performance report
  const report = await runCommand(
    'npx claude-flow analysis performance-report --format json'
  );

  // Analyze results
  const analysis = {
    bottlenecks: JSON.parse(bottlenecks),
    performance: JSON.parse(report),
    timestamp: new Date().toISOString()
  };

  // Save combined analysis
  fs.writeFileSync(
    'analysis/combined-report.json',
    JSON.stringify(analysis, null, 2)
  );

  // Generate alerts if needed
  if (analysis.bottlenecks.critical.length > 0) {
    console.error('CRITICAL: Performance bottlenecks detected!');
    process.exit(1);
  }
}

function runCommand(cmd) {
  return new Promise((resolve, reject) => {
    exec(cmd, (error, stdout, stderr) => {
      if (error) reject(error);
      else resolve(stdout);
    });
  });
}

analyzePerformance().catch(console.error);
```

## Best Practices

### 1. Regular Analysis
- Run bottleneck detection after major changes
- Generate weekly performance reports
- Monitor trends over time
- Set up automated alerts

### 2. Threshold Tuning
- Start with default threshold (20%)
- Lower for production systems (10-15%)
- Higher for development (25-30%)
- Adjust based on requirements

### 3. Fix Strategy
- Always review before applying --fix
- Test fixes in development first
- Apply fixes incrementally
- Monitor impact after changes

### 4. Report Integration
- Include in documentation
- Share with team regularly
- Track improvements over time
- Use for capacity planning

### 5. Continuous Optimization
- Learn from each analysis
- Build performance budgets
- Establish baselines
- Set improvement goals

## Troubleshooting

### Common Issues

**High Memory Usage**
```bash
# Analyze memory bottlenecks
npx claude-flow bottleneck detect --threshold 10

# Check cache performance
npx claude-flow cache manage --action stats

# Review memory metrics
npx claude-flow memory usage
```

**Slow Task Execution**
```bash
# Identify slow tasks
npx claude-flow task status --detailed

# Analyze coordination overhead
npx claude-flow bottleneck detect --time-range 1h

# Check agent utilization
npx claude-flow agent metrics
```

**Poor Cache Performance**
```bash
# Analyze cache hit rates
npx claude-flow analysis performance-report --sections metrics

# Review cache strategy
npx claude-flow cache manage --action analyze

# Enable cache warming
npx claude-flow bottleneck detect --fix
```

## Integration with Other Skills

- **swarm-orchestration**: Use performance data to optimize topology
- **memory-management**: Improve cache strategies based on analysis
- **task-coordination**: Adjust scheduling based on bottlenecks
- **neural-training**: Train patterns from performance data

## Related Commands

- `npx claude-flow swarm monitor` - Real-time monitoring
- `npx claude-flow token usage` - Token optimization analysis
- `npx claude-flow cache manage` - Cache optimization
- `npx claude-flow agent metrics` - Agent performance metrics
- `npx claude-flow task status` - Task execution analysis

## See Also

- Bottleneck Detection Guide: claude-flow command `analysis/bottleneck-detect` ([claude-flow](https://github.com/ruvnet/claude-flow))
- Performance Report Guide: claude-flow command `analysis/performance-report` ([claude-flow](https://github.com/ruvnet/claude-flow))
- Performance Bottlenecks Overview: claude-flow command `analysis/performance-bottlenecks` ([claude-flow](https://github.com/ruvnet/claude-flow))
- [Swarm Monitoring Documentation](../swarm-orchestration/SKILL.md)
- Memory Management Documentation (see the `memory-management` skill)

---

**Version**: 1.0.0
**Last Updated**: 2025-10-19
**Maintainer**: Claude Flow Team
