# Importing skills into Gemini CLI

Gemini CLI uses `settings.json` and chat templates rather than a file-skill discovery system. Integration is via:

1. **`GEMINI.md` in the project or `~/.gemini/`** — Gemini reads this for system instructions
2. **System prompt injection** via `gemini --system` flag
3. **ADK (Agent Development Kit)** — Python framework where skills become agent tools

## Option A — Global GEMINI.md

For skills available in every Gemini CLI session:

```bash
cat ~/skills-library/free-skills/<skill>/SKILL.md >> ~/.gemini/GEMINI.md
```

Gemini reads `~/.gemini/GEMINI.md` on session start.

## Option B — Per-project GEMINI.md

```bash
cat ~/skills-library/free-skills/<skill>/SKILL.md >> ~/myproject/GEMINI.md
```

## Option C — Inline system prompt

For one-off invocations:

```bash
gemini --system "$(cat ~/skills-library/free-skills/<skill>/SKILL.md)"
```

## Option D — ADK agent wrapper (production)

For skills that need tool-calling capability:

```python
from google.adk.agents import Agent

skill_agent = Agent(
    name="<skill_name>",
    description="<from SKILL.md description>",
    instruction=open("~/skills-library/free-skills/<skill>/SKILL.md").read(),
    tools=[...]  # whatever tools the skill needs
)
```

See [Google ADK docs](https://google.github.io/adk-docs/) for full agent wrapping.

## Best practices for Gemini

- Gemini's **long context window** (2M tokens on Gemini 3 Pro) means you can paste *all* of `~/skills-library/free-skills/*/SKILL.md` into `GEMINI.md` if you want every skill available
- Use the `description:` trigger phrases — Gemini will pattern-match invocations against them
- For multimodal skills (image-gen, vision), pair with Gemini's native multimodal tools

## Verifying

```bash
gemini
> "Use <skill description trigger> for this task"
```

If Gemini follows the skill's instructions, import is working.

## Note on Gemini 3 + Antigravity

If you're on Gemini 3 via Antigravity (`agy` CLI), see [`antigravity.md`](./antigravity.md) instead — AG has its own substrate-based pattern that supersedes plain Gemini CLI.
