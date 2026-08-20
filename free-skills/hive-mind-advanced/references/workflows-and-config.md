# Advanced workflows, integration, performance, configuration, hooks & troubleshooting

> Reference for the `hive-mind-advanced` skill. See [`../SKILL.md`](../SKILL.md).

## Advanced Workflows

### Session Management

**Create and Manage Sessions**

```bash
# List active sessions
npx claude-flow hive-mind sessions

# Pause a session
npx claude-flow hive-mind pause <session-id>

# Resume a paused session
npx claude-flow hive-mind resume <session-id>

# Stop a running session
npx claude-flow hive-mind stop <session-id>
```

**Session Features**
- Automatic checkpoint creation
- Progress tracking with completion percentages
- Parent-child process management
- Session logs with event tracking
- Export/import capabilities

### Consensus Building

The Hive Mind builds consensus through structured voting:

```javascript
// Programmatic consensus building
const decision = await hiveMind.buildConsensus(
  'Architecture pattern selection',
  ['microservices', 'monolith', 'serverless']
);

// Result includes:
// - decision: Winning option
// - confidence: Vote percentage
// - votes: Individual agent votes
```

**Consensus Algorithms**

1. **Majority** - Simple democratic voting
2. **Weighted** - Queen has 3x voting power
3. **Byzantine** - 2/3 supermajority required

### Collective Memory

**Storing Knowledge**

```javascript
// Store in collective memory
await memory.store('api-patterns', {
  rest: { pros: [...], cons: [...] },
  graphql: { pros: [...], cons: [...] }
}, 'knowledge', { confidence: 0.95 });
```

**Memory Types**
- `knowledge`: Permanent insights (no TTL)
- `context`: Session context (1 hour TTL)
- `task`: Task-specific data (30 min TTL)
- `result`: Execution results (permanent, compressed)
- `error`: Error logs (24 hour TTL)
- `metric`: Performance metrics (1 hour TTL)
- `consensus`: Decision records (permanent)
- `system`: System configuration (permanent)

**Searching and Retrieval**

```javascript
// Search memory by pattern
const results = await memory.search('api*', {
  type: 'knowledge',
  minConfidence: 0.8,
  limit: 50
});

// Get related memories
const related = await memory.getRelated('api-patterns', 10);

// Build associations
await memory.associate('rest-api', 'authentication', 0.9);
```

### Task Distribution

**Automatic Worker Assignment**

The system intelligently assigns tasks based on:
- Keyword matching with agent specialization
- Historical performance metrics
- Worker availability and load
- Task complexity analysis

```javascript
// Create task (auto-assigned)
const task = await hiveMind.createTask(
  'Implement user authentication',
  priority: 8,
  { estimatedDuration: 30000 }
);
```

**Auto-Scaling**

```javascript
// Configure auto-scaling
const config = {
  autoScale: true,
  maxWorkers: 12,
  scaleUpThreshold: 2, // Pending tasks per idle worker
  scaleDownThreshold: 2 // Idle workers above pending tasks
};
```

## Integration Patterns

### With Claude Code

Generate Claude Code spawn commands directly:

```bash
npx claude-flow hive-mind spawn "Build REST API" --claude
```

Output:
```javascript
Task("Queen Coordinator", "Orchestrate REST API development...", "coordinator")
Task("Backend Developer", "Implement Express routes...", "backend-dev")
Task("Database Architect", "Design PostgreSQL schema...", "code-analyzer")
Task("Test Engineer", "Create Jest test suite...", "tester")
```

### With SPARC Methodology

```bash
# Use hive mind for SPARC workflow
npx claude-flow sparc tdd "User authentication" --hive-mind

# Spawns:
# - Specification agent
# - Architecture agent
# - Coder agents
# - Tester agents
# - Reviewer agents
```

### With GitHub Integration

```bash
# Repository analysis with hive mind
npx claude-flow hive-mind spawn "Analyze repo quality" --objective "owner/repo"

# PR review coordination
npx claude-flow hive-mind spawn "Review PR #123" --queen-type tactical
```

## Performance Optimization

### Memory Optimization

The collective memory system includes advanced optimizations:

**LRU Cache**
- Configurable cache size (default: 1000 entries)
- Memory pressure handling (default: 50MB)
- Automatic eviction of least-used entries

**Database Optimization**
- WAL (Write-Ahead Logging) mode
- 64MB cache size
- 256MB memory mapping
- Prepared statements for common queries
- Automatic ANALYZE and OPTIMIZE

**Object Pooling**
- Query result pooling
- Memory entry pooling
- Reduced garbage collection pressure

### Performance Metrics

```javascript
// Get performance insights
const insights = hiveMind.getPerformanceInsights();

// Includes:
// - asyncQueue utilization
// - Batch processing stats
// - Success rates
// - Average processing times
// - Memory efficiency
```

### Task Execution

**Parallel Processing**
- Batch agent spawning (5 agents per batch)
- Concurrent task orchestration
- Async operation optimization
- Non-blocking task assignment

**Benchmarks**
- 10-20x faster batch spawning
- 2.8-4.4x speed improvement overall
- 32.3% token reduction
- 84.8% SWE-Bench solve rate

