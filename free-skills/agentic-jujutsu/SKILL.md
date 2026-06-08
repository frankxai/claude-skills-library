---
name: agentic-jujutsu
version: 2.3.2
description: Quantum-resistant, self-learning version control for AI agents, with ReasoningBank intelligence and multi-agent coordination. Use when designing agent memory/versioning, coordinating multiple agents over shared state, or building experience-replay and learning loops into an agentic system.
---

# Agentic Jujutsu - AI Agent Version Control

> Quantum-ready, self-learning version control designed for multiple AI agents working simultaneously without conflicts.

## When to Use This Skill

Use **agentic-jujutsu** when you need:
- ✅ Multiple AI agents modifying code simultaneously
- ✅ Lock-free version control (23x faster than Git)
- ✅ Self-learning AI that improves from experience
- ✅ Quantum-resistant security for future-proof protection
- ✅ Automatic conflict resolution (87% success rate)
- ✅ Pattern recognition and intelligent suggestions
- ✅ Multi-agent coordination without blocking

## Quick Start

### Installation

```bash
npx agentic-jujutsu
```

### Basic Usage

```javascript
const { JjWrapper } = require('agentic-jujutsu');

const jj = new JjWrapper();

// Basic operations
await jj.status();
await jj.newCommit('Add feature');
await jj.log(10);

// Self-learning trajectory
const id = jj.startTrajectory('Implement authentication');
await jj.branchCreate('feature/auth');
await jj.newCommit('Add auth');
jj.addToTrajectory();
jj.finalizeTrajectory(0.9, 'Clean implementation');

// Get AI suggestions
const suggestion = JSON.parse(jj.getSuggestion('Add logout feature'));
console.log(`Confidence: ${suggestion.confidence}`);
```


## Reference


The full detail lives in `references/` and loads only when needed:

- [`references/capabilities-and-api.md`](references/capabilities-and-api.md) — core capabilities, advanced use cases, API reference & performance.

---

## Best Practices

### 1. Trajectory Management

```javascript
// ✅ Good: Meaningful task descriptions
jj.startTrajectory('Implement user authentication with JWT');

// ❌ Bad: Vague descriptions
jj.startTrajectory('fix stuff');

// ✅ Good: Honest success scores
jj.finalizeTrajectory(0.7, 'Works but needs refactoring');

// ❌ Bad: Always 1.0
jj.finalizeTrajectory(1.0, 'Perfect!'); // Prevents learning
```

### 2. Pattern Recognition

```javascript
// ✅ Good: Let patterns emerge naturally
for (let i = 0; i < 10; i++) {
    jj.startTrajectory('Deploy feature');
    await deploy();
    jj.addToTrajectory();
    jj.finalizeTrajectory(wasSuccessful ? 0.9 : 0.5);
}

// ❌ Bad: Not recording outcomes
await deploy(); // No learning
```

### 3. Multi-Agent Coordination

```javascript
// ✅ Good: Concurrent operations
const agents = ['agent1', 'agent2', 'agent3'];
await Promise.all(agents.map(async (agent) => {
    const jj = new JjWrapper();
    // Each agent works independently
    await jj.newCommit(`Changes by ${agent}`);
}));

// ❌ Bad: Sequential with locks
for (const agent of agents) {
    await agent.waitForLock(); // Not needed!
    await agent.commit();
}
```

### 4. Error Handling

```javascript
// ✅ Good: Record failures with details
try {
    await jj.execute(['complex-operation']);
    jj.finalizeTrajectory(0.9);
} catch (err) {
    jj.finalizeTrajectory(0.3, `Failed: ${err.message}. Root cause: ...`);
}

// ❌ Bad: Silent failures
try {
    await jj.execute(['operation']);
} catch (err) {
    // No learning from failure
}
```

## Validation Rules (v2.3.1+)

### Task Description
- ✅ Cannot be empty or whitespace-only
- ✅ Maximum length: 10,000 bytes
- ✅ Automatically trimmed

