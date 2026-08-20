# Custom chains, predefined pipelines, custom pipeline definitions & advanced use cases

> Reference for the `stream-chain` skill. See [`../SKILL.md`](../SKILL.md).

## Custom Chains (`run`)

Execute custom stream chains with your own prompts for maximum flexibility.

### Syntax

```bash
claude-flow stream-chain run <prompt1> <prompt2> [...] [options]
```

**Requirements:**
- Minimum 2 prompts required
- Each prompt becomes a step in the chain
- Output flows sequentially through all steps

### Options

| Option | Description | Default |
|--------|-------------|---------|
| `--verbose` | Show detailed execution information | `false` |
| `--timeout <seconds>` | Timeout per step | `30` |
| `--debug` | Enable debug mode with full logging | `false` |

### How Context Flows

Each step receives the previous output as context:

```
Step 1: "Write a sorting function"
Output: [function implementation]

Step 2 receives:
  "Previous step output:
  [function implementation]

  Next task: Add comprehensive tests"

Step 3 receives:
  "Previous steps output:
  [function + tests]

  Next task: Optimize performance"
```

### Examples

#### Basic Development Chain

```bash
claude-flow stream-chain run \
  "Write a user authentication function" \
  "Add input validation and error handling" \
  "Create unit tests with edge cases"
```

#### Security Audit Workflow

```bash
claude-flow stream-chain run \
  "Analyze authentication system for vulnerabilities" \
  "Identify and categorize security issues by severity" \
  "Propose fixes with implementation priority" \
  "Generate security test cases" \
  --timeout 45 \
  --verbose
```

#### Code Refactoring Chain

```bash
claude-flow stream-chain run \
  "Identify code smells in src/ directory" \
  "Create refactoring plan with specific changes" \
  "Apply refactoring to top 3 priority items" \
  "Verify refactored code maintains behavior" \
  --debug
```

#### Data Processing Pipeline

```bash
claude-flow stream-chain run \
  "Extract data from API responses" \
  "Transform data into normalized format" \
  "Validate data against schema" \
  "Generate data quality report"
```

---

## Predefined Pipelines (`pipeline`)

Execute battle-tested workflows optimized for common development tasks.

### Syntax

```bash
claude-flow stream-chain pipeline <type> [options]
```

### Available Pipelines

#### 1. Analysis Pipeline

Comprehensive codebase analysis and improvement identification.

```bash
claude-flow stream-chain pipeline analysis
```

**Workflow Steps:**
1. **Structure Analysis**: Map directory structure and identify components
2. **Issue Detection**: Find potential improvements and problems
3. **Recommendations**: Generate actionable improvement report

**Use Cases:**
- New codebase onboarding
- Technical debt assessment
- Architecture review
- Code quality audits

#### 2. Refactor Pipeline

Systematic code refactoring with prioritization.

```bash
claude-flow stream-chain pipeline refactor
```

**Workflow Steps:**
1. **Candidate Identification**: Find code needing refactoring
2. **Prioritization**: Create ranked refactoring plan
3. **Implementation**: Provide refactored code for top priorities

**Use Cases:**
- Technical debt reduction
- Code quality improvement
- Legacy code modernization
- Design pattern implementation

#### 3. Test Pipeline

Comprehensive test generation with coverage analysis.

```bash
claude-flow stream-chain pipeline test
```

**Workflow Steps:**
1. **Coverage Analysis**: Identify areas lacking tests
2. **Test Design**: Create test cases for critical functions
3. **Implementation**: Generate unit tests with assertions

**Use Cases:**
- Increasing test coverage
- TDD workflow support
- Regression test creation
- Quality assurance

#### 4. Optimize Pipeline

Performance optimization with profiling and implementation.

```bash
claude-flow stream-chain pipeline optimize
```

**Workflow Steps:**
1. **Profiling**: Identify performance bottlenecks
2. **Strategy**: Analyze and suggest optimization approaches
3. **Implementation**: Provide optimized code

**Use Cases:**
- Performance improvement
- Resource optimization
- Scalability enhancement
- Latency reduction

### Pipeline Options

| Option | Description | Default |
|--------|-------------|---------|
| `--verbose` | Show detailed execution | `false` |
| `--timeout <seconds>` | Timeout per step | `30` |
| `--debug` | Enable debug mode | `false` |

### Pipeline Examples

#### Quick Analysis

```bash
claude-flow stream-chain pipeline analysis
```

#### Extended Refactoring

```bash
claude-flow stream-chain pipeline refactor --timeout 60 --verbose
```

#### Debug Test Generation

```bash
claude-flow stream-chain pipeline test --debug
```

#### Comprehensive Optimization

```bash
claude-flow stream-chain pipeline optimize --timeout 90 --verbose
```

### Pipeline Output

Each pipeline execution provides:

- **Progress**: Step-by-step execution status
- **Results**: Success/failure per step
- **Timing**: Total and per-step execution time
- **Summary**: Consolidated results and recommendations

---

## Custom Pipeline Definitions

Define reusable pipelines in `.claude-flow/config.json`:

### Configuration Format

```json
{
  "streamChain": {
    "pipelines": {
      "security": {
        "name": "Security Audit Pipeline",
        "description": "Comprehensive security analysis",
        "prompts": [
          "Scan codebase for security vulnerabilities",
          "Categorize issues by severity (critical/high/medium/low)",
          "Generate fixes with priority and implementation steps",
          "Create security test suite"
        ],
        "timeout": 45
      },
      "documentation": {
        "name": "Documentation Generation Pipeline",
        "prompts": [
          "Analyze code structure and identify undocumented areas",
          "Generate API documentation with examples",
          "Create usage guides and tutorials",
          "Build architecture diagrams and flow charts"
        ]
      }
    }
  }
}
```

### Execute Custom Pipeline

```bash
claude-flow stream-chain pipeline security
claude-flow stream-chain pipeline documentation
```

---

## Advanced Use Cases

### Multi-Agent Coordination

Chain different agent types for complex workflows:

```bash
claude-flow stream-chain run \
  "Research best practices for API design" \
  "Design REST API with discovered patterns" \
  "Implement API endpoints with validation" \
  "Generate OpenAPI specification" \
  "Create integration tests" \
  "Write deployment documentation"
```

### Data Transformation Pipeline

Process and transform data through multiple stages:

```bash
claude-flow stream-chain run \
  "Extract user data from CSV files" \
  "Normalize and validate data format" \
  "Enrich data with external API calls" \
  "Generate analytics report" \
  "Create visualization code"
```

### Code Migration Workflow

Systematic code migration with validation:

```bash
claude-flow stream-chain run \
  "Analyze legacy codebase dependencies" \
  "Create migration plan with risk assessment" \
  "Generate modernized code for high-priority modules" \
  "Create migration tests" \
  "Document migration steps and rollback procedures"
```

### Quality Assurance Chain

Comprehensive code quality workflow:

```bash
claude-flow stream-chain pipeline analysis
claude-flow stream-chain pipeline refactor
claude-flow stream-chain pipeline test
claude-flow stream-chain pipeline optimize
```

---
