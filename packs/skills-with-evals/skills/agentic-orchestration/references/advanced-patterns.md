# Coordination, error handling, observability & system application patterns

> Reference for the `agentic-orchestration` skill. See [`../SKILL.md`](../SKILL.md).

## Coordination Patterns

### Pattern 1: Conductor Model
```
One orchestrator coordinates all activity:

┌─────────────────────────────────────────────┐
│             CONDUCTOR AGENT                  │
│  - Receives initial request                  │
│  - Decomposes into subtasks                  │
│  - Assigns to specialist agents              │
│  - Monitors progress                         │
│  - Synthesizes results                       │
│  - Handles failures and retries              │
└─────────────────────────────────────────────┘

Best for: Complex projects with many dependencies
Example: FrankX Starlight Orchestrator
```

### Pattern 2: Pipeline Model
```
Sequential processing through specialized stages:

Request → [Agent A] → [Agent B] → [Agent C] → Result
             │            │            │
           Stage 1     Stage 2      Stage 3
          Research     Design      Execute

Best for: Well-defined workflows with clear stages
Example: Content creation pipeline
```

### Pattern 3: Swarm Model
```
Multiple agents work in parallel, coordinating peer-to-peer:

     ┌────────┐
     │Agent A │←──────────────────┐
     └───┬────┘                   │
         │                        │
    ┌────▼────┐              ┌────┴───┐
    │ Agent B │◄────────────►│Agent D │
    └────┬────┘              └────┬───┘
         │                        │
     ┌───▼────┐                   │
     │Agent C │◄──────────────────┘
     └────────┘

Best for: Exploratory tasks, parallel research
Example: Codebase analysis from multiple angles
```

### Pattern 4: Blackboard Model
```
Shared workspace that all agents read/write:

┌─────────────────────────────────────────┐
│             BLACKBOARD                   │
│  ┌─────────────────────────────────┐    │
│  │ Current State: { ... }          │    │
│  │ Hypotheses: [ ... ]             │    │
│  │ Evidence: [ ... ]               │    │
│  │ Conclusions: [ ... ]            │    │
│  └─────────────────────────────────┘    │
└─────────────────────────────────────────┘
        │           │           │
   ┌────▼───┐  ┌────▼───┐  ┌────▼───┐
   │Agent A │  │Agent B │  │Agent C │
   │ reads  │  │ reads  │  │ reads  │
   │ writes │  │ writes │  │ writes │
   └────────┘  └────────┘  └────────┘

Best for: Complex problem-solving with evolving understanding
Example: Debugging a complex system issue
```

---

## Error Handling & Recovery

### Pattern 1: Retry with Backoff
```typescript
async function executeWithRetry(agent, task, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await agent.execute(task);
    } catch (error) {
      if (attempt === maxRetries) throw error;

      const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
      console.log(`Attempt ${attempt} failed, retrying in ${delay}ms`);
      await sleep(delay);
    }
  }
}
```

### Pattern 2: Fallback Agents
```typescript
const agentFallbacks = {
  "SpecialistCodeReviewer": ["GeneralCodeReviewer", "SeniorDeveloper"],
  "SecurityAnalyst": ["GeneralAnalyst", "SeniorDeveloper"],
  "PerformanceExpert": ["GeneralAnalyst", "SeniorDeveloper"]
};

async function executeWithFallback(primaryAgent, task) {
  try {
    return await primaryAgent.execute(task);
  } catch (error) {
    const fallbacks = agentFallbacks[primaryAgent.name] || [];

    for (const fallbackName of fallbacks) {
      try {
        console.log(`Primary failed, trying ${fallbackName}`);
        return await getAgent(fallbackName).execute(task);
      } catch (fallbackError) {
        continue;
      }
    }

    throw new Error(`All agents failed for task: ${task.id}`);
  }
}
```

### Pattern 3: Checkpoint & Resume
```typescript
interface Checkpoint {
  task_id: string;
  completed_steps: string[];
  current_step: string;
  state: any;
  timestamp: Date;
}

async function executeWithCheckpoints(task, steps) {
  const checkpoint = await loadCheckpoint(task.id);
  const startIndex = checkpoint
    ? steps.indexOf(checkpoint.current_step)
    : 0;

  for (let i = startIndex; i < steps.length; i++) {
    const step = steps[i];

    try {
      await executeStep(step, task);
      await saveCheckpoint({
        task_id: task.id,
        completed_steps: steps.slice(0, i + 1),
        current_step: steps[i + 1] || "complete",
        state: task.state,
        timestamp: new Date()
      });
    } catch (error) {
      // Checkpoint is saved, can resume from here
      throw error;
    }
  }
}
```

---

## Observability Patterns

### Pattern 1: Structured Logging
```typescript
function agentLog(agent, event, details) {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    agent: agent.name,
    task_id: agent.currentTask?.id,
    event: event,
    details: details,
    duration_ms: details.duration,
    tokens_used: details.tokens
  }));
}

// Usage
agentLog(agent, "TASK_START", { task: task.description });
agentLog(agent, "TOOL_CALL", { tool: "read_file", path: "/src/index.ts" });
agentLog(agent, "TASK_COMPLETE", { result: "success", duration: 5230 });
```

### Pattern 2: Progress Tracking
```typescript
interface TaskProgress {
  task_id: string;
  total_steps: number;
  completed_steps: number;
  current_step: string;
  estimated_remaining: number; // seconds
  agents_involved: string[];
}

// Expose progress for UI/monitoring
function getProgress(task): TaskProgress {
  return {
    task_id: task.id,
    total_steps: task.steps.length,
    completed_steps: task.completedSteps.length,
    current_step: task.currentStep?.description || "idle",
    estimated_remaining: estimateRemaining(task),
    agents_involved: task.agentHistory
  };
}
```

### Pattern 3: Decision Audit Trail
```typescript
interface Decision {
  timestamp: Date;
  agent: string;
  decision: string;
  options_considered: string[];
  rationale: string;
  confidence: number; // 0-1
  reversible: boolean;
}

// Track all significant decisions
const decisionLog: Decision[] = [];

function recordDecision(agent, decision, options, rationale, confidence) {
  decisionLog.push({
    timestamp: new Date(),
    agent: agent.name,
    decision,
    options_considered: options,
    rationale,
    confidence,
    reversible: true
  });
}
```

---

## FrankX System Application

### Starlight Orchestrator Pattern
```
The FrankX system uses weighted synthesis:

┌────────────────────────────────────────────────────┐
│              STARLIGHT ORCHESTRATOR                 │
│        (Meta-intelligence coordinator)              │
├────────────────────────────────────────────────────┤
│                                                     │
│  Specialist Domains:                                │
│  ├── Starlight Architect   (Systems design)        │
│  ├── Creation Engine       (Content/product)       │
│  ├── Visionary        (Future strategy)       │
│  └── Sonic Engineer        (Music/audio)           │
│                                                     │
│  Synthesis Process:                                 │
│  1. Each agent provides perspective                 │
│  2. Orchestrator weights by domain relevance       │
│  3. Conflicts are explicitly surfaced              │
│  4. Final recommendation synthesizes all views     │
│                                                     │
└────────────────────────────────────────────────────┘
```

### Agent Team Patterns in FrankX

**Book Writing Team:**
- Master Story Architect → Design
- Genre Writer → Draft
- Editor → Review cycles
- Sensitivity Reader → Final check
- Continuity Guardian → Consistency

**Arcanea Development Team:**
- Architect → Design
- Frontend Specialist → UI
- Backend Specialist → API
- AI Specialist → Luminor integration
- DevOps → Deployment

---
