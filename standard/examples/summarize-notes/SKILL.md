---
name: summarize-notes
description: Summarizes raw meeting notes into decisions, action items, and open questions. Use when the user pastes meeting notes, a call recap, or asks for a summary of a discussion.
---

# Summarize Notes

A reference skill at maturity **Level 1 (Documented)**. It has a valid `SKILL.md` with a trigger-rich description and one narrow job — and deliberately nothing more, to show the floor of the standard.

## Purpose

Turn raw meeting notes into a tight summary a busy reader can act on.

## Required Inputs

- A block of meeting or call notes (any length).

## Workflow

1. Read the notes.
2. Extract decisions that were made.
3. Extract action items, with an owner if one is named.
4. Extract open questions that were not resolved.
5. Return the three lists. Do not invent items that are not in the source.

## Output Structure

- **Decisions**
- **Action items** (owner — task)
- **Open questions**

## Why it stops at L1

This skill is fine as-is for personal use (risk tier T0). It has no `references/`, `scripts/`, or `evals/`, so the validator reports L1. Adding those would raise its level — but for a low-stakes personal summary, that would be friction with no payoff. Match the level to the stakes.
