# Research / development / testing / analysis swarm patterns & advanced techniques

> Reference for the `swarm-advanced` skill. See [`../SKILL.md`](../SKILL.md).

## Pattern 1: Research Swarm

### Purpose
Deep research through parallel information gathering, analysis, and synthesis.

### Architecture
```javascript
// Initialize research swarm
mcp__claude-flow__swarm_init({
  "topology": "mesh",
  "maxAgents": 6,
  "strategy": "adaptive"
})

// Spawn research team
const researchAgents = [
  {
    type: "researcher",
    name: "Web Researcher",
    capabilities: ["web-search", "content-extraction", "source-validation"]
  },
  {
    type: "researcher",
    name: "Academic Researcher",
    capabilities: ["paper-analysis", "citation-tracking", "literature-review"]
  },
  {
    type: "analyst",
    name: "Data Analyst",
    capabilities: ["data-processing", "statistical-analysis", "visualization"]
  },
  {
    type: "analyst",
    name: "Pattern Analyzer",
    capabilities: ["trend-detection", "correlation-analysis", "outlier-detection"]
  },
  {
    type: "documenter",
    name: "Report Writer",
    capabilities: ["synthesis", "technical-writing", "formatting"]
  }
]

// Spawn all agents
researchAgents.forEach(agent => {
  mcp__claude-flow__agent_spawn({
    type: agent.type,
    name: agent.name,
    capabilities: agent.capabilities
  })
})
```

### Research Workflow

#### Phase 1: Information Gathering
```javascript
// Parallel information collection
mcp__claude-flow__parallel_execute({
  "tasks": [
    {
      "id": "web-search",
      "command": "search recent publications and articles"
    },
    {
      "id": "academic-search",
      "command": "search academic databases and papers"
    },
    {
      "id": "data-collection",
      "command": "gather relevant datasets and statistics"
    },
    {
      "id": "expert-search",
      "command": "identify domain experts and thought leaders"
    }
  ]
})

// Store research findings in memory
mcp__claude-flow__memory_usage({
  "action": "store",
  "key": "research-findings-" + Date.now(),
  "value": JSON.stringify(findings),
  "namespace": "research",
  "ttl": 604800 // 7 days
})
```

#### Phase 2: Analysis and Validation
```javascript
// Pattern recognition in findings
mcp__claude-flow__pattern_recognize({
  "data": researchData,
  "patterns": ["trend", "correlation", "outlier", "emerging-pattern"]
})

// Cognitive analysis
mcp__claude-flow__cognitive_analyze({
  "behavior": "research-synthesis"
})

// Quality assessment
mcp__claude-flow__quality_assess({
  "target": "research-sources",
  "criteria": ["credibility", "relevance", "recency", "authority"]
})

// Cross-reference validation
mcp__claude-flow__neural_patterns({
  "action": "analyze",
  "operation": "fact-checking",
  "metadata": { "sources": sourcesArray }
})
```

#### Phase 3: Knowledge Management
```javascript
// Search existing knowledge base
mcp__claude-flow__memory_search({
  "pattern": "topic X",
  "namespace": "research",
  "limit": 20
})

// Create knowledge graph connections
mcp__claude-flow__neural_patterns({
  "action": "learn",
  "operation": "knowledge-graph",
  "metadata": {
    "topic": "X",
    "connections": relatedTopics,
    "depth": 3
  }
})

// Store connections for future use
mcp__claude-flow__memory_usage({
  "action": "store",
  "key": "knowledge-graph-X",
  "value": JSON.stringify(knowledgeGraph),
  "namespace": "research/graphs",
  "ttl": 2592000 // 30 days
})
```

