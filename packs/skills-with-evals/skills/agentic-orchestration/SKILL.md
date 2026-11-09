---
name: agentic-orchestration
description: Patterns for multi-agent coordination, task decomposition, handoffs, and workflow orchestration. Use when designing or debugging agent systems, splitting a large task across sub-agents, defining handoff contracts, or choosing an orchestration topology.
version: 1.0.0
last_updated: 2025-12-19
external_version: "Claude Agent SDK 2025"
changelog: |
  - 1.0.0: Initial skill with orchestration patterns from Claude Agent SDK and FrankX system
---

# Agentic Orchestration Patterns

This skill covers patterns for coordinating multiple AI agents, decomposing complex tasks, managing handoffs, and building robust agent workflows.

---

## Orchestration Fundamentals

### Agent Hierarchy Model
```
┌─────────────────────────────────────────────────────┐
│              ORCHESTRATOR AGENT                      │
│  (Strategic coordination, task routing, synthesis)   │
├─────────────────────────────────────────────────────┤
│                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────┐ │
│  │  Specialist  │  │  Specialist  │  │ Specialist │ │
│  │   Agent A    │  │   Agent B    │  │  Agent C   │ │
│  │  (Domain 1)  │  │  (Domain 2)  │  │ (Domain 3) │ │
│  └──────────────┘  └──────────────┘  └────────────┘ │
│                                                      │
└─────────────────────────────────────────────────────┘
```

### Core Principles

1. **Single Responsibility**: Each agent has one clear domain
2. **Explicit Handoffs**: Clear protocols for transferring work
3. **Context Preservation**: State travels with the task
4. **Graceful Degradation**: System works if agents fail
5. **Observable Execution**: Can see what each agent is doing

---

## Task Decomposition Patterns

### Pattern 1: Hierarchical Decomposition
```
Complex Task: "Build a feature for user authentication"

Decomposed:
├── Research Phase (Research Agent)
│   ├── Analyze existing auth patterns in codebase
│   ├── Identify dependencies and constraints
│   └── Document findings
│
├── Design Phase (Architect Agent)
│   ├── Design auth flow
│   ├── Define API contracts
│   └── Create component structure
│
├── Implementation Phase (Developer Agent)
│   ├── Implement backend auth logic
│   ├── Build frontend components
│   └── Add error handling
│
├── Testing Phase (QA Agent)
│   ├── Write unit tests
│   ├── Integration tests
│   └── Security review
│
└── Documentation Phase (Docs Agent)
    ├── API documentation
    ├── User guide
    └── Developer notes
```

### Pattern 2: Parallel Decomposition
```
Task: "Analyze codebase and suggest improvements"

Parallel Execution:
┌─────────────────────────────────────────────────────┐
│                    ORCHESTRATOR                      │
│                Spawns parallel agents                │
└───────────┬─────────────┬─────────────┬────────────┘
            │             │             │
            ▼             ▼             ▼
    ┌───────────┐  ┌───────────┐  ┌───────────┐
    │ Security  │  │Performance│  │   Code    │
    │  Analyst  │  │  Analyst  │  │  Quality  │
    └─────┬─────┘  └─────┬─────┘  └─────┬─────┘
          │              │              │
          ▼              ▼              ▼
    [Security     [Performance   [Quality
     Report]       Report]        Report]
          │              │              │
          └──────────────┼──────────────┘
                         │
                         ▼
              ┌─────────────────┐
              │   ORCHESTRATOR  │
              │    Synthesizes  │
              └─────────────────┘
```

### Pattern 3: Iterative Refinement
```
Task: "Write a technical blog post"

Iteration Loop:
1. Researcher → Gathers information
2. Writer → Creates draft
3. Editor → Reviews and critiques
4. Writer → Revises based on feedback
5. Editor → Approves or requests more changes
6. Repeat 4-5 until quality threshold met
7. Publisher → Formats and publishes
```

---

## Handoff Patterns

### Pattern 1: Explicit Handoff Protocol
```typescript
interface TaskHandoff {
  from_agent: string;
  to_agent: string;
  task_id: string;
  context: {
    original_request: string;
    work_completed: string[];
    current_state: any;
    next_steps: string[];
  };
  artifacts: {
    files_created: string[];
    files_modified: string[];
    decisions_made: Decision[];
  };
}

// Example handoff
const handoff: TaskHandoff = {
  from_agent: "ArchitectAgent",
  to_agent: "DeveloperAgent",
  task_id: "auth-feature-123",
  context: {
    original_request: "Implement user authentication",
    work_completed: [
      "Analyzed existing patterns",
      "Designed auth flow",
      "Created API contracts"
    ],
    current_state: {
      design_doc: "/docs/auth-design.md",
      api_spec: "/specs/auth-api.yaml"
    },
    next_steps: [
      "Implement AuthService class",
      "Create login/logout endpoints",
      "Build session management"
    ]
  },
  artifacts: {
    files_created: ["/docs/auth-design.md", "/specs/auth-api.yaml"],
    files_modified: [],
    decisions_made: [
      { decision: "Use JWT for tokens", rationale: "Stateless, scalable" },
      { decision: "Redis for session store", rationale: "Fast, supports TTL" }
    ]
  }
};
```

### Pattern 2: Capability-Based Routing
```typescript
const agentCapabilities = {
  ResearchAgent: ["search", "analyze", "summarize", "compare"],
  ArchitectAgent: ["design", "plan", "structure", "evaluate"],
  DeveloperAgent: ["implement", "refactor", "debug", "optimize"],
  ReviewerAgent: ["review", "critique", "validate", "approve"],
  DocsAgent: ["document", "explain", "format", "publish"]
};

function routeTask(task: string): string {
  const taskVerb = extractVerb(task);

  for (const [agent, capabilities] of Object.entries(agentCapabilities)) {
    if (capabilities.includes(taskVerb)) {
      return agent;
    }
  }

  return "GeneralAgent"; // Fallback
}
```

### Pattern 3: Context Window Management
```typescript
// Problem: Context grows as agents work
// Solution: Summarize and compress at handoffs

interface CompressedContext {
  essential: {
    task_goal: string;
    key_decisions: string[];
    current_blockers: string[];
  };
  reference: {
    file_paths: string[];      // Can be re-read if needed
    doc_links: string[];       // External references
  };
  discarded: {
    exploration_notes: string; // Summarized, not full content
    rejected_approaches: string[];
  };
}

function compressForHandoff(fullContext: any): CompressedContext {
  return {
    essential: extractEssentials(fullContext),
    reference: extractReferences(fullContext),
    discarded: summarizeDiscarded(fullContext)
  };
}
```

---


## Reference


The full detail lives in `references/` and loads only when needed:

- [`references/advanced-patterns.md`](references/advanced-patterns.md) — coordination, error handling, observability & system application patterns.

---

## Anti-Patterns to Avoid

### ❌ God Agent
One agent that does everything - no specialization, no delegation.

### ❌ Agent Explosion
Too many tiny agents with overlapping responsibilities.

### ❌ Lost Context
Handoffs that don't preserve essential information.

### ❌ Infinite Loops
Agents that keep handing work back and forth.

### ❌ Silent Failures
Agents that fail without proper error reporting.

### ❌ Unobservable Execution
Can't see what agents are doing or why.

---

*Good orchestration is invisible - the system should feel like one coherent intelligence, not a committee of bickering agents.*
