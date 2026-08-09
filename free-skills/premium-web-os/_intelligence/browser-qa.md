# Browser QA — Playwright, the gstack way

Visual proof and Core Web Vitals come from a **real headless Chromium driven by Playwright** — never a self-assigned score. Two runners, one measurement model.

## The measurement model (no Lighthouse)

CWV are read from the browser's own Performance Timeline — the same mechanism as gstack `/benchmark`, robust in CI, zero extra deps:

```js
const nav = performance.getEntriesByType('navigation')[0];
const fcp = performance.getEntriesByType('paint').find(p => p.name === 'first-contentful-paint');
// LCP via PerformanceObserver({ type: 'largest-contentful-paint', buffered: true })
// bundle sizes via performance.getEntriesByType('resource') transferSize sums
```

Baseline the numbers to JSON and diff with thresholds. This replaces flaky Lighthouse-against-a-preview.

## Two runners

| | **CI runner** (one-shot) | **gstack `/browse` daemon** (interactive) |
|---|---|---|
| When | PRs / release gate | local dev, in-session QA, cookie'd auth flows |
| Tool | committed `scripts/visual-qa.mjs` using the repo's own `@playwright/test` | gstack persistent Chromium daemon (`$B`) |
| Screenshots | 375 / 768 / 1440, `fullPage` | `$B responsive <prefix>` (375/768/1280) or `$B viewport WxH` |
| CWV | Performance API (above) | `$B perf` |
| Why split | CI is stateless — a persistent daemon is wrong there | daemon holds cookies/tabs across calls, ~1ms/command |

The CI runner is [`scripts/visual-qa.mjs`](./scripts/visual-qa.mjs) — copy it into a repo's `apps/*/scripts/` (or root `scripts/`). It resolves `@playwright/test` (or a global `playwright`), honors `PLAYWRIGHT_BROWSERS_PATH`, takes an optional `VQA_PROXY`, and never downloads a browser itself.

## Installing the gstack daemon — including locked-Chromium sandboxes

gstack downloads its own Chromium via Bun. That works on a normal dev machine, but **breaks in a locked-Chromium sandbox** (Claude Code on the web, CI images with a preinstalled browser + no-download policy): gstack pins a Playwright version whose expected Chromium build ≠ the preinstalled one, so its probe misses and it tries a forbidden download.

**The fix (proven):** pin gstack's Playwright to the version that matches the preinstalled Chromium build, point at it, and skip the download. Use [`scripts/browser-qa-setup.sh`](./scripts/browser-qa-setup.sh), which:
1. On a normal machine → runs gstack's own `./setup` unchanged (downloads Chromium).
2. In a locked env (detected via `PLAYWRIGHT_BROWSERS_PATH` + a `chromium-*` build present) → exports `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1`, pins Playwright to `GSTACK_PLAYWRIGHT_VERSION` (default: the env's global `playwright` version), builds, and verifies with a launch probe — **zero download**.

### The version-pin rule (write it down so it isn't re-discovered)
> A locked sandbox ships **one** Chromium build. Playwright's `chromium.launch()` only finds it if the Playwright version matches that build. Pin Playwright to the preinstalled build's version (e.g. Chromium build **1194 ↔ playwright 1.56.x**); do **not** upgrade Playwright past what the sandbox's browser supports, or it will try to download.

Verified in this environment: `bun install` with `playwright@1.56.1` + `PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers` launches Chromium build 1194 and screenshots + reads CWV with no download.

## Where this plugs into the OS
- **Release gate / visual-proof** ([`checklists/release-check.md`](./checklists/release-check.md)) → run the CI runner (or `$B responsive` + `$B perf`) and attach the screenshots + `metrics.json`. No self-assigned scores.
- **Performance budget** ([`performance.md`](./performance.md)) → the CWV numbers come from here.
- **Asset QA** ([`visuals.md`](./visuals.md)) → same runner verifies generated hero/GLB/video pages (poster is LCP, reduced-motion path).
