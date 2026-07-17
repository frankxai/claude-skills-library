# The Agent Skills standard

Every skill in this library follows the open **Agent Skills** format introduced by Anthropic.
This page is the authoring standard contributors are held to. The canonical, upstream
specification lives at **[agentskills.io/specification](https://agentskills.io/specification)** and
the official best-practices guide at
**[platform.claude.com/docs/agents-and-tools/agent-skills](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices)**.

> **Going further than L1.** The Agent Skills format defines a documented skill — what the
> [Agent Skill Standard](../standard/) calls Level 1. To take a skill to evaluation, governance,
> and composition, see the standard and its [six-level maturity model](../standard/MATURITY-MODEL.md).
> Run `node standard/validate-skill.mjs <skill-folder>` to report any skill's maturity level.

## What a skill is

A skill is a self-contained folder with a `SKILL.md` at its root:

```
your-skill-name/
├── SKILL.md          # required — frontmatter + instructions
├── references/       # optional — deep docs, loaded on demand
├── scripts/          # optional — executable helpers the agent runs
└── assets/           # optional — templates, fonts, icons used in output
```

The file **must** be named `SKILL.md` (uppercase) — Claude Code discovers skills by that exact name.

## Frontmatter

```yaml
---
name: your-skill-name
description: What it does AND when to use it, with trigger keywords. Third person, ≤ 1024 chars.
---
```

| Field | Rules |
|---|---|
| `name` | **Required.** Lowercase, hyphenated, ≤ 64 chars, matches `^[a-z0-9][a-z0-9-]*$`. Conventionally identical to the folder name. Prefer a clear, specific name (gerunds like `processing-pdfs` read well). Avoid `helper`/`utils`/`tools`. Do not use the reserved words `anthropic` or `claude` as the whole name. |
| `description` | **Required.** Non-empty, ≤ 1024 chars, no XML tags. The single most important line — it is the only text preloaded for routing. State **what the skill does and when to load it**, in the **third person**, with explicit **trigger keywords**. Claude tends to *undertrigger*, so be specific and a little "pushy". |

> This repo also tolerates an optional `version` field. It is not part of the minimal open
> standard but is harmless and useful for tracking.

## Progressive disclosure (the core idea)

Skills load in three levels, so a large library costs almost nothing until a skill is actually used:

1. **Metadata** — `name` + `description` are preloaded for *every* skill (keep them tight).
2. **Body** — the full `SKILL.md` is read into context **only when the skill triggers**. Keep it
   **under ~500 lines**; the validator warns past that.
3. **Bundled resources** — `references/`, `scripts/`, `assets/` are pulled in **only when needed**.
   Keep references one level deep and add a short table of contents to any file over ~100 lines.

## Quality checklist (PR review rubric)

- [ ] Folder contains a `SKILL.md` (uppercase), valid UTF-8, non-empty.
- [ ] `name` is hyphen-case, ≤ 64 chars, matches the folder name.
- [ ] `description` is third-person and says **what + when + trigger keywords**.
- [ ] Body is focused on **one** workflow and stays under ~500 lines.
- [ ] Deep material lives in `references/`; deterministic steps in `scripts/` (with real error
      handling, no magic constants, forward-slash paths, stated run-vs-read intent).
- [ ] No time-sensitive claims in the body (use a collapsed "Older patterns" `<details>` if needed).
- [ ] Consistent terminology throughout.
- [ ] `python3 scripts/validate_skills.py` passes with no new warnings.

Start from [`../template/SKILL.md`](../template/SKILL.md).
