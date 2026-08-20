# Importing skills into Cursor

Cursor uses `.cursor/rules/*.mdc` files (with frontmatter) or `.cursorrules` (legacy) for AI-context instructions.

## Convert SKILL.md → .mdc

Cursor's `.mdc` format is similar to SKILL.md but with different frontmatter keys:

```bash
SKILL=acos-visual-gen

# Source SKILL.md frontmatter:
# ---
# name: "..."
# description: "..."
# ---

# Target .mdc frontmatter:
# ---
# description: "..."
# globs: ["**/*"]  # or specific patterns
# alwaysApply: false
# ---

mkdir -p .cursor/rules
cat > .cursor/rules/$SKILL.mdc <<EOF
---
description: $(grep '^description:' ~/skills-library/free-skills/$SKILL/SKILL.md | sed 's/description: //')
globs: ["**/*"]
alwaysApply: false
---
$(tail -n +5 ~/skills-library/free-skills/$SKILL/SKILL.md)
EOF
```

## Or use .cursorrules (legacy, project-wide)

For a single rules file:

```bash
cat ~/skills-library/free-skills/<skill>/SKILL.md >> .cursorrules
```

Cursor reads `.cursorrules` on every session. Less flexible than per-rule `.mdc` files.

## Trigger conditions

The `description:` field in the `.mdc` frontmatter is what Cursor pattern-matches against your prompts. Keep it specific:

✅ Good: "Use when creating infographics or diagrams"
❌ Bad: "Visual tool"

## Verifying

In Cursor chat:

```
"<trigger phrase from description>"
```

Cursor will show which rule it's applying in the AI context.
