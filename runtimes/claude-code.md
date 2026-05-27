# Importing skills into Claude Code

Claude Code is the **native runtime** for skills in this library. SKILL.md format with YAML frontmatter is Claude Code's own primitive.

## Install (per-skill)

```bash
git clone https://github.com/frankxai/claude-skills-library ~/skills-library

# Pick the skill you want
SKILL=acos-visual-gen
mkdir -p ~/.claude/skills/$SKILL
cp -r ~/skills-library/free-skills/$SKILL/* ~/.claude/skills/$SKILL/
```

## Install (all)

```bash
ln -s ~/skills-library/free-skills ~/.claude/skills/library
# Restart Claude Code session
```

Skills are discovered automatically by Claude Code on session start. No further config needed.

## Verifying

In a Claude Code session, type:

```
/help
```

You should see your installed skill in the available commands list.

## Updating

```bash
cd ~/skills-library
git pull origin main
# Symlinked skills update automatically; copied skills need re-copy
```

## What Claude Code uses

- `SKILL.md` frontmatter:
  - `name:` — display name
  - `description:` — Claude reads this to decide when to invoke
- `SKILL.md` body — instructions for what the skill does + how to use
- `references/*.md` — additional context Claude loads on activation
- `scripts/*` — executable helpers the skill calls

## Best practices

1. Put trigger phrases in `description:` (e.g., "Use when creating infographics") so Claude auto-invokes
2. Keep SKILL.md body under ~500 lines (Claude needs to load it on every session)
3. Move long reference material to `references/` (loaded on-demand)
4. Test by triggering with the description's keywords — confirm Claude picks it up
