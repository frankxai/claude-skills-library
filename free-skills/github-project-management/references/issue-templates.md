# Issue Templates

Copy-paste templates for swarm-coordinated issues. Referenced by `../SKILL.md`.

## Integration Issue Template

```markdown
## 🔄 Integration Task

### Overview
[Brief description of integration requirements]

### Objectives
- [ ] Component A integration
- [ ] Component B validation
- [ ] Testing and verification
- [ ] Documentation updates

### Integration Areas
#### Dependencies
- [ ] Package.json updates
- [ ] Version compatibility
- [ ] Import statements

#### Functionality
- [ ] Core feature integration
- [ ] API compatibility
- [ ] Performance validation

#### Testing
- [ ] Unit tests
- [ ] Integration tests
- [ ] End-to-end validation

### Swarm Coordination
- **Coordinator**: Overall progress tracking
- **Analyst**: Technical validation
- **Tester**: Quality assurance
- **Documenter**: Documentation updates

### Progress Tracking
Updates will be posted automatically by swarm agents during implementation.
```

## Bug Report Template

```markdown
## 🐛 Bug Report

### Problem Description
[Clear description of the issue]

### Expected Behavior
[What should happen]

### Actual Behavior
[What actually happens]

### Reproduction Steps
1. [Step 1]
2. [Step 2]
3. [Step 3]

### Environment
- Package: [package name and version]
- Node.js: [version]
- OS: [operating system]

### Investigation Plan
- [ ] Root cause analysis
- [ ] Fix implementation
- [ ] Testing and validation
- [ ] Regression testing

### Swarm Assignment
- **Debugger**: Issue investigation
- **Coder**: Fix implementation
- **Tester**: Validation and testing
```

## Feature Request Template

```markdown
## ✨ Feature Request

### Feature Description
[Clear description of the proposed feature]

### Use Cases
1. [Use case 1]
2. [Use case 2]
3. [Use case 3]

### Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

### Implementation Approach
#### Design
- [ ] Architecture design
- [ ] API design
- [ ] UI/UX mockups

#### Development
- [ ] Core implementation
- [ ] Integration with existing features
- [ ] Performance optimization

#### Testing
- [ ] Unit tests
- [ ] Integration tests
- [ ] User acceptance testing

### Swarm Coordination
- **Architect**: Design and planning
- **Coder**: Implementation
- **Tester**: Quality assurance
- **Documenter**: Documentation
```

## Swarm Task Template (`.github/ISSUE_TEMPLATE/swarm-task.yml`)

```yaml
name: Swarm Task
description: Create a task for AI swarm processing
body:
  - type: dropdown
    id: topology
    attributes:
      label: Swarm Topology
      options:
        - mesh
        - hierarchical
        - ring
        - star
  - type: input
    id: agents
    attributes:
      label: Required Agents
      placeholder: "coder, tester, analyst"
  - type: textarea
    id: tasks
    attributes:
      label: Task Breakdown
      placeholder: |
        1. Task one description
        2. Task two description
```
