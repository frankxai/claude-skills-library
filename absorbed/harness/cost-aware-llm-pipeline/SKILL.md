---
name: cost-aware-llm-pipeline
description: "Pick the smallest model that can finish the task, and record the class of work. Use when routing a search, a multi-file edit, or an architecture review, or when a weekly model cap is close."
license: MIT
---

# Route the model to the job

One chair still runs the session. A cheaper model is a worker for a bounded task, not a second orchestrator.

| Work | Model class |
| --- | --- |
| Search, file lookup, doc summary | The faster smaller model |
| Multi-file edits and tests | Sonnet class |
| Architecture, security review, public or priced copy | Opus class |

## Rules

- Do not start an unbounded local loop because a weekly cap is close. Cap the iterations in the prompt and stop.
- Do not install a token proxy or a second memory store as part of routing.
- Do not send private receipts, `reality.md`, or the Queen inbox to a worker.
- If the same mistake is being retried, stop and write the failure down. Another model call is not a fix.
- Codex on this machine needs `--no-daemon` when a Claude session calls it. Leave the Stop-hook review gate off.

## Note to leave

Write one line: task class, model used, and whether the result was kept. That line is the cost record. Do not invent a dollar figure.

## Where this came from

The tiered-model idea follows affaan-m/ECC `skills/cost-aware-llm-pipeline` at `4eb71d92a39cab44ad40ac9d8a6a5ccb4029d6c2` (MIT). The chair rule, the cap, and the privacy list are estate law.

Built on SIP.
