---
description: Precision. The corrected version of the same route; the review must not invent defects.
tags: [nextjs, precision, should-trigger]
runs: 3
max_turns: 10
timeout_seconds: 600
allowed_tools: [Read, Glob, Grep, Skill]
---

The `resources` directory holds the files of our Next.js 16 blog route (App Router, Turbopack builds on Vercel) that are about to ship. `package.json` shows the versions.

Review these files for bugs that would break in production or create a security problem. For each one, name the file and the exact construct, say what goes wrong for real users, and give the specific fix. If you find nothing that would break or create a security problem, say so plainly. Skip style nits.
