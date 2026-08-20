# Vercel/Next.js Thought Leaders — 2026 Reference

When `/v` runs in RESEARCH lane (or any lane needs to cite authority), pull the right voice from this list. Cite their *role + handle*, never invent quotes. If you need a specific position they hold, run a WebSearch first to ground it.

## Core Vercel + Next.js team

### Guillermo Rauch — Founder & CEO, Vercel
- **Cite for**: framework philosophy, RSC vision, edge-first thinking, the "v0 / generative builder" thesis, AI-native web
- **Handles**: `@rauchg` on X, [rauchg.com](https://rauchg.com)
- **Why**: He sets the direction. Quoting him = quoting Vercel's strategic intent.

### Lee Robinson — formerly VP DevRel, Vercel; now teaching AI at Cursor
- **Cite for**: Next.js best practices, performance optimization, App Router teaching content, video tutorials, DX
- **Handles**: `@leeerob` on X, [leerob.com](https://leerob.com), [@leerob on YouTube](https://www.youtube.com/@leerob)
- **Why**: His tutorials are the reference standard. Note: as of 2026 he moved to Cursor, but his Next.js content remains current.

### Tim Neutkens — Next.js core lead at Vercel
- **Cite for**: Next.js internals, build performance, compiler decisions, version migrations
- **Handles**: `@timneutkens` on X
- **Why**: Authoritative source for "how Next.js actually works" answers and what's coming.

### Andrew Clark — React core / Next.js team at Vercel (since 2023)
- **Cite for**: React Server Components, Concurrent Features, Suspense behavior, integration of React capabilities into Next.js
- **Handles**: `@acdlite` on X
- **Why**: Co-creator of Redux + React Fiber. Deepest authority on RSC mental model.

### Sebastian Markbåge — RSC architect, React core
- **Cite for**: React Server Components architecture, the "why" behind RSC, server-only patterns
- **Handles**: `@sebmarkbage` on X
- **Why**: When you need the foundational RSC reasoning, not just the surface API.

### Shu Ding — Senior engineer, Vercel
- **Cite for**: Next.js DX, documentation, learning materials, design-minded framework decisions
- **Handles**: `@shuding_` on X
- **Why**: Shaped much of Next.js docs + onboarding experience. Cite when discussing learnability/DX.

### Delba de Oliveira — DevRel/Engineering, Vercel
- **Cite for**: Next.js learning content, App Router teaching, tutorials, technical communication
- **Handles**: `@delba_oliveira` on X
- **Why**: Co-presents the Next.js Vision content with Rauch + Robinson. Strong on teaching the "why".

## Adjacent thought leaders (cite when their angle helps)

### Theo Browne — CEO, Ping; T3 stack maintainer
- **Cite for**: Next.js as a backend framework, type-safe full-stack patterns, T3 stack, opinionated take on "what to use Next.js for"
- **Handles**: `@theo` on X, [t3.gg](https://t3.gg), [@t3dotgg on YouTube](https://www.youtube.com/@t3dotgg)
- **Why**: Loud, opinionated, often correct. Use when the question is "should I use X with Next.js" — he has tried it and has a take.

### Sam Selikoff — RSC patterns + tutorials
- **Cite for**: Practical RSC examples, "RSC in real apps" walkthroughs, mental-model teaching
- **Handles**: `@samselikoff` on X, [@samselikoff on YouTube](https://www.youtube.com/@samselikoff)
- **Why**: Excellent at making RSC patterns concrete with real examples.

### Cassidy Williams — DX + framework comparisons
- **Cite for**: DX comparisons across frameworks, accessibility, Next.js in real teams
- **Handles**: `@cassidoo` on X, [cassidoo.co](https://cassidoo.co)
- **Why**: Practical voice on team-scale framework decisions.

### Hassan El Mghari — Vercel hackathons + Next.js apps
- **Cite for**: Shipping fast with Next.js, AI-native apps, side-project patterns
- **Handles**: `@nutlope` on X
- **Why**: Showcases what you can build with Next.js + AI in days, not months.

## Counterpoint voices (cite for "why we chose this over X")

### Rich Harris — Svelte creator
- **Cite for**: Why a non-RSC alternative might fit; framework architecture choices
- **Handles**: `@Rich_Harris` on X
- **Why**: When user asks "why Next.js over Svelte" — Rich's positions clarify the trade-off honestly.

### Kent C. Dodds — Remix advocate, RSC skeptic
- **Cite for**: Why server-first patterns might not be the answer; nested routing perspective
- **Handles**: `@kentcdodds` on X, [kentcdodds.com](https://kentcdodds.com)
- **Why**: Worth knowing both sides. He has principled critiques of RSC complexity.

## How to cite

✅ **Right**: "Per Lee Robinson's video on Next.js 16 caching ([leerob.com](https://leerob.com)), put `'use cache'` as close to the data fetch as possible."

✅ **Right (paraphrased authority)**: "Vercel's official docs recommend opt-in caching with `'use cache'` over implicit caching ([vercel.com/docs](https://vercel.com/docs))."

❌ **Wrong (fabricated quote)**: "Lee Robinson said: 'Always use Cache Components for everything in Next.js 16.'"

❌ **Wrong (vague appeal)**: "Industry experts agree that..." → Name the expert or drop the appeal.

## When in doubt

Run `mcp__claude_ai_Vercel__search_vercel_documentation` first — official docs > expert opinion for "is this the right pattern" questions. Use experts when the answer involves *judgment* (which framework lane to use, when a pattern fails, comparison rationale).