#### Phase 4: Report Generation
```javascript
// Orchestrate report generation
mcp__claude-flow__task_orchestrate({
  "task": "generate comprehensive research report",
  "strategy": "sequential",
  "priority": "high",
  "dependencies": ["gather", "analyze", "validate", "synthesize"]
})

// Monitor research progress
mcp__claude-flow__swarm_status({
  "swarmId": "research-swarm"
})

// Generate final report
mcp__claude-flow__workflow_execute({
  "workflowId": "research-report-generation",
  "params": {
    "findings": findings,
    "format": "comprehensive",
    "sections": ["executive-summary", "methodology", "findings", "analysis", "conclusions", "references"]
  }
})
```

### CLI Fallback
```bash
# Quick research swarm
npx claude-flow swarm "research AI trends in 2025" \
  --strategy research \
  --mode distributed \
  --max-agents 6 \
  --parallel \
  --output research-report.md
```

## Pattern 2: Development Swarm

### Purpose
Full-stack development through coordinated specialist agents.

### Architecture
```javascript
// Initialize development swarm with hierarchy
mcp__claude-flow__swarm_init({
  "topology": "hierarchical",
  "maxAgents": 8,
  "strategy": "balanced"
})

// Spawn development team
const devTeam = [
  { type: "architect", name: "System Architect", role: "coordinator" },
  { type: "coder", name: "Backend Developer", capabilities: ["node", "api", "database"] },
  { type: "coder", name: "Frontend Developer", capabilities: ["react", "ui", "ux"] },
  { type: "coder", name: "Database Engineer", capabilities: ["sql", "nosql", "optimization"] },
  { type: "tester", name: "QA Engineer", capabilities: ["unit", "integration", "e2e"] },
  { type: "reviewer", name: "Code Reviewer", capabilities: ["security", "performance", "best-practices"] },
  { type: "documenter", name: "Technical Writer", capabilities: ["api-docs", "guides", "tutorials"] },
  { type: "monitor", name: "DevOps Engineer", capabilities: ["ci-cd", "deployment", "monitoring"] }
]

// Spawn all team members
devTeam.forEach(member => {
  mcp__claude-flow__agent_spawn({
    type: member.type,
    name: member.name,
    capabilities: member.capabilities,
    swarmId: "dev-swarm"
  })
})
```

### Development Workflow

#### Phase 1: Architecture and Design
```javascript
// System architecture design
mcp__claude-flow__task_orchestrate({
  "task": "design system architecture for REST API",
  "strategy": "sequential",
  "priority": "critical",
  "assignTo": "System Architect"
})

// Store architecture decisions
mcp__claude-flow__memory_usage({
  "action": "store",
  "key": "architecture-decisions",
  "value": JSON.stringify(architectureDoc),
  "namespace": "development/design"
})
```

#### Phase 2: Parallel Implementation
```javascript
// Parallel development tasks
mcp__claude-flow__parallel_execute({
  "tasks": [
    {
      "id": "backend-api",
      "command": "implement REST API endpoints",
      "assignTo": "Backend Developer"
    },
    {
      "id": "frontend-ui",
      "command": "build user interface components",
      "assignTo": "Frontend Developer"
    },
    {
      "id": "database-schema",
      "command": "design and implement database schema",
      "assignTo": "Database Engineer"
    },
    {
      "id": "api-documentation",
      "command": "create API documentation",
      "assignTo": "Technical Writer"
    }
  ]
})

// Monitor development progress
mcp__claude-flow__swarm_monitor({
  "swarmId": "dev-swarm",
  "interval": 5000
})
```

#### Phase 3: Testing and Validation
```javascript
// Comprehensive testing
mcp__claude-flow__batch_process({
  "items": [
    { type: "unit", target: "all-modules" },
    { type: "integration", target: "api-endpoints" },
    { type: "e2e", target: "user-flows" },
    { type: "performance", target: "critical-paths" }
  ],
  "operation": "execute-tests"
})

// Quality assessment
mcp__claude-flow__quality_assess({
  "target": "codebase",
  "criteria": ["coverage", "complexity", "maintainability", "security"]
})
```

