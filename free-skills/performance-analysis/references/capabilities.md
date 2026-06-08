# Core capabilities & analysis details

> Reference for the `performance-analysis` skill. See [`../SKILL.md`](../SKILL.md).

## Core Capabilities

### 1. Bottleneck Detection

#### Command Syntax
```bash
npx claude-flow bottleneck detect [options]
```

#### Options
- `--swarm-id, -s <id>` - Analyze specific swarm (default: current)
- `--time-range, -t <range>` - Analysis period: 1h, 24h, 7d, all (default: 1h)
- `--threshold <percent>` - Bottleneck threshold percentage (default: 20)
- `--export, -e <file>` - Export analysis to file
- `--fix` - Apply automatic optimizations

#### Usage Examples
```bash
# Basic detection for current swarm
npx claude-flow bottleneck detect

# Analyze specific swarm over 24 hours
npx claude-flow bottleneck detect --swarm-id swarm-123 -t 24h

# Export detailed analysis
npx claude-flow bottleneck detect -t 24h -e bottlenecks.json

# Auto-fix detected issues
npx claude-flow bottleneck detect --fix --threshold 15

# Low threshold for sensitive detection
npx claude-flow bottleneck detect --threshold 10 --export critical-issues.json
```

#### Metrics Analyzed

**Communication Bottlenecks:**
- Message queue delays
- Agent response times
- Coordination overhead
- Memory access patterns
- Inter-agent communication latency

**Processing Bottlenecks:**
- Task completion times
- Agent utilization rates
- Parallel execution efficiency
- Resource contention
- CPU/memory usage patterns

**Memory Bottlenecks:**
- Cache hit rates
- Memory access patterns
- Storage I/O performance
- Neural pattern loading times
- Memory allocation efficiency

**Network Bottlenecks:**
- API call latency
- MCP communication delays
- External service timeouts
- Concurrent request limits
- Network throughput issues

#### Output Format
```
🔍 Bottleneck Analysis Report
━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 Summary
├── Time Range: Last 1 hour
├── Agents Analyzed: 6
├── Tasks Processed: 42
└── Critical Issues: 2

🚨 Critical Bottlenecks
1. Agent Communication (35% impact)
   └── coordinator → coder-1 messages delayed by 2.3s avg

2. Memory Access (28% impact)
   └── Neural pattern loading taking 1.8s per access

⚠️ Warning Bottlenecks
1. Task Queue (18% impact)
   └── 5 tasks waiting > 10s for assignment

💡 Recommendations
1. Switch to hierarchical topology (est. 40% improvement)
2. Enable memory caching (est. 25% improvement)
3. Increase agent concurrency to 8 (est. 20% improvement)

✅ Quick Fixes Available
Run with --fix to apply:
- Enable smart caching
- Optimize message routing
- Adjust agent priorities
```

### 2. Performance Profiling

#### Real-time Detection
Automatic analysis during task execution:
- Execution time vs. complexity
- Agent utilization rates
- Resource constraints
- Operation patterns

#### Common Bottleneck Patterns

**Time Bottlenecks:**
- Tasks taking > 5 minutes
- Sequential operations that could parallelize
- Redundant file operations
- Inefficient algorithm implementations

**Coordination Bottlenecks:**
- Single agent for complex tasks
- Unbalanced agent workloads
- Poor topology selection
- Excessive synchronization points

**Resource Bottlenecks:**
- High operation count (> 100)
- Memory constraints
- I/O limitations
- Thread pool saturation

#### MCP Integration
```javascript
// Check for bottlenecks in Claude Code
mcp__claude-flow__bottleneck_detect({
  timeRange: "1h",
  threshold: 20,
  autoFix: false
})

// Get detailed task results with bottleneck analysis
mcp__claude-flow__task_results({
  taskId: "task-123",
  format: "detailed"
})
```

**Result Format:**
```json
{
  "bottlenecks": [
    {
      "type": "coordination",
      "severity": "high",
      "description": "Single agent used for complex task",
      "recommendation": "Spawn specialized agents for parallel work",
      "impact": "35%",
      "affectedComponents": ["coordinator", "coder-1"]
    }
  ],
  "improvements": [
    {
      "area": "execution_time",
      "suggestion": "Use parallel task execution",
      "expectedImprovement": "30-50% time reduction",
      "implementationSteps": [
        "Split task into smaller units",
        "Spawn 3-4 specialized agents",
        "Use mesh topology for coordination"
      ]
    }
  ],
  "metrics": {
    "avgExecutionTime": "142s",
    "agentUtilization": "67%",
    "cacheHitRate": "82%",
    "parallelizationFactor": 1.2
  }
}
```

### 3. Report Generation

#### Command Syntax
```bash
npx claude-flow analysis performance-report [options]
```

#### Options
- `--format <type>` - Report format: json, html, markdown (default: markdown)
- `--include-metrics` - Include detailed metrics and charts
- `--compare <id>` - Compare with previous swarm
- `--time-range <range>` - Analysis period: 1h, 24h, 7d, 30d, all
- `--output <file>` - Output file path
- `--sections <list>` - Comma-separated sections to include

#### Report Sections
1. **Executive Summary**
   - Overall performance score
   - Key metrics overview
   - Critical findings

2. **Swarm Overview**
   - Topology configuration
   - Agent distribution
   - Task statistics

3. **Performance Metrics**
   - Execution times
   - Throughput analysis
   - Resource utilization
   - Latency breakdown

4. **Bottleneck Analysis**
   - Identified bottlenecks
   - Impact assessment
   - Optimization priorities

5. **Comparative Analysis** (when --compare used)
   - Performance trends
   - Improvement metrics
   - Regression detection

6. **Recommendations**
   - Prioritized action items
   - Expected improvements
   - Implementation guidance

#### Usage Examples
```bash
# Generate HTML report with all metrics
npx claude-flow analysis performance-report --format html --include-metrics

# Compare current swarm with previous
npx claude-flow analysis performance-report --compare swarm-123 --format markdown

# Custom output with specific sections
npx claude-flow analysis performance-report \
  --sections summary,metrics,recommendations \
  --output reports/perf-analysis.html \
  --format html

# Weekly performance report
npx claude-flow analysis performance-report \
  --time-range 7d \
  --include-metrics \
  --format markdown \
  --output docs/weekly-performance.md

# JSON format for CI/CD integration
npx claude-flow analysis performance-report \
  --format json \
  --output build/performance.json
```

#### Sample Markdown Report
```markdown
# Performance Analysis Report
