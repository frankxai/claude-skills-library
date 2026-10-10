---
name: context-budget
description: "Count what a session loads before adding another skill or MCP server. Use when the default prompt is heavy, a new server is about to be enabled, or a skill has never been invoked."
license: MIT
---

# Context budget for this estate

A skill that sits in the default prompt costs tokens on every turn. A skill that loads only when its description matches does not. Measure the default prompt before you add anything.

## Caps already in force

- Turn-0 skill listing stays near 8,000 tokens. A listing near 18,000 is over budget.
- Skill Foundry on 2026-10-09 counted 402 Claude skills and 380 with no invocation in 30 days. Retirement of those skills is Frank's decision. Until then, new skills stay cold.
- A new skill enters the default prompt only after it has a saved eval.
- Enabled MCP servers stay under 10. Tool count stays under 80. A server that only wraps `gh`, `vercel`, or `npx` should be a CLI call.
- Keep a docs tool such as Context7. Leave Higgsfield disabled.
- The continuous-learning observer stays off until the unused skills are retired. An observer that promotes new skills into the prompt makes the budget worse.

## What to report

- Servers enabled, and the tool count.
- Skills in the default prompt, and skills that have an eval.
- The one removal that frees the most tools.
- Whether the thing you wanted to add already exists under `starlight/repos`.

Do not install a token-proxy product as part of this audit.

## Where this came from

The inventory idea follows affaan-m/ECC `skills/context-budget` at `4eb71d92a39cab44ad40ac9d8a6a5ccb4029d6c2` (MIT). The caps, the Foundry counts, and the cold-skill rule are estate measurements.

Built on SIP.