## Configuration

### Hive Mind Config

```javascript
{
  "objective": "Build microservices",
  "name": "my-hive",
  "queenType": "strategic", // strategic | tactical | adaptive
  "maxWorkers": 8,
  "consensusAlgorithm": "byzantine", // majority | weighted | byzantine
  "autoScale": true,
  "memorySize": 100, // MB
  "taskTimeout": 60, // minutes
  "encryption": false
}
```

### Memory Config

```javascript
{
  "maxSize": 100, // MB
  "compressionThreshold": 1024, // bytes
  "gcInterval": 300000, // 5 minutes
  "cacheSize": 1000,
  "cacheMemoryMB": 50,
  "enablePooling": true,
  "enableAsyncOperations": true
}
```

## Hooks Integration

Hive Mind integrates with Claude Flow hooks for automation:

**Pre-Task Hooks**
- Auto-assign agents by file type
- Validate objective complexity
- Optimize topology selection
- Cache search patterns

**Post-Task Hooks**
- Auto-format deliverables
- Train neural patterns
- Update collective memory
- Analyze performance bottlenecks

**Session Hooks**
- Generate session summaries
- Persist checkpoint data
- Track comprehensive metrics
- Restore execution context

## Best Practices

### 1. Choose the Right Queen Type

**Strategic Queens** - For research, planning, and analysis
```bash
npx claude-flow hive-mind spawn "Research ML frameworks" --queen-type strategic
```

**Tactical Queens** - For implementation and execution
```bash
npx claude-flow hive-mind spawn "Build authentication" --queen-type tactical
```

**Adaptive Queens** - For optimization and dynamic tasks
```bash
npx claude-flow hive-mind spawn "Optimize performance" --queen-type adaptive
```

### 2. Leverage Consensus

Use consensus for critical decisions:
- Architecture pattern selection
- Technology stack choices
- Implementation approach
- Code review approval
- Release readiness

### 3. Utilize Collective Memory

**Store Learnings**
```javascript
// After successful pattern implementation
await memory.store('auth-pattern', {
  approach: 'JWT with refresh tokens',
  pros: ['Stateless', 'Scalable'],
  cons: ['Token size', 'Revocation complexity'],
  implementation: {...}
}, 'knowledge', { confidence: 0.95 });
```

**Build Associations**
```javascript
// Link related concepts
await memory.associate('jwt-auth', 'refresh-tokens', 0.9);
await memory.associate('jwt-auth', 'oauth2', 0.7);
```

### 4. Monitor Performance

```bash
# Regular status checks
npx claude-flow hive-mind status

# Track metrics
npx claude-flow hive-mind metrics

# Analyze memory usage
npx claude-flow hive-mind memory
```

### 5. Session Management

**Checkpoint Frequently**
```javascript
// Create checkpoints at key milestones
await sessionManager.saveCheckpoint(
  sessionId,
  'api-routes-complete',
  { completedRoutes: [...], remaining: [...] }
);
```

**Resume Sessions**
```bash
# Resume from any previous state
npx claude-flow hive-mind resume <session-id>
```

## Troubleshooting

### Memory Issues

**High Memory Usage**
```bash
# Run garbage collection
npx claude-flow hive-mind memory --gc

# Optimize database
npx claude-flow hive-mind memory --optimize

# Export and clear
npx claude-flow hive-mind memory --export --clear
```

**Low Cache Hit Rate**
```javascript
// Increase cache size in config
{
  "cacheSize": 2000,
  "cacheMemoryMB": 100
}
```

### Performance Issues

**Slow Task Assignment**
```javascript
// Enable worker type caching
// The system caches best worker matches for 5 minutes
// Automatic - no configuration needed
```

**High Queue Utilization**
```javascript
// Increase async queue concurrency
{
  "asyncQueueConcurrency": 20 // Default: min(maxWorkers * 2, 20)
}
```

### Consensus Failures

**No Consensus Reached (Byzantine)**
```bash
# Switch to weighted consensus for more decisive results
npx claude-flow hive-mind spawn "..." --consensus weighted

# Or use simple majority
npx claude-flow hive-mind spawn "..." --consensus majority
```

## Advanced Topics

### Custom Worker Types

Define specialized workers in `.claude/agents/`:

```yaml
name: security-auditor
type: specialist
capabilities:
  - vulnerability-scanning
  - security-review
  - penetration-testing
  - compliance-checking
priority: high
```

### Neural Pattern Training

The system trains on successful patterns:

```javascript
// Automatic pattern learning
// Happens after successful task completion
// Stores in collective memory
// Improves future task matching
```

### Multi-Hive Coordination

Run multiple hive minds simultaneously:

```bash
# Frontend hive
npx claude-flow hive-mind spawn "Build UI" --name frontend-hive

# Backend hive
npx claude-flow hive-mind spawn "Build API" --name backend-hive

# They share collective memory for coordination
```

### Export/Import Sessions

```bash
# Export session for backup
npx claude-flow hive-mind export <session-id> --output backup.json

# Import session
npx claude-flow hive-mind import backup.json
```