### Success Score
- ✅ Must be finite (not NaN or Infinity)
- ✅ Must be between 0.0 and 1.0 (inclusive)

### Operations
- ✅ Must have at least one operation before finalizing

### Context
- ✅ Cannot be empty
- ✅ Keys cannot be empty or whitespace-only
- ✅ Keys max 1,000 bytes, values max 10,000 bytes

## Troubleshooting

### Issue: Low Confidence Suggestions

```javascript
const suggestion = JSON.parse(jj.getSuggestion('new task'));

if (suggestion.confidence < 0.5) {
    // Not enough data - check learning stats
    const stats = JSON.parse(jj.getLearningStats());
    console.log(`Need more data. Current trajectories: ${stats.totalTrajectories}`);
    
    // Recommend: Record 5-10 trajectories first
}
```

### Issue: Validation Errors

```javascript
try {
    jj.startTrajectory(''); // Empty task
} catch (err) {
    if (err.message.includes('Validation error')) {
        console.log('Invalid input:', err.message);
        // Use non-empty, meaningful task description
    }
}

try {
    jj.finalizeTrajectory(1.5); // Score > 1.0
} catch (err) {
    // Use score between 0.0 and 1.0
    jj.finalizeTrajectory(Math.max(0, Math.min(1, score)));
}
```

### Issue: No Patterns Discovered

```javascript
const patterns = JSON.parse(jj.getPatterns());

if (patterns.length === 0) {
    // Need more trajectories with >70% success
    // Record at least 3-5 successful trajectories
}
```

## Examples

### Example 1: Simple Learning Workflow

```javascript
const { JjWrapper } = require('agentic-jujutsu');

async function learnFromWork() {
    const jj = new JjWrapper();
    
    // Start tracking
    jj.startTrajectory('Add user profile feature');
    
    // Do work
    await jj.branchCreate('feature/user-profile');
    await jj.newCommit('Add user profile model');
    await jj.newCommit('Add profile API endpoints');
    await jj.newCommit('Add profile UI');
    
    // Record operations
    jj.addToTrajectory();
    
    // Finalize with result
    jj.finalizeTrajectory(0.85, 'Feature complete, minor styling issues remain');
    
    // Next time, get suggestions
    const suggestion = JSON.parse(jj.getSuggestion('Add settings page'));
    console.log('AI suggests:', suggestion.reasoning);
}
```

### Example 2: Multi-Agent Swarm

```javascript
async function agentSwarm(taskList) {
    const agents = taskList.map((task, i) => ({
        name: `agent-${i}`,
        jj: new JjWrapper(),
        task
    }));
    
    // All agents work concurrently (no conflicts!)
    const results = await Promise.all(agents.map(async (agent) => {
        agent.jj.startTrajectory(agent.task);
        
        // Get AI suggestion
        const suggestion = JSON.parse(agent.jj.getSuggestion(agent.task));
        
        // Execute task
        const success = await executeTask(agent, suggestion);
        
        agent.jj.addToTrajectory();
        agent.jj.finalizeTrajectory(success ? 0.9 : 0.5);
        
        return { agent: agent.name, success };
    }));
    
    console.log('Results:', results);
}
```

## Related Documentation

- **NPM Package**: https://npmjs.com/package/agentic-jujutsu
- **GitHub**: https://github.com/ruvnet/agentic-flow/tree/main/packages/agentic-jujutsu
- **Full README**: See package README.md
- **Validation Guide**: docs/VALIDATION_FIXES_v2.3.1.md
- **AgentDB Guide**: docs/AGENTDB_GUIDE.md

## Version History

- **v2.3.2** - Documentation updates
- **v2.3.1** - Validation fixes for ReasoningBank
- **v2.3.0** - Quantum-resistant security with @qudag/napi-core
- **v2.1.0** - Self-learning AI with ReasoningBank
- **v2.0.0** - Zero-dependency installation with embedded jj binary

---

**Status**: ✅ Production Ready
**License**: MIT
**Maintained**: Active
