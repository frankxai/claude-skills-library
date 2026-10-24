---
description: Recall. A checkout page with eight seeded WCAG 2.2 AA defects in its markup and CSS.
tags: [ui-review, recall]
runs: 3
max_turns: 8
timeout_seconds: 300
allowed_tools: [Read, Glob, Grep, Skill]
---

`checkout.html` in the added `resources` directory is a static snapshot of our checkout page. Review its markup and CSS for accessibility problems against WCAG 2.2 AA before it ships. Form submission, scripts and image hosting are out of scope; they are tested elsewhere.

List every concrete defect you find. For each one, name the exact element or CSS rule, say what goes wrong for a real user, and give the specific fix. Skip generic advice that isn't tied to something in this file.
