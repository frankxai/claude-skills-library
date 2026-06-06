# Skill Templates

This directory contains templates for creating new skills.

## Available Templates

### `skill-template/`

A comprehensive template with all recommended components:
- `SKILL.md` - Main skill file with complete structure
- `README.md` - Installation and usage guide
- `examples/` - Example usage demonstrations
- `references/` - Additional documentation and resources
- `tests/` - Test specifications for validation
- `scripts/` - Optional helper scripts

## Using a Template

### Option 1: Copy and Customize

```bash
# Copy the template
cp -r templates/skill-template free-skills/my-new-skill

# Navigate to your new skill
cd free-skills/my-new-skill

# Edit the SKILL.md
nano SKILL.md
```

### Option 2: Use the CLI (coming soon)

```bash
# Create from template interactively
claude-skills create my-new-skill --template

# Create with options
claude-skills create my-new-skill \
  --template advanced \
  --category "Engineering Workflow" \
  --include-tests
```

## Template Structure Explained

### Required Files

#### `SKILL.md`
The main skill file. Must have:
- YAML frontmatter with `name`, `description`, `version`
- Clear explanation of when to use the skill
- Detailed implementation guidance
- Examples and best practices

**Minimum sections:**
- Purpose
- When to Use
- Core Concepts
- Best Practices
- Examples

### Recommended Files

#### `README.md`
User-facing documentation:
- Installation instructions
- Quick start guide
- Example prompts
- Feature list

#### `examples/`
Working examples:
- `basic-example.md` - Simple use case
- `advanced-example.md` - Complex scenarios
- `real-world-example.md` - Production examples

#### `references/`
Deep-dive documentation:
- Additional guides
- Research papers
- External resources
- Related skills

#### `tests/`
Test specifications:
- `activation.json` - When skill should activate
- `quality.json` - Quality expectations
- `regression.json` - Prevent known issues

### Optional Files

#### `scripts/`
Helper scripts the skill can use:
- Setup scripts
- Validation tools
- Code generators

## Checklist for New Skills

Before submitting a new skill, ensure:

- [ ] **Frontmatter is complete and valid**
  - [ ] `name` follows naming convention (lowercase-hyphenated)
  - [ ] `description` is clear and specific (< 200 chars)
  - [ ] `version` follows semver (start with 1.0.0)

- [ ] **Content is comprehensive**
  - [ ] Clear purpose and use cases
  - [ ] Multiple examples with code
  - [ ] Best practices and anti-patterns
  - [ ] Common workflows documented

- [ ] **Structure is clear**
  - [ ] Logical section organization
  - [ ] Good use of headings
  - [ ] Code blocks are formatted
  - [ ] Links are valid

- [ ] **Examples exist**
  - [ ] At least one basic example
  - [ ] Examples are complete and runnable
  - [ ] Examples cover common use cases

- [ ] **Quality checks pass**
  ```bash
  # Validate frontmatter
  python3 scripts/validate_skills.py
  
  # Check quality score
  python3 scripts/quality_metrics.py | grep "my-new-skill"
  
  # Target: Overall score ≥ 0.60
  ```

- [ ] **Documentation is complete**
  - [ ] README with installation instructions
  - [ ] At least one reference document
  - [ ] Clear navigation between files

## Tips for High-Quality Skills

### 1. Write for Discovery

The `description` in frontmatter is crucial - it's how Claude decides when to use your skill.

**Good:**
```yaml
description: Design and implement RESTful APIs with authentication, rate limiting, and OpenAPI documentation. Use when building web services or API backends.
```

**Bad:**
```yaml
description: API development skill
```

### 2. Provide Context

Don't assume knowledge. Explain:
- Why this approach?
- When to use vs. alternatives?
- Common pitfalls and how to avoid them

### 3. Show, Don't Just Tell

Every major concept should have a code example.

### 4. Structure for Scanning

Users scan before reading. Use:
- Clear headings
- Bullet points
- Code blocks
- Visual hierarchy

### 5. Keep It Current

Reference current versions, best practices, and research.

### 6. Link Related Skills

Skills work better together. Cross-reference complementary skills.

## Quality Scoring

Skills are automatically scored on:

- **Completeness** (30%): Has all recommended components
- **Depth** (30%): Word count, sections, examples
- **Readability** (20%): Structure, formatting
- **Documentation** (20%): README, examples, references

**Target scores:**
- Minimum: 0.60
- Good: 0.70
- Excellent: 0.80+

## Examples of Great Skills

Study these for inspiration:
- `greek-philosopher` - Excellent depth and voice
- `mcp-architecture` - Great technical documentation
- `ui-ux-design-expert` - Comprehensive best practices
- `suno-ai-mastery` - Domain-specific expertise

## Getting Help

- Read the [CONTRIBUTING.md](../CONTRIBUTING.md) guide
- Check existing skills for patterns
- Open a discussion if you have questions
- Start with a simple skill and iterate

---

**Ready to create your skill? Copy `skill-template/` and start building!**
