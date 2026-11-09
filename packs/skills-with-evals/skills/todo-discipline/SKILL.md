---
name: todo-discipline
description: "Use when starting any complex task (3+ steps) or before declaring work complete. Enforces todo/task state to match reality — merge updates + read verification. Prevents false completion."
version: 1.0.0
author: Frank Riemer / GenCreator
license: MIT
---

# Todo Discipline

Hard gate: task list state must match reality before you claim completion.

## Protocol

1. Update finished items to completed (merge).  
2. Immediately re-read the list.  
3. Only then conclude.  

## Rules

- One in_progress item at a time  
- Never empty-array merge  
- Read result beats stale merge echo  

## When

Complex multi-step work, multi-agent sessions, handovers.
