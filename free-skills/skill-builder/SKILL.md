---
name: skill-builder
description: "Writes Agent Skills. Use when creating, reviewing or fixing a SKILL.md: frontmatter, a description that triggers, progressive disclosure, folder layout."
---

# Skill Builder

## What This Skill Does

Creates production-ready Claude Code Skills with proper YAML frontmatter, progressive disclosure architecture, and complete file/folder structure. This skill guides you through building skills that Claude can autonomously discover and use across all surfaces (Claude.ai, Claude Code, SDK, API).

## When not to use

- General questions about git, programming or tools that are not about writing or reviewing a skill.
- Configuring hooks, subagents, MCP servers or a plugin manifest: those are separate features with their own formats. Use this skill for the SKILL.md files inside them.
- Proving that a skill improves results. This skill checks the specification and whether the description will trigger; measuring the effect needs the same tasks run with and without the skill.

## Reference files

Load these only when the task needs them:

- [`references/content-structure.md`](references/content-structure.md): A four-level layout for a SKILL.md body, from overview to reference, with a fill-in skeleton. Read when laying out the body of a new skill.
- [`references/scripts-and-resources.md`](references/scripts-and-resources.md): How to add executable scripts and resource files and call them from the body. Read when a skill needs a script, a template or a data file.
- [`references/templates.md`](references/templates.md): Three copy-ready templates: basic, with scripts, and full-featured. Read when starting a new skill from a template.
- [`references/examples.md`](references/examples.md): Two complete worked examples: a documentation skill and a code-generation skill. Read when an example of a finished skill would help.

## Prerequisites

- Claude Code 2.0+ or Claude.ai with Skills support
- Basic understanding of Markdown and YAML
- Text editor or IDE

## Quick Start

### Creating Your First Skill

```bash
# 1. Create skill directory (MUST be at top level, NOT in subdirectories!)
mkdir -p ~/.claude/skills/my-first-skill

# 2. Create SKILL.md with proper format
cat > ~/.claude/skills/my-first-skill/SKILL.md << 'EOF'
---
name: my-first-skill
description: "Does X for Y. Use when the user asks for Z. Third person, what plus when, at most 1024 characters."
---

# My First Skill

## What This Skill Does
[Your instructions here]

## Quick Start
[Basic usage]
EOF

# 3. Verify skill is detected
# Restart Claude Code or refresh Claude.ai
```
---

## Complete Specification

### 📋 YAML Frontmatter (REQUIRED)

Every SKILL.md **must** start with YAML frontmatter containing exactly two required fields:

```yaml
---
name: skill-name                      # REQUIRED: lowercase, digits, hyphens; max 64; same as the folder
description: "What this skill does    # REQUIRED: Max 1024 chars
and when Claude should use it."       # Include BOTH what & when
---
```

#### Field Requirements

**`name`** (REQUIRED):
- **Type**: String
- **Max Length**: 64 characters
- **Format**: lowercase letters, digits and hyphens only (`^[a-z0-9][a-z0-9-]*$`): no spaces, capitals, underscores or colons
- **Must match**: the skill's folder name exactly (`skills/api-docs-generator/SKILL.md` → `name: api-docs-generator`)
- **Usage**: The identifier agents route on and list. Put the human-friendly title in the body's `#` heading, not here
- **Best Practice**: Short and descriptive; names the job
- **Examples**:
  - ✅ `api-docs-generator`
  - ✅ `react-component-builder`
  - ✅ `database-schema-designer`
  - ❌ `API Documentation Generator` (spaces and capitals: fails validation)
  - ❌ `Deploy_Helper` (capitals and an underscore; also differs from a `deploy-helper` folder)
  - ❌ `skill-1` (valid format, but says nothing about the job)
  - ❌ a name longer than 64 characters

**`description`** (REQUIRED):
- **Type**: String
- **Max Length**: 1024 characters
- **Format**: Plain text or minimal markdown
- **Content**: MUST include:
  1. **What** the skill does (functionality)
  2. **When** Claude should invoke it (trigger conditions)
- **Usage**: Loaded into Claude's system prompt for autonomous matching
- **Voice**: Third person ("Generates…", "Reviews…"), never "I" or "you"
- **Best Practice**: Put the "Use when…" clause within the first ~100 characters. Codex trims every description to
  fit one shared budget when many skills are installed (about 104 characters each with 114 skills, codex-cli 0.164.0),
  so a trigger after that point is cut. Be specific about the situations that should load the skill
- **Examples**:
  - ✅ "Generate OpenAPI 3.0 documentation from Express.js routes. Use when creating API docs, documenting endpoints, or building API specifications."
  - ✅ "Create React functional components with TypeScript, hooks, and tests. Use when scaffolding new components or converting class components."
  - ❌ "A comprehensive guide to API documentation" (no "when" clause)
  - ❌ "Documentation tool" (too vague)

