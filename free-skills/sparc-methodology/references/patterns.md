# Orchestration patterns, TDD workflows, best practices & integration examples

> Reference for the `sparc-methodology` skill. See [`../SKILL.md`](../SKILL.md).

## Orchestration Patterns

### Pattern 1: Hierarchical Coordination

**Best for**: Complex projects with clear delegation hierarchy

```javascript
// Initialize hierarchical swarm
mcp__claude-flow__swarm_init {
  topology: "hierarchical",
  maxAgents: 12
}

// Spawn coordinator
mcp__claude-flow__agent_spawn {
  type: "coordinator",
  capabilities: ["planning", "delegation", "monitoring"]
}

// Spawn specialized workers
mcp__claude-flow__agent_spawn { type: "architect" }
mcp__claude-flow__agent_spawn { type: "coder" }
mcp__claude-flow__agent_spawn { type: "tester" }
mcp__claude-flow__agent_spawn { type: "reviewer" }
```

### Pattern 2: Mesh Coordination

**Best for**: Collaborative tasks requiring peer-to-peer communication

```javascript
mcp__claude-flow__swarm_init {
  topology: "mesh",
  strategy: "balanced",
  maxAgents: 6
}
```

### Pattern 3: Sequential Pipeline

**Best for**: Ordered workflow execution (spec → design → code → test → review)

```javascript
mcp__claude-flow__workflow_create {
  name: "development-pipeline",
  steps: [
    { mode: "researcher", task: "gather requirements" },
    { mode: "architect", task: "design system" },
    { mode: "coder", task: "implement features" },
    { mode: "tdd", task: "create tests" },
    { mode: "reviewer", task: "review code" }
  ],
  triggers: ["on_step_complete"]
}
```

### Pattern 4: Parallel Execution

**Best for**: Independent tasks that can run concurrently

```javascript
mcp__claude-flow__task_orchestrate {
  task: "build full-stack application",
  strategy: "parallel",
  dependencies: {
    backend: [],
    frontend: [],
    database: [],
    tests: ["backend", "frontend"]
  }
}
```

### Pattern 5: Adaptive Strategy

**Best for**: Dynamic workloads with changing requirements

```javascript
mcp__claude-flow__swarm_init {
  topology: "hierarchical",
  strategy: "adaptive",  // Auto-adjusts based on workload
  maxAgents: 20
}
```

---

## TDD Workflows

### Complete TDD Workflow

```javascript
// Step 1: Initialize TDD swarm
mcp__claude-flow__swarm_init {
  topology: "hierarchical",
  maxAgents: 8
}

// Step 2: Research and planning
mcp__claude-flow__sparc_mode {
  mode: "researcher",
  task_description: "research testing best practices for feature X"
}

// Step 3: Architecture design
mcp__claude-flow__sparc_mode {
  mode: "architect",
  task_description: "design testable architecture for feature X"
}

// Step 4: TDD implementation
mcp__claude-flow__sparc_mode {
  mode: "tdd",
  task_description: "implement feature X with 90% coverage",
  options: {
    coverage_target: 90,
    test_framework: "jest",
    parallel_tests: true
  }
}

// Step 5: Code review
mcp__claude-flow__sparc_mode {
  mode: "reviewer",
  task_description: "review feature X implementation",
  options: {
    test_coverage_check: true,
    security_check: true
  }
}

// Step 6: Optimization
mcp__claude-flow__sparc_mode {
  mode: "optimizer",
  task_description: "optimize feature X performance"
}
```

### Red-Green-Refactor Cycle

```javascript
// RED: Write failing test
mcp__claude-flow__sparc_mode {
  mode: "tester",
  task_description: "create failing test for shopping cart add item",
  options: { expect_failure: true }
}

// GREEN: Minimal implementation
mcp__claude-flow__sparc_mode {
  mode: "coder",
  task_description: "implement minimal code to pass test",
  options: { minimal: true }
}

// REFACTOR: Improve code quality
mcp__claude-flow__sparc_mode {
  mode: "coder",
  task_description: "refactor shopping cart implementation",
  options: { maintain_tests: true }
}
```

---

## Best Practices

### 1. Memory Integration

**Always use Memory for cross-agent coordination**:

```javascript
// Store architectural decisions
mcp__claude-flow__memory_usage {
  action: "store",
  namespace: "architecture",
  key: "api-design-v1",
  value: JSON.stringify(apiDesign),
  ttl: 86400000  // 24 hours
}

// Retrieve in subsequent agents
mcp__claude-flow__memory_usage {
  action: "retrieve",
  namespace: "architecture",
  key: "api-design-v1"
}
```

### 2. Parallel Operations

**Batch all related operations in single message**:

```javascript
// ✅ CORRECT: All operations together
[Single Message]:
  mcp__claude-flow__agent_spawn { type: "researcher" }
  mcp__claude-flow__agent_spawn { type: "coder" }
  mcp__claude-flow__agent_spawn { type: "tester" }
  TodoWrite { todos: [8-10 todos] }

// ❌ WRONG: Multiple messages
Message 1: mcp__claude-flow__agent_spawn { type: "researcher" }
Message 2: mcp__claude-flow__agent_spawn { type: "coder" }
Message 3: TodoWrite { todos: [...] }
```

### 3. Hook Integration

**Every SPARC mode should use hooks**:

```bash
# Before work
npx claude-flow@alpha hooks pre-task --description "implement auth"

# During work
npx claude-flow@alpha hooks post-edit --file "auth.js"

# After work
npx claude-flow@alpha hooks post-task --task-id "task-123"
```

### 4. Test Coverage

**Maintain minimum 90% coverage**:

