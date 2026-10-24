# SKILL.md content structure

Part of the `skill-builder` skill. SKILL.md links here; read it when laying out the body of a new skill.

## 📝 SKILL.md Content Structure

#### Recommended 4-Level Structure

````markdown
---
name: your-skill-name
description: "What it does. Use when [specific trigger]."
---

# Your Skill Name   <!-- the human-friendly title lives here, not in name -->

## Level 1: Overview (Always Read First)
Brief 2-3 sentence description of the skill.

## Prerequisites
- Requirement 1
- Requirement 2

## What This Skill Does
1. Primary function
2. Secondary function
3. Key benefit

---

## Level 2: Quick Start (For Fast Onboarding)

### Basic Usage
```bash
# Simplest use case
command --option value
```

### Common Scenarios
1. **Scenario 1**: How to...
2. **Scenario 2**: How to...

---

## Level 3: Detailed Instructions (For Deep Work)

### Step-by-Step Guide

#### Step 1: Initial Setup
```bash
# Commands
```
Expected output:
```
Success message
```

#### Step 2: Configuration
- Configuration option 1
- Configuration option 2

#### Step 3: Execution
- Run the main command
- Verify results

### Advanced Options

#### Option 1: Custom Configuration
```bash
# Advanced usage
```

#### Option 2: Integration
```bash
# Integration steps
```

---

## Level 4: Reference (Rarely Needed)

### Troubleshooting

#### Issue: Common Problem
**Symptoms**: What you see
**Cause**: Why it happens
**Solution**: How to fix
```bash
# Fix command
```

#### Issue: Another Problem
**Solution**: Steps to resolve

### Complete API Reference
See [API_REFERENCE.md](docs/API_REFERENCE.md)

### Examples
See [examples/](resources/examples/)

### Related Skills
- [Related Skill 1](#)
- [Related Skill 2](#)

### Resources
- [External Link 1](https://example.com)
- [Documentation](https://docs.example.com)
````
