# Importing skills into OpenCode

OpenCode is the open-source TUI for agentic coding. It uses its own `.opencode/` config directory pattern.

## Existing adapter

A working adapter is already maintained at:

```
~/agentic-creator-os/adapters/opencode/
```

This adapter shows the precedent pattern for OpenCode skill consumption. Inspect that directory for the canonical example.

## Quick import (per-project)

```bash
mkdir -p ~/myproject/.opencode/skills
cp -r ~/skills-library/free-skills/<skill> ~/myproject/.opencode/skills/<skill>
```

OpenCode discovers skills in the `.opencode/skills/` directory of the active project.

## Global install

For skills available across all OpenCode sessions:

```bash
mkdir -p ~/.opencode/skills
cp -r ~/skills-library/free-skills/<skill> ~/.opencode/skills/<skill>
```

## Verifying

```bash
opencode
> "Use <skill description trigger> for this task"
```

If OpenCode references the skill's instructions, import is working.

## Reference

- Existing precedent: `agentic-creator-os/adapters/opencode/`
- OpenCode docs: see the OpenCode repo for current spec
