# Agentic Orchestration Skill

> Design and implement multi-agent systems with seamless handoffs, parallel execution, and state management.

## Purpose

Modern AI applications often require multiple specialized agents working together. This skill provides patterns for orchestrating agent collaboration, managing state across agents, and handling complex multi-step workflows.

## Orchestration Patterns

### 1. Sequential Pipeline

Agents execute in order, each building on the previous:

```
┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
│Research │────▶│  Draft  │────▶│  Edit   │────▶│ Publish │
│ Agent   │     │  Agent  │     │  Agent  │     │  Agent  │
└─────────┘     └─────────┘     └─────────┘     └─────────┘
     │               │               │               │
     └───────────────┴───────────────┴───────────────┘
                    Shared State/Context
```

**Use When**: Tasks have clear stages, each requiring different expertise.

### 2. Parallel Execution

Multiple agents work simultaneously:

```
                    ┌─────────────┐
              ┌────▶│  SEO Agent  │────┐
              │     └─────────────┘    │
┌─────────┐   │     ┌─────────────┐    │     ┌─────────┐
│  Start  │───┼────▶│Image Agent  │────┼────▶│ Combine │
└─────────┘   │     └─────────────┘    │     └─────────┘
              │     ┌─────────────┐    │
              └────▶│Social Agent │────┘
                    └─────────────┘
```

**Use When**: Independent tasks can be done concurrently.

### 3. Router Pattern

A central agent delegates to specialists:

```
                         ┌─────────────┐
                         │   Router    │
                         │   Agent     │
                         └──────┬──────┘
                                │
         ┌──────────────────────┼──────────────────────┐
         │                      │                      │
    ┌────▼────┐           ┌─────▼────┐          ┌─────▼────┐
    │  Code   │           │ Content  │          │ Design   │
    │ Expert  │           │ Expert   │          │ Expert   │
    └─────────┘           └──────────┘          └──────────┘
```

**Use When**: Tasks require different expertise based on content.

### 4. Hierarchical Teams

Managers coordinate specialist teams:

```
                    ┌─────────────────┐
                    │  Project Lead   │
                    └────────┬────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
    ┌────▼────┐        ┌─────▼────┐        ┌────▼────┐
    │Dev Lead │        │Content   │        │Design   │
    └────┬────┘        │Lead      │        │Lead     │
         │             └────┬─────┘        └────┬────┘
    ┌────┴────┐        ┌────┴─────┐        ┌────┴────┐
    │Frontend │        │Writer    │        │UI       │
    │Backend  │        │Editor    │        │Graphics │
    └─────────┘        └──────────┘        └─────────┘
```

**Use When**: Complex projects need multiple coordinated teams.

## Handoff Protocols

### Context Preservation

```typescript
interface HandoffContext {
  // Task context
  taskId: string;
  originalRequest: string;
  currentState: 'research' | 'draft' | 'review' | 'complete';

  // Accumulated knowledge
  findings: string[];
  decisions: Record<string, string>;
  artifacts: string[];

  // Metadata
  startedAt: Date;
  handoffHistory: {
    from: string;
    to: string;
    timestamp: Date;
    notes: string;
  }[];
}
```

### Handoff Message Template

```markdown
## Agent Handoff: [From Agent] → [To Agent]

### Task Summary
[Brief description of what was requested]

### Work Completed
- [Completed item 1]
- [Completed item 2]

### Key Decisions Made
- [Decision 1]: [Rationale]
- [Decision 2]: [Rationale]

### Artifacts Created
- `/path/to/file1` - Description
- `/path/to/file2` - Description

### Next Steps for [To Agent]
1. [Specific action needed]
2. [Specific action needed]

### Open Questions
- [Question needing resolution]

### Context Files
- Read: `/path/to/context.md`
- Update: `/path/to/state.json`
```

## State Management

### Shared State Store

```typescript
// Using Vercel KV or similar
const state = {
  workflow: {
    id: 'wf_123',
    name: 'Blog Publishing',
    status: 'in_progress',
    currentStep: 2,
    steps: [
      { name: 'research', status: 'complete', agent: 'research-agent' },
      { name: 'draft', status: 'in_progress', agent: 'writer-agent' },
      { name: 'edit', status: 'pending', agent: 'editor-agent' },
      { name: 'publish', status: 'pending', agent: 'publisher-agent' }
    ]
  },
  context: {
    topic: 'AI Orchestration',
    keywords: ['multi-agent', 'workflows'],
    targetLength: 2000,
    research: { /* accumulated findings */ }
  },
  artifacts: {
    outline: '/drafts/outline.md',
    draft: '/drafts/draft.md'
  }
};
```

### State Transitions

```typescript
const transitions = {
  research: {
    complete: 'draft',
    blocked: 'research' // retry
  },
  draft: {
    complete: 'edit',
    needsMoreResearch: 'research'
  },
  edit: {
    approved: 'publish',
    needsRevision: 'draft'
  },
  publish: {
    complete: 'done',
    failed: 'edit'
  }
};
```

## Error Handling

### Retry Pattern

```typescript
async function executeWithRetry(
  agent: Agent,
  task: Task,
  maxRetries = 3
): Promise<Result> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await agent.execute(task);
    } catch (error) {
      if (attempt === maxRetries) {
        return escalateToHuman(task, error);
      }
      await wait(exponentialBackoff(attempt));
    }
  }
}
```

### Fallback Agents

```typescript
const agentPriority = [
  'specialist-agent',    // First choice
  'generalist-agent',    // Fallback
  'human-in-the-loop'    // Last resort
];
```

## Implementation Example

### Blog Publishing Workflow

```typescript
// Workflow definition
const blogWorkflow = {
  name: 'blog-publishing',
  steps: [
    {
      id: 'research',
      agent: 'research-agent',
      inputs: ['topic', 'keywords'],
      outputs: ['findings', 'outline']
    },
    {
      id: 'draft',
      agent: 'writer-agent',
      inputs: ['outline', 'findings', 'style-guide'],
      outputs: ['draft']
    },
    {
      id: 'seo',
      agent: 'seo-agent',
      parallel: true,
      inputs: ['draft', 'keywords'],
      outputs: ['seo-suggestions']
    },
    {
      id: 'edit',
      agent: 'editor-agent',
      inputs: ['draft', 'seo-suggestions'],
      outputs: ['final-draft']
    },
    {
      id: 'publish',
      agent: 'publisher-agent',
      inputs: ['final-draft'],
      outputs: ['published-url']
    }
  ]
};

// Execute workflow
const result = await orchestrator.run(blogWorkflow, {
  topic: 'Multi-Agent Systems',
  keywords: ['AI', 'orchestration', 'agents']
});
```

## Commands

| Command | Description |
|---------|-------------|
| `/agentic-orchestration` | Design orchestration workflow |
| `/multi-agent` | Quick multi-agent setup |
| `/workflow-status` | Check running workflows |

## Best Practices

1. **Clear Boundaries**: Each agent should have a well-defined responsibility
2. **Rich Handoffs**: Include all context needed; agents can't read minds
3. **Checkpoints**: Save state after each successful step
4. **Graceful Degradation**: Have fallback plans for failures
5. **Human Escalation**: Know when to involve humans

## Integration with Creator Intelligence

This skill powers the department system in Creator Intelligence:
- Content Department uses sequential pipelines
- Marketing Department uses parallel execution
- Project coordination uses hierarchical teams

---

*Part of [Agentic Creator OS](https://github.com/frankxai/agentic-creator-os)*
