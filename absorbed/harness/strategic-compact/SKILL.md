---
name: strategic-compact
description: "Write what worked, what failed, and what is still open to a file, then compact at a phase boundary. Use when a long session is about to cross from research into editing, or from a finished milestone into the next task."
license: MIT
---

# Compact on a phase boundary

Auto-compact fires when the window is full. That often cuts a multi-file edit in half. Compact when a phase is actually done, and only after the next phase can be resumed from disk.

## Write this file first

Use `~/.claude/sessions/ecc-YYYY-MM-DD.md`, or the handover file the repo already uses. The note needs these three headings:

- What worked, with the command output or the commit that proves it.
- What failed, including the command that failed.
- What is still open, as the next concrete action.

If a heading is missing, add it. Do not paste an untrusted transcript into starlight-memory.

## When to compact

- Research is done and the plan is a file.
- A milestone is committed and the next task is different.
- A failed approach is recorded and you are starting a different one.

## When to keep the window

- You are mid-edit across several files.
- The next step needs a path, a diff, or an error you have not written down.

The todo list may not survive compaction on current Claude models. The file is the record. The estate already runs `pre-compact.js`. Do not add a second compact hook that double-fires.

## Where this came from

The phase-boundary idea follows affaan-m/ECC `skills/strategic-compact` at `4eb71d92a39cab44ad40ac9d8a6a5ccb4029d6c2` (MIT). The three buckets, the session path, and the ban on a second hook are estate choices.

Built on SIP.
