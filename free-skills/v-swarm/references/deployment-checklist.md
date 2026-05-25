# Vercel Production Deployment Checklist — 2026

Use this in DEPLOY and AUDIT lanes. Cross-reference with `mcp__claude_ai_Vercel__search_vercel_documentation "production checklist"` if anything seems out of date.

## Pre-deploy gate

| Check | Why | Tool |
|-------|-----|------|
| Working tree clean | Don't ship uncommitted changes | `git status` |
| Branch pushed to origin | Vercel deploys from remote, not local | `git status -uno` |
| Type-check passes locally | TS errors should not surprise you in prod | `tsc --noEmit` |
| Build passes locally | Vercel will fail in 90s; faster to fail in 30s locally | `next build` |
| Env vars match | Missing env in Vercel = runtime crash | `mcp__claude_ai_Vercel__get_project` |
| CSP doesn't break new embeds | iframe/script src additions need CSP update | grep `<iframe` and `<script src` in changes |

## Deploy

| Step | MCP tool / command |
|------|--------------------|
| Confirm project | `list_projects` → find slug, `get_project` → confirm latest commit + framework |
| Trigger deploy | `git push origin <branch>` (Vercel auto-deploys) OR `mcp__claude_ai_Vercel__deploy_to_vercel` for explicit one-shot |
| Wait for build | Poll `list_deployments` until target appears with state READY |
| Inspect build | `get_deployment_build_logs` — look for warnings, slow steps, large bundles |

## Post-deploy verification

| Check | Pass criteria | How |
|-------|--------------|-----|
| HTTP 200 on critical routes | / , /research, /watch/shorts, key product pages | `curl -sIL <url> \| grep -E "^HTTP"` |
| Core Web Vitals | LCP < 2.5s, INP < 200ms, CLS < 0.1 | Speed Insights dashboard (must be enabled per project) |
| No runtime errors | Zero `error` level entries in first 60s | `mcp__claude_ai_Vercel__get_runtime_logs` |
| OG card renders | Social previews work | [opengraph.xyz](https://opengraph.xyz) or X card validator |
| Schema validates | JSON-LD parses, no errors | [validator.schema.org](https://validator.schema.org) |
| Sitemap reachable | `/sitemap.xml` returns 200 + valid XML | `curl <url>/sitemap.xml` |
| robots.txt sane | No accidental `Disallow: /` | `curl <url>/robots.txt` |

## Vercel project settings (audit periodically)

These should be **on** for any production project per Vercel's [Production Checklist](https://vercel.com/docs/production-checklist):

| Setting | Why | Where |
|---------|-----|-------|
| **Speed Insights** | CWV from real user field data | Project → Settings → Speed Insights |
| **Observability Plus** | Debug, error monitoring, traffic analysis | Project → Observability |
| **Deployment Protection** | Prevent accidental public preview leaks | Project → Settings → Deployment Protection |
| **Web Application Firewall** | Block malicious traffic at edge | Project → Settings → Firewall |
| **Log Drains** | Persist logs beyond Vercel's retention | Project → Settings → Log Drains |
| **Rate Limiting** | Cap abusive traffic per IP/key | Project → Settings → Rate Limits |
| **Content Security Policy** | Defense-in-depth against XSS | `next.config.mjs` headers (FrankX has this) |
| **Bot Protection** | Filter scrapers, attackers | Project → Firewall → Bot Protection |

## Core Web Vitals targets

| Metric | Good | Needs improvement | Poor |
|--------|------|-------------------|------|
| LCP | ≤ 2.5s | ≤ 4.0s | > 4.0s |
| INP | ≤ 200ms | ≤ 500ms | > 500ms |
| CLS | ≤ 0.1 | ≤ 0.25 | > 0.25 |

INP replaced FID as a Core Web Vital in March 2024 and remains the responsiveness metric in 2026.

**Field data > lab data.** Speed Insights captures real user CWV; Lighthouse is a useful approximation but should never be the only signal.

## Runtime log triage

When `get_runtime_logs` returns errors, classify:

1. **Build errors** — already in `get_deployment_build_logs`. Don't double-count.
2. **Runtime exceptions** — uncaught throws, fetch failures, missing env vars
3. **Performance warnings** — slow function, near-timeout, cold starts
4. **External service failures** — third-party API down, DB connection lost

Prioritize 2 and 3. Surface 4 as a known-external incident if it's clearly upstream.

## Deploy receipt template

When deploy succeeds, surface:

```
=== Vercel Deploy Receipt ===
Project: {project-name}
Branch: {branch}
Commit: {SHA, first 8 chars}
Deploy ID: {dpl_xxxxx}
URL: {deployment URL}
Build duration: {Xs}
First-load JS: {Xkb}  ← if available from build logs
Speed Insights: {enabled/disabled}
Critical routes verified: {list}
Runtime errors (60s smoke): {count}
Next: {one-line, e.g. "Monitor Speed Insights for 24h before promoting to production alias"}
```

## When to abort a deploy

- Pre-flight: type-check fails on ANY targeted file in this PR (pre-existing CI debt may be admin-merged per Frank's policy)
- Pre-flight: working tree dirty and changes aren't intentional
- Mid-deploy: build logs show new dependency installation failure
- Post-deploy: any runtime error in the first 60s related to the change
- Post-deploy: critical route returns non-2xx

If any of these fire and the deploy is to **production** (not preview), revert immediately:
- For Git-based deploys: `git revert HEAD && git push`
- For one-shot Vercel deploys: re-deploy the previous good SHA