#### Phase 4: Review and Deployment
```javascript
// Code review workflow
mcp__claude-flow__workflow_execute({
  "workflowId": "code-review-process",
  "params": {
    "reviewers": ["Code Reviewer"],
    "criteria": ["security", "performance", "best-practices"]
  }
})

// CI/CD pipeline
mcp__claude-flow__pipeline_create({
  "config": {
    "stages": ["build", "test", "security-scan", "deploy"],
    "environment": "production"
  }
})
```

### CLI Fallback
```bash
# Quick development swarm
npx claude-flow swarm "build REST API with authentication" \
  --strategy development \
  --mode hierarchical \
  --monitor \
  --output sqlite
```

## Pattern 3: Testing Swarm

### Purpose
Comprehensive quality assurance through distributed testing.

### Architecture
```javascript
// Initialize testing swarm with star topology
mcp__claude-flow__swarm_init({
  "topology": "star",
  "maxAgents": 7,
  "strategy": "parallel"
})

// Spawn testing team
const testingTeam = [
  {
    type: "tester",
    name: "Unit Test Coordinator",
    capabilities: ["unit-testing", "mocking", "coverage", "tdd"]
  },
  {
    type: "tester",
    name: "Integration Tester",
    capabilities: ["integration", "api-testing", "contract-testing"]
  },
  {
    type: "tester",
    name: "E2E Tester",
    capabilities: ["e2e", "ui-testing", "user-flows", "selenium"]
  },
  {
    type: "tester",
    name: "Performance Tester",
    capabilities: ["load-testing", "stress-testing", "benchmarking"]
  },
  {
    type: "monitor",
    name: "Security Tester",
    capabilities: ["security-testing", "penetration-testing", "vulnerability-scanning"]
  },
  {
    type: "analyst",
    name: "Test Analyst",
    capabilities: ["coverage-analysis", "test-optimization", "reporting"]
  },
  {
    type: "documenter",
    name: "Test Documenter",
    capabilities: ["test-documentation", "test-plans", "reports"]
  }
]

// Spawn all testers
testingTeam.forEach(tester => {
  mcp__claude-flow__agent_spawn({
    type: tester.type,
    name: tester.name,
    capabilities: tester.capabilities,
    swarmId: "testing-swarm"
  })
})
```

### Testing Workflow

#### Phase 1: Test Planning
```javascript
// Analyze test coverage requirements
mcp__claude-flow__quality_assess({
  "target": "test-coverage",
  "criteria": [
    "line-coverage",
    "branch-coverage",
    "function-coverage",
    "edge-cases"
  ]
})

// Identify test scenarios
mcp__claude-flow__pattern_recognize({
  "data": testScenarios,
  "patterns": [
    "edge-case",
    "boundary-condition",
    "error-path",
    "happy-path"
  ]
})

// Store test plan
mcp__claude-flow__memory_usage({
  "action": "store",
  "key": "test-plan-" + Date.now(),
  "value": JSON.stringify(testPlan),
  "namespace": "testing/plans"
})
```

#### Phase 2: Parallel Test Execution
```javascript
// Execute all test suites in parallel
mcp__claude-flow__parallel_execute({
  "tasks": [
    {
      "id": "unit-tests",
      "command": "npm run test:unit",
      "assignTo": "Unit Test Coordinator"
    },
    {
      "id": "integration-tests",
      "command": "npm run test:integration",
      "assignTo": "Integration Tester"
    },
    {
      "id": "e2e-tests",
      "command": "npm run test:e2e",
      "assignTo": "E2E Tester"
    },
    {
      "id": "performance-tests",
      "command": "npm run test:performance",
      "assignTo": "Performance Tester"
    },
    {
      "id": "security-tests",
      "command": "npm run test:security",
      "assignTo": "Security Tester"
    }
  ]
})

// Batch process test suites
mcp__claude-flow__batch_process({
  "items": testSuites,
  "operation": "execute-test-suite"
})
```

