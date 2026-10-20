---
description: Precision. A correctly built signup form; the review should not claim defects that are not there.
tags: [ui-review, precision]
runs: 3
max_turns: 8
timeout_seconds: 300
allowed_tools: [Read, Glob, Grep, Skill]
---

`signup.html` in the added `resources` directory is a static snapshot of our signup page, shown after the person typed a too-short password. Review its markup and CSS for accessibility problems against WCAG 2.2 AA before it ships. Form submission, scripts and image hosting are out of scope; they are tested elsewhere.

List every concrete defect you find. For each one, name the exact element or CSS rule, say what goes wrong for a real user, and give the specific fix. If the page is fine, say so.