#### YAML Formatting Rules

```yaml
---
# ✅ CORRECT: Simple string
name: api-builder
description: "Creates REST APIs with Express and TypeScript."

# ✅ CORRECT: Multi-line description
name: full-stack-generator
description: "Generates full-stack applications with React frontend and Node.js backend. Use when starting new projects or scaffolding applications."

# ✅ CORRECT: A description with a colon is quoted
name: json-api-builder
description: "Creates JSON:API compliant endpoints: pagination, filtering, relationships."

# ❌ WRONG: Not lowercase-hyphenated, and the unquoted colon breaks YAML
name: API:Builder  # YAML parse error, and an invalid name

# ❌ WRONG: Extra fields (ignored but discouraged)
name: my-skill
description: "My description"
version: "1.0.0"       # NOT part of spec
author: "Me"           # NOT part of spec
tags: ["dev", "api"]   # NOT part of spec
---
```

**Critical**: Only `name` and `description` are used by Claude. Additional fields are ignored.
---

### 📂 Directory Structure

#### Minimal Skill (Required)
```
~/.claude/skills/                    # Personal skills location
└── my-skill/                        # Skill directory (MUST be at top level!)
    └── SKILL.md                     # REQUIRED: Main skill file
```

**IMPORTANT**: Skills MUST be directly under `~/.claude/skills/[skill-name]/`.
Claude Code does NOT support nested subdirectories or namespaces!

#### Full-Featured Skill (Recommended)
```
~/.claude/skills/
└── my-skill/                        # Top-level skill directory
        ├── SKILL.md                 # REQUIRED: Main skill file
        ├── README.md                # Optional: Human-readable docs
        ├── scripts/                 # Optional: Executable scripts
        │   ├── setup.sh
        │   ├── validate.js
        │   └── deploy.py
        ├── resources/               # Optional: Supporting files
        │   ├── templates/
        │   │   ├── api-template.js
        │   │   └── component.tsx
        │   ├── examples/
        │   │   └── sample-output.json
        │   └── schemas/
        │       └── config-schema.json
        └── docs/                    # Optional: Additional documentation
            ├── ADVANCED.md
            ├── TROUBLESHOOTING.md
            └── API_REFERENCE.md
```

#### Skills Locations

**Personal Skills** (available across all projects):
```
~/.claude/skills/
└── [your-skills]/
```
- **Path**: `~/.claude/skills/` or `$HOME/.claude/skills/`
- **Scope**: Available in all projects for this user
- **Version Control**: NOT committed to git (outside repo)
- **Use Case**: Personal productivity tools, custom workflows

**Project Skills** (team-shared, version controlled):
```
<project-root>/.claude/skills/
└── [team-skills]/
```
- **Path**: `.claude/skills/` in project root
- **Scope**: Available only in this project
- **Version Control**: SHOULD be committed to git
- **Use Case**: Team workflows, project-specific tools, shared knowledge
---

### 🎯 Progressive Disclosure Architecture

Claude Code uses a **3-level progressive disclosure system** to scale to 100+ skills without context penalty:

#### Level 1: Metadata (Name + Description)
**Loaded**: At Claude Code startup, always
**Size**: ~200 chars per skill
**Purpose**: Enable autonomous skill matching
**Context**: Loaded into system prompt for ALL skills

```yaml
---
name: api-builder                     # 11 chars
description: "Creates REST APIs..."   # ~50 chars
---
# Total: ~61 chars per skill
# 100 skills = ~6KB context (minimal!)
```

#### Level 2: SKILL.md Body
**Loaded**: When skill is triggered/matched
**Size**: ~1-10KB typically
**Purpose**: Main instructions and procedures
**Context**: Only loaded for ACTIVE skills

```markdown
# API Builder

## What This Skill Does
[Main instructions - loaded only when skill is active]

## Quick Start
[Basic procedures]

## Step-by-Step Guide
[Detailed instructions]
```

#### Level 3+: Referenced Files
**Loaded**: On-demand as Claude navigates
**Size**: Variable (KB to MB)
**Purpose**: Deep reference, examples, schemas
**Context**: Loaded only when Claude accesses specific files

```markdown
# In SKILL.md
See [Advanced Configuration](docs/ADVANCED.md) for complex scenarios.
See [API Reference](docs/API_REFERENCE.md) for complete documentation.
Use template: `resources/templates/api-template.js`

# Claude will load these files ONLY if needed
```

**Benefit**: Install 100+ skills with ~6KB context. Only active skill content (1-10KB) enters context.
---

### 🎨 Content Best Practices

#### Writing Effective Descriptions

