# `/v elevate` — The Elevate Playbook

Full reference for the ELEVATE lane: audit → gap → fix → ship → teach.

This is the leverage lane. Every audit becomes a PR + a learning artifact. Knowledge compounds. Run weekly per repo (or autonomously via the Sentinel Vercel judge — see `docs/ops/VES-SENTINEL-JUDGE-SPEC.md`).

---

## Stage 1 — Audit pass (parallel, ~3-5 min)

Spawn in parallel via `superpowers:dispatching-parallel-agents`:

| Agent | Task | Output |
|---|---|---|
| `vercel:performance-optimizer` | CWV against live URL, bundle analysis, Speed Insights regression check | Findings list with severity |
| `performance-guardian` | Lighthouse run on all top-traffic surfaces; verify LCP < 2.5s, INP < 200ms, CLS < 0.1 | Scores + regression notes |
| `accessibility-auditor` | WCAG 2.2 sweep — navigation, forms, content, color contrast, focus management | Violations list ranked by user impact |
| `vercel:ai-architect` (if AI features present) | Scan for AI provider wiring — direct SDK use vs AI Gateway, deprecated model IDs, missing fallback | Migration recommendations |

MCP queries (in parallel with agents):

```
mcp__claude_ai_Vercel__get_runtime_logs
  range: last 7d
  filter: errors only
  
mcp__claude_ai_Vercel__get_deployment_build_logs
  target: last 5 production builds
  look for: warnings, slow steps, large bundles

mcp__claude_ai_Vercel__list_deployments
  filter: production, last 14d
  surface: trend in build time + bundle size
```

---

## Stage 2 — Gap pass (sequential, ~1 min)

Load `vercel:knowledge-update` as ground truth. For each Stage 1 finding, check against the patterns below. Every match = a gap → fix pair.

### Deprecated platform patterns

| Detected pattern | Ground truth | Fix recipe |
|---|---|---|
| `export const runtime = 'edge'` | Fluid Compute is default; Edge deprecated 2026-02-27 | Remove the `runtime` export. Verify no Edge-only APIs are used. Node runtime supports the full ecosystem. |
| `vercel.json` only (no `vercel.ts`) | `vercel.ts` is the recommended config — typed VercelConfig, env-aware logic | Create `vercel.ts` with `import { type VercelConfig } from '@vercel/config/v1'`; migrate routes/redirects/headers/crons to it; keep `vercel.json` only if it has unmigrated edge cases |
| Node 18 referenced in `engines` or `vercel.json` | Node 24 LTS is current default | Update `package.json` `engines.node` to `>=24`, remove Node 18 from `vercel.json` if pinned |
| PPR via `experimental.ppr` only | Cache Components is the forward-looking primitive | Move to top-level `cacheComponents: true` in `next.config.ts`, add `'use cache'` directives at component/data-fetch level |
| `experimental.serverActions` | Server Actions is stable, top-level config | Move `serverActions: { bodySizeLimit: '2mb' }` out of `experimental` |
| `@ai-sdk/anthropic` direct + `ANTHROPIC_API_KEY` | AI Gateway routes via `'provider/model'` strings, free observability | Replace direct SDK with AI Gateway routing: `import { gateway } from '@ai-sdk/gateway'`; use `'anthropic/claude-opus-4-7'` strings; `AI_GATEWAY_API_KEY` replaces provider keys |

### Next.js 16 gotchas

| Detected pattern | Fix |
|---|---|
| Dynamic route with sync `params: { slug: string }` | Convert to `params: Promise<{ slug: string }>` + `await params` |
| `app/<name>.ts` (sitemap, robots, manifest) AND `app/<name>/page.tsx` exist | Turbopack collision — rename one; conventional file (sitemap.ts) wins |
| `lucide-react` imports without tree-shaking | Use named imports: `import { Sparkles } from 'lucide-react'` |
| Whole layout marked `'use client'` | Push `'use client'` to leaves; keep parents Server Components |
| `localStorage` in Server Component | Move to a Client child component |
| `'use cache'` on user-specific data | Remove — cache leaks across users |

### FrankX-specific

| Detected pattern | Fix |
|---|---|
| `/admin/*` route without BotID middleware | Wire `<BotID />` server component or middleware check (see VES integration plan) |
| `/papa/`, `/familie/` without BotID | Same — private/family surfaces should gate bots |
| `/library/` with BotID | Remove — public surfaces benefit from LLM crawl + SEO |
| Image without `priority` on hero | Add `priority` to LCP image (typically hero) |
| Image via `<img src>` instead of `<Image>` | Migrate to `next/image` for raster; keep `<svg>` for SVG |
| Image hard-coded `.png` extension when source is jpeg/webp | Trust `mimeType` from generator; never hardcode ext (see `feedback_image_gen_mime`) |
| Banned-phrase from `lib/voice/frankx-voice.ts` in content | Replace (delve, dive into, AI Architect→AI Systems Architect, Arcanean mythology in FrankX brand surfaces, etc.) |

---

## Stage 3 — Fix pass (parallel where independent, ~3-8 min)

