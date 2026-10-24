---
description: Recall. A Next.js 16 blog route about to ship, with nine seeded production and security defects (five are Next.js 16 specific).
tags: [nextjs, recall, should-trigger]
runs: 3
max_turns: 10
timeout_seconds: 600
allowed_tools: [Read, Glob, Grep, Skill]
---

The `resources` directory holds the files of our Next.js 16 blog route (App Router, Turbopack builds on Vercel) that are about to ship. `package.json` shows the versions.

Review these files for bugs that would break in production or create a security problem. For each one, name the file and the exact construct, say what goes wrong for real users, and give the specific fix. Skip style nits and generic advice that isn't tied to something in these files.