#### Phase 3: Performance and Security
```javascript
// Run performance benchmarks
mcp__claude-flow__benchmark_run({
  "suite": "comprehensive-performance"
})

// Bottleneck analysis
mcp__claude-flow__bottleneck_analyze({
  "component": "application",
  "metrics": ["response-time", "throughput", "memory", "cpu"]
})

// Security scanning
mcp__claude-flow__security_scan({
  "target": "application",
  "depth": "comprehensive"
})

// Vulnerability analysis
mcp__claude-flow__error_analysis({
  "logs": securityScanLogs
})
```

#### Phase 4: Monitoring and Reporting
```javascript
// Real-time test monitoring
mcp__claude-flow__swarm_monitor({
  "swarmId": "testing-swarm",
  "interval": 2000
})

// Generate comprehensive test report
mcp__claude-flow__performance_report({
  "format": "detailed",
  "timeframe": "current-run"
})

// Get test results
mcp__claude-flow__task_results({
  "taskId": "test-execution-001"
})

// Trend analysis
mcp__claude-flow__trend_analysis({
  "metric": "test-coverage",
  "period": "30d"
})
```

### CLI Fallback
```bash
# Quick testing swarm
npx claude-flow swarm "test application comprehensively" \
  --strategy testing \
  --mode star \
  --parallel \
  --timeout 600
```

## Pattern 4: Analysis Swarm

### Purpose
Deep code and system analysis through specialized analyzers.

### Architecture
```javascript
// Initialize analysis swarm
mcp__claude-flow__swarm_init({
  "topology": "mesh",
  "maxAgents": 5,
  "strategy": "adaptive"
})

// Spawn analysis specialists
const analysisTeam = [
  {
    type: "analyst",
    name: "Code Analyzer",
    capabilities: ["static-analysis", "complexity-analysis", "dead-code-detection"]
  },
  {
    type: "analyst",
    name: "Security Analyzer",
    capabilities: ["security-scan", "vulnerability-detection", "dependency-audit"]
  },
  {
    type: "analyst",
    name: "Performance Analyzer",
    capabilities: ["profiling", "bottleneck-detection", "optimization"]
  },
  {
    type: "analyst",
    name: "Architecture Analyzer",
    capabilities: ["dependency-analysis", "coupling-detection", "modularity-assessment"]
  },
  {
    type: "documenter",
    name: "Analysis Reporter",
    capabilities: ["reporting", "visualization", "recommendations"]
  }
]

// Spawn all analysts
analysisTeam.forEach(analyst => {
  mcp__claude-flow__agent_spawn({
    type: analyst.type,
    name: analyst.name,
    capabilities: analyst.capabilities
  })
})
```

### Analysis Workflow
```javascript
// Parallel analysis execution
mcp__claude-flow__parallel_execute({
  "tasks": [
    { "id": "analyze-code", "command": "analyze codebase structure and quality" },
    { "id": "analyze-security", "command": "scan for security vulnerabilities" },
    { "id": "analyze-performance", "command": "identify performance bottlenecks" },
    { "id": "analyze-architecture", "command": "assess architectural patterns" }
  ]
})

// Generate comprehensive analysis report
mcp__claude-flow__performance_report({
  "format": "detailed",
  "timeframe": "current"
})

// Cost analysis
mcp__claude-flow__cost_analysis({
  "timeframe": "30d"
})
```

## Advanced Techniques

### Error Handling and Fault Tolerance

```javascript
// Setup fault tolerance for all agents
mcp__claude-flow__daa_fault_tolerance({
  "agentId": "all",
  "strategy": "auto-recovery"
})

// Error handling pattern
try {
  await mcp__claude-flow__task_orchestrate({
    "task": "complex operation",
    "strategy": "parallel",
    "priority": "high"
  })
} catch (error) {
  // Check swarm health
  const status = await mcp__claude-flow__swarm_status({})

  // Analyze error patterns
  await mcp__claude-flow__error_analysis({
    "logs": [error.message]
  })

  // Auto-recovery attempt
  if (status.healthy) {
    await mcp__claude-flow__task_orchestrate({
      "task": "retry failed operation",
      "strategy": "sequential"
    })
  }
}
```

