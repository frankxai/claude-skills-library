---
name: creator-productivity
description: "Task management and workspace memory for creative work sessions. Manages a TASKS.md file for project tracking, a two-tier memory system (CREATOR.md + creator-memory/), and a daily sprint structure. Use when organizing creative projects, tracking content tasks, or starting a focused work session."
---

# Creator Productivity

Structured task management and memory for creative work — projects don't slip, context doesn't reset.

## Architecture

```
TASKS.md               ← Task board (Active, In Progress, Done)
CREATOR.md             ← Working memory (voice, projects, quick-ref)
creator-memory/
  voice.md             ← Full brand voice documentation
  visual.md            ← Visual style system
  music.md             ← Music style and track log
  channels.md          ← Per-channel content rules
  projects/            ← Active project briefs
  content/             ← Content catalog (published + drafts)
```

This two-tier system keeps the hot cache lean (CREATOR.md at ~80 lines) while supporting unlimited depth in `creator-memory/`.

## Task Management

### TASKS.md Format

```markdown
# Tasks

## Active
- [ ] **[Task title]** — [context, relevant project, deadline if any]
  - [Additional detail if needed]

## In Progress
- [ ] **[Task title]** — [started date, blocker if any]

## Done (last 2 weeks)
- [x] ~~[Completed task]~~ ([completion date])
```

**Rules:**
- Bold the title for scannability
- Include enough context to work without re-explaining
- Move to Done immediately on completion, not "later"
- Archive Done section weekly (move to `creator-memory/content/archive.md`)

### Task capture from conversation

When the user mentions something that should be tracked ("I need to write the Suno launch post", "follow up with the design team"), extract and add it automatically:
- Infer title and context from conversation
- Add to Active with today's date
- Confirm: "Added to TASKS.md: [title]. Is that right?"

## Creator Memory System

Two-tier lookup for every creative request:

```
User request →
1. Check CREATOR.md (hot cache — covers 90% of daily needs)
2. If not found → creator-memory/ (deep files)
3. If still not found → ask user, then save
```

**Lookup examples:**
- "write a linkedin post" → load voice attributes + LinkedIn channel rules from CREATOR.md
- "create a blog hero image" → load visual style from CREATOR.md, fall back to creator-memory/visual.md
- "finish the [project] brief" → load project brief from creator-memory/projects/[project].md

## Session Start Checklist

When beginning a creative session:
1. Read TASKS.md — flag anything overdue or blocking
2. Read CREATOR.md — confirm active projects and voice
3. Check if any project briefs in creator-memory/projects/ need review
4. Present orientation summary (see references/session-templates.md)

## Weekly Maintenance

Offer weekly (or on request):
1. Archive completed tasks older than 2 weeks
2. Review stale In Progress tasks (offer to break down or defer)
3. Check if CREATOR.md projects are current
4. Prompt: "Anything new to add to your memory?"

## File Initialization

If TASKS.md doesn't exist: create with standard template.
If CREATOR.md doesn't exist: offer to run `/creator-sprint` for full setup, or create minimal version from current conversation context.

See `references/file-templates.md` for standard file templates.
