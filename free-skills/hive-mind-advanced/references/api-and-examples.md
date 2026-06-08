# API reference & examples

> Reference for the `hive-mind-advanced` skill. See [`../SKILL.md`](../SKILL.md).

## API Reference

### HiveMindCore

```javascript
const hiveMind = new HiveMindCore({
  objective: 'Build system',
  queenType: 'strategic',
  maxWorkers: 8,
  consensusAlgorithm: 'byzantine'
});

await hiveMind.initialize();
await hiveMind.spawnQueen(queenData);
await hiveMind.spawnWorkers(['coder', 'tester']);
await hiveMind.createTask('Implement feature', 7);
const decision = await hiveMind.buildConsensus('topic', options);
const status = hiveMind.getStatus();
await hiveMind.shutdown();
```

### CollectiveMemory

```javascript
const memory = new CollectiveMemory({
  swarmId: 'hive-123',
  maxSize: 100,
  cacheSize: 1000
});

await memory.store(key, value, type, metadata);
const data = await memory.retrieve(key);
const results = await memory.search(pattern, options);
const related = await memory.getRelated(key, limit);
await memory.associate(key1, key2, strength);
const stats = memory.getStatistics();
const analytics = memory.getAnalytics();
const health = await memory.healthCheck();
```

### HiveMindSessionManager

```javascript
const sessionManager = new HiveMindSessionManager();

const sessionId = await sessionManager.createSession(
  swarmId, swarmName, objective, metadata
);

await sessionManager.saveCheckpoint(sessionId, name, data);
const sessions = await sessionManager.getActiveSessions();
const session = await sessionManager.getSession(sessionId);
await sessionManager.pauseSession(sessionId);
await sessionManager.resumeSession(sessionId);
await sessionManager.stopSession(sessionId);
await sessionManager.completeSession(sessionId);
```

## Examples

### Full-Stack Development

```bash
# Initialize hive mind
npx claude-flow hive-mind init

# Spawn full-stack hive
npx claude-flow hive-mind spawn "Build e-commerce platform" \
  --queen-type strategic \
  --max-workers 10 \
  --consensus weighted \
  --claude

# Output generates Claude Code commands:
# - Queen coordinator
# - Frontend developers (React)
# - Backend developers (Node.js)
# - Database architects
# - DevOps engineers
# - Security auditors
# - Test engineers
# - Documentation specialists
```

### Research and Analysis

```bash
# Spawn research hive
npx claude-flow hive-mind spawn "Research GraphQL vs REST" \
  --queen-type adaptive \
  --consensus byzantine

# Researchers gather data
# Analysts process findings
# Queen builds consensus on recommendation
# Results stored in collective memory
```

### Code Review

```bash
# Review coordination
npx claude-flow hive-mind spawn "Review PR #456" \
  --queen-type tactical \
  --max-workers 6

# Spawns:
# - Code analyzers
# - Security reviewers
# - Performance reviewers
# - Test coverage analyzers
# - Documentation reviewers
# - Consensus on approval/changes
```