### Memory and State Management

```javascript
// Cross-session persistence
mcp__claude-flow__memory_persist({
  "sessionId": "swarm-session-001"
})

// Namespace management for different swarms
mcp__claude-flow__memory_namespace({
  "namespace": "research-swarm",
  "action": "create"
})

// Create state snapshot
mcp__claude-flow__state_snapshot({
  "name": "development-checkpoint-1"
})

// Restore from snapshot if needed
mcp__claude-flow__context_restore({
  "snapshotId": "development-checkpoint-1"
})

// Backup memory stores
mcp__claude-flow__memory_backup({
  "path": "/workspaces/claude-code-flow/backups/swarm-memory.json"
})
```

### Neural Pattern Learning

```javascript
// Train neural patterns from successful workflows
mcp__claude-flow__neural_train({
  "pattern_type": "coordination",
  "training_data": JSON.stringify(successfulWorkflows),
  "epochs": 50
})

// Adaptive learning from experience
mcp__claude-flow__learning_adapt({
  "experience": {
    "workflow": "research-to-report",
    "success": true,
    "duration": 3600,
    "quality": 0.95
  }
})

// Pattern recognition for optimization
mcp__claude-flow__pattern_recognize({
  "data": workflowMetrics,
  "patterns": ["bottleneck", "optimization-opportunity", "efficiency-gain"]
})
```

### Workflow Automation

```javascript
// Create reusable workflow
mcp__claude-flow__workflow_create({
  "name": "full-stack-development",
  "steps": [
    { "phase": "design", "agents": ["architect"] },
    { "phase": "implement", "agents": ["backend-dev", "frontend-dev"], "parallel": true },
    { "phase": "test", "agents": ["tester", "security-tester"], "parallel": true },
    { "phase": "review", "agents": ["reviewer"] },
    { "phase": "deploy", "agents": ["devops"] }
  ],
  "triggers": ["on-commit", "scheduled-daily"]
})

// Setup automation rules
mcp__claude-flow__automation_setup({
  "rules": [
    {
      "trigger": "file-changed",
      "pattern": "*.js",
      "action": "run-tests"
    },
    {
      "trigger": "PR-created",
      "action": "code-review-swarm"
    }
  ]
})

// Event-driven triggers
mcp__claude-flow__trigger_setup({
  "events": ["code-commit", "PR-merge", "deployment"],
  "actions": ["test", "analyze", "document"]
})
```

### Performance Optimization

```javascript
// Topology optimization
mcp__claude-flow__topology_optimize({
  "swarmId": "current-swarm"
})

// Load balancing
mcp__claude-flow__load_balance({
  "swarmId": "development-swarm",
  "tasks": taskQueue
})

// Agent coordination sync
mcp__claude-flow__coordination_sync({
  "swarmId": "development-swarm"
})

// Auto-scaling
mcp__claude-flow__swarm_scale({
  "swarmId": "development-swarm",
  "targetSize": 12
})
```

### Monitoring and Metrics

```javascript
// Real-time swarm monitoring
mcp__claude-flow__swarm_monitor({
  "swarmId": "active-swarm",
  "interval": 3000
})

// Collect comprehensive metrics
mcp__claude-flow__metrics_collect({
  "components": ["agents", "tasks", "memory", "performance"]
})

// Health monitoring
mcp__claude-flow__health_check({
  "components": ["swarm", "agents", "neural", "memory"]
})

// Usage statistics
mcp__claude-flow__usage_stats({
  "component": "swarm-orchestration"
})

// Trend analysis
mcp__claude-flow__trend_analysis({
  "metric": "agent-performance",
  "period": "7d"
})
```