- Unit tests for all functions
- Integration tests for APIs
- E2E tests for critical flows
- Edge case coverage
- Error path testing

### 5. Documentation

**Document as you build**:

- API documentation (OpenAPI)
- Architecture decision records (ADR)
- Code comments for complex logic
- README with setup instructions
- Changelog for version tracking

### 6. File Organization

**Never save to root folder**:

```
project/
├── src/           # Source code
├── tests/         # Test files
├── docs/          # Documentation
├── config/        # Configuration
├── scripts/       # Utility scripts
└── examples/      # Example code
```

---

## Integration Examples

### Example 1: Full-Stack Development

```javascript
[Single Message - Parallel Agent Execution]:

// Initialize swarm
mcp__claude-flow__swarm_init {
  topology: "hierarchical",
  maxAgents: 10
}

// Architecture phase
mcp__claude-flow__sparc_mode {
  mode: "architect",
  task_description: "design REST API with authentication",
  options: { memory_enabled: true }
}

// Research phase
mcp__claude-flow__sparc_mode {
  mode: "researcher",
  task_description: "research authentication best practices"
}

// Implementation phase
mcp__claude-flow__sparc_mode {
  mode: "coder",
  task_description: "implement Express API with JWT auth",
  options: { test_driven: true }
}

// Testing phase
mcp__claude-flow__sparc_mode {
  mode: "tdd",
  task_description: "comprehensive API tests",
  options: { coverage_target: 90 }
}

// Review phase
mcp__claude-flow__sparc_mode {
  mode: "reviewer",
  task_description: "security and performance review",
  options: { security_check: true }
}

// Batch todos
TodoWrite {
  todos: [
    {content: "Design API schema", status: "completed"},
    {content: "Research JWT implementation", status: "completed"},
    {content: "Implement authentication", status: "in_progress"},
    {content: "Write API tests", status: "pending"},
    {content: "Security review", status: "pending"},
    {content: "Performance optimization", status: "pending"},
    {content: "API documentation", status: "pending"},
    {content: "Deployment setup", status: "pending"}
  ]
}
```

### Example 2: Research-Driven Innovation

```javascript
// Research phase
mcp__claude-flow__sparc_mode {
  mode: "researcher",
  task_description: "research AI-powered search implementations",
  options: {
    depth: "comprehensive",
    sources: ["academic", "industry"]
  }
}

// Innovation phase
mcp__claude-flow__sparc_mode {
  mode: "innovator",
  task_description: "propose novel search algorithm",
  options: { memory_enabled: true }
}

// Architecture phase
mcp__claude-flow__sparc_mode {
  mode: "architect",
  task_description: "design scalable search system"
}

// Implementation phase
mcp__claude-flow__sparc_mode {
  mode: "coder",
  task_description: "implement search algorithm",
  options: { test_driven: true }
}

// Documentation phase
mcp__claude-flow__sparc_mode {
  mode: "documenter",
  task_description: "document search system architecture and API"
}
```

### Example 3: Legacy Code Refactoring

```javascript
// Analysis phase
mcp__claude-flow__sparc_mode {
  mode: "analyzer",
  task_description: "analyze legacy codebase dependencies"
}

// Planning phase
mcp__claude-flow__sparc_mode {
  mode: "orchestrator",
  task_description: "plan incremental refactoring strategy"
}

// Testing phase (create safety net)
mcp__claude-flow__sparc_mode {
  mode: "tester",
  task_description: "create comprehensive test suite for legacy code",
  options: { coverage_target: 80 }
}

// Refactoring phase
mcp__claude-flow__sparc_mode {
  mode: "coder",
  task_description: "refactor module X with modern patterns",
  options: { maintain_tests: true }
}

// Review phase
mcp__claude-flow__sparc_mode {
  mode: "reviewer",
  task_description: "validate refactoring maintains functionality"
}
```

---

## Common Workflows

### Workflow 1: Feature Development

```bash
# Step 1: Research and planning
npx claude-flow sparc run researcher "authentication patterns"

# Step 2: Architecture design
npx claude-flow sparc run architect "design auth system"

# Step 3: TDD implementation
npx claude-flow sparc tdd "user authentication feature"

# Step 4: Code review
npx claude-flow sparc run reviewer "review auth implementation"

# Step 5: Documentation
npx claude-flow sparc run documenter "document auth API"
```

### Workflow 2: Bug Investigation

```bash
# Step 1: Analyze issue
npx claude-flow sparc run analyzer "investigate bug #456"

# Step 2: Debug systematically
npx claude-flow sparc run debugger "fix memory leak in service X"

# Step 3: Create tests
npx claude-flow sparc run tester "regression tests for bug #456"

# Step 4: Review fix
npx claude-flow sparc run reviewer "validate bug fix"
```

### Workflow 3: Performance Optimization

```bash
# Step 1: Profile performance
npx claude-flow sparc run analyzer "profile API response times"

# Step 2: Identify bottlenecks
npx claude-flow sparc run optimizer "optimize database queries"

# Step 3: Implement improvements
npx claude-flow sparc run coder "implement caching layer"

# Step 4: Benchmark results
npx claude-flow sparc run tester "performance benchmarks"
```

### Workflow 4: Complete Pipeline

```bash
# Execute full development pipeline
npx claude-flow sparc pipeline "e-commerce checkout feature"

# This automatically runs:
# 1. researcher - Gather requirements
# 2. architect - Design system
# 3. coder - Implement features
# 4. tdd - Create comprehensive tests
# 5. reviewer - Code quality review
# 6. optimizer - Performance tuning
# 7. documenter - Documentation
```

---