Each fix lands as an atomic commit on a dedicated branch `elevate/<repo>-<YYYY-MM-DD>`.

| Agent | Owns | Fix examples |
|---|---|---|
| `vercel:deployment-expert` | Config + platform | `vercel.json` → `vercel.ts`, Node version bump, env var renames, cron migrations |
| `frankx-website-builder` (or `frontend-design:frontend-design` for non-FrankX repos) | Components | `'use client'` boundary fixes, lucide tree-shaking, lazy-loading heavy components |
| `nextjs-expert` | App Router patterns | Async params, Cache Components, server actions, parallel routes, metadata-vs-page collisions |

If two fixes touch the same file: serialize that file's fixes within one agent. Parallelism is per-file, not per-agent.

---

## Stage 4 — Ship pass (sequential, ~2 min)

1. `gh pr create --base main --head elevate/<repo>-<date>` with structured body (findings → fixes mapping)
2. Wait for `pr-review-toolkit:code-reviewer` gate
   - PASS → proceed
   - WARN → surface to user, allow with explicit ack
   - FAIL → block, return to Stage 3 to address
3. Wait for Vercel Agent PR check (`gh pr view <N> --json statusCheckRollup`)
   - SUCCESS or NEUTRAL → proceed
   - FAILURE → block, surface findings, return to Stage 3
4. `gh pr merge <N> --squash --admin` (admin-merge past pre-existing CI debt per standing pattern)
5. Post-merge: verify URLs return HTTP 200, smoke-check runtime logs first 60s

### NEVER admin-merge past

- Missing `pr-review-toolkit:code-reviewer` review
- Vercel Agent PR check returning FAILURE
- New TS errors introduced by the fix bundle (existing TS debt is fine)

---

## Stage 5 — Teach pass (optional, default ON)

Write a learning artifact to `docs/learning/<YYYY-MM-DD>-<topic>.md`. Capped at 200 words.

### Template

```markdown
# <topic> — what changed and why

**Date:** YYYY-MM-DD
**Repo:** frankxai/<repo>
**PR:** #N
**Triggered by:** /v elevate run on <date>

## What changed (3 bullets)

- <change 1>
- <change 2>
- <change 3>

## Why the old pattern is deprecated

<1 paragraph explaining the reason — usually a Vercel/Next.js platform shift,
a security regression discovered upstream, or a performance/cost optimization>

## How the new pattern works

```ts
// minimal code sample
```

## When to apply elsewhere

<1 paragraph — which other repos/surfaces should adopt this same change,
and what signals would tell you to migrate>

## Source

- `vercel:knowledge-update` (2026-02-27) or specific doc URL
- Related memory: [[relevant-memory-entry]]
```

---

## Cost model

| Run scope | Anthropic API | Vercel | Wall time |
|---|---|---|---|
| `/v elevate --plan-only` (just audit + gap) | $0.10–0.20 | $0 | 3-5 min |
| `/v elevate <route>` (one surface) | $0.15–0.25 | $0 | 5-10 min |
| `/v elevate` (whole repo) | $0.25–0.40 | $0 | 10-15 min |

Weekly across 6 FrankX-owned repos via Sentinel: ~$1.50–2.40 total.

---

## Receipt format

Every `/v elevate` run ends with:

```
=== /v elevate Receipt ===
Repo: frankxai/<repo>
Vercel project: <project> (team <team>)
Findings: N (breakdown by severity)
Auto-fixed: M (PR #N → merged at <sha>)
Frank-gated: K (listed with rationale)
Teaching artifacts: J (docs/learning/<files>)
Anthropic cost: $X.XX
Vercel cost: $0 (beta) + $X.XX (if any non-beta features used)
Wall time: M minutes
Next suggested: <one line>
```

---

## Anti-patterns

- **Never auto-fix without a code-review gate.** Even with `--auto-fix`, `pr-review-toolkit:code-reviewer` must pass.
- **Never ship a fix that touches more than 1 deprecated pattern in the same commit.** One pattern per commit makes the learning artifact + future debugging clean.
- **Never write a learning artifact > 200 words.** Bloat = nobody reads it. Tight = it becomes referenceable.
- **Never run ELEVATE on a repo without an active CI workflow.** Need CI to catch type/lint regressions in the fix bundle.
- **Never invoke ELEVATE during active feature work on the same surface.** Wait until the feature branch lands or schedule for off-hours.
- **Never recommend wholesale rewrites.** ELEVATE is for incremental migration to current patterns, not refactors.

---

## When to invoke

- Weekly per repo (automated via Sentinel Vercel judge)
- After a Vercel platform announcement (e.g. new default runtime, new caching primitive)
- Before a major release (catch deprecations before they bite)
- After a `vercel:knowledge-update` skill update
- Operator says "modernize" / "elevate" / "audit and fix" / "bring up to best practices"

## When NOT to invoke

- Mid-sprint on the same surface being elevated (will collide)
- On a repo without CI gates (no safety net)
- During an incident (don't add changes during firefighting)
- On a frozen branch (merge freezes are real — see memory `project_*_merge_freeze`)