**Front-Load Keywords**:
```yaml
# ✅ GOOD: Keywords first
description: "Generate TypeScript interfaces from JSON schema. Use when converting schemas, creating types, or building API clients."

# ❌ BAD: Keywords buried
description: "This skill helps developers who need to work with JSON schemas by providing a way to generate TypeScript interfaces."
```

**Include Trigger Conditions**:
```yaml
# ✅ GOOD: Clear "when" clause
description: "Debug React performance issues using Chrome DevTools. Use when components re-render unnecessarily, investigating slow updates, or optimizing bundle size."

# ❌ BAD: No trigger conditions
description: "Helps with React performance debugging."
```

**Be Specific**:
```yaml
# ✅ GOOD: Specific technologies
description: "Create Express.js REST endpoints with Joi validation, Swagger docs, and Jest tests. Use when building new APIs or adding endpoints."

# ❌ BAD: Too generic
description: "Build API endpoints with proper validation and testing."
```

#### Progressive Disclosure Writing

**Keep Level 1 Brief** (Overview):
```markdown
## What This Skill Does
Creates production-ready React components with TypeScript, hooks, and tests in 3 steps.
```

**Level 2 for Common Paths** (Quick Start):
````markdown
## Quick Start
```bash
# Most common use case (80% of users)
generate-component MyComponent
```
````

**Level 3 for Details** (Step-by-Step):
```markdown
## Step-by-Step Guide

### Creating a Basic Component
1. Run generator
2. Choose template
3. Customize options
[Detailed explanations]
```

**Level 4 for Edge Cases** (Reference):
```markdown
## Advanced Configuration
For complex scenarios like HOCs, render props, or custom hooks, see [ADVANCED.md](docs/ADVANCED.md).
```
---

### 🔗 File References and Navigation

Claude can navigate to referenced files automatically. Use these patterns:

#### Markdown Links
```markdown
See [Advanced Configuration](docs/ADVANCED.md) for complex scenarios.
See [Troubleshooting Guide](docs/TROUBLESHOOTING.md) if you encounter errors.
```

#### Relative File Paths
```markdown
Use the template located at `resources/templates/api-template.js`
See examples in `resources/examples/basic-usage/`
```

#### Inline File Content
````markdown
## Example Configuration
See `resources/examples/config.json`:
```json
{
  "option": "value"
}
```
````

**Best Practice**: Keep SKILL.md lean (~2-5KB). Move lengthy content to separate files and reference them. Claude will load only what's needed.
---

### ✅ Validation Checklist

Before publishing a skill, verify:

**YAML Frontmatter**:
- [ ] Starts with `---`
- [ ] Contains `name` field (max 64 chars)
- [ ] Contains `description` field (max 1024 chars)
- [ ] Description includes "what" and "when"
- [ ] Ends with `---`
- [ ] No YAML syntax errors

**File Structure**:
- [ ] SKILL.md exists in skill directory
- [ ] Directory is DIRECTLY in `~/.claude/skills/[skill-name]/` or `.claude/skills/[skill-name]/`
- [ ] Uses clear, descriptive directory name
- [ ] **NO nested subdirectories** (Claude Code requires top-level structure)

**Content Quality**:
- [ ] Level 1 (Overview) is brief and clear
- [ ] Level 2 (Quick Start) shows common use case
- [ ] Level 3 (Details) provides step-by-step guide
- [ ] Level 4 (Reference) links to advanced content
- [ ] Examples are concrete and runnable
- [ ] Troubleshooting section addresses common issues

**Progressive Disclosure**:
- [ ] Core instructions in SKILL.md (~2-5KB)
- [ ] Advanced content in separate docs/
- [ ] Large resources in resources/ directory
- [ ] Clear navigation between levels

**Testing**:
- [ ] Skill appears in Claude's skill list
- [ ] Description triggers on relevant queries
- [ ] Instructions are clear and actionable
- [ ] Scripts execute successfully (if included)
- [ ] Examples work as documented
---

## Learn More

### Official Resources
- [Anthropic Agent Skills Documentation](https://docs.claude.com/en/docs/agents-and-tools/agent-skills)
- [GitHub Skills Repository](https://github.com/anthropics/skills)
- [Claude Code Documentation](https://docs.claude.com/en/docs/claude-code)

### Community
- [Skills Marketplace](https://github.com/anthropics/skills) - Browse community skills
- [Anthropic Discord](https://discord.gg/anthropic) - Get help from community

### Advanced Topics
- Multi-file skills with complex navigation
- Skills that spawn other skills
- Integration with MCP tools
- Dynamic skill generation
---

**Created**: 2025-10-19
**Version**: 1.0.0
**Maintained By**: agentic-flow team
**License**: MIT
