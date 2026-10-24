---
description: Recall. A LangGraph expense-approval agent with seven seeded defects in state, routing, tools and human-in-the-loop.
tags: [langgraph, recall, should-trigger]
runs: 3
max_turns: 8
timeout_seconds: 600
allowed_tools: [Read, Glob, Grep, Skill]
---

`expense_agent.py` in the added `resources` directory is our LangGraph (1.x) expense approval agent. The module docstring says what it must do. We can't run it here.

Review it and list every bug that will make it misbehave or fail at runtime. For each, point at the exact line or construct, explain what happens when it runs, and show the fix.
