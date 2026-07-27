---
name: visual-proof
description: Capture before/after screenshot evidence of a web page at real breakpoints (375, 768, 1440) in both light and dark themes, using Playwright against a local dev server or a deployed URL. Use before starting any visual change to capture the current state, and again after to prove the delta. Also use when asked to "show me what it looks like", check responsive behavior, verify dark mode, or confirm a layout does not break on mobile. Reports honestly when a browser or server is unavailable rather than describing a page it never rendered.
---

# Visual Proof

Screenshots are the only claim about a page's appearance that cannot be
hallucinated. Capture before you change anything, and after.

If you cannot capture — no server, no Chromium, no network to the deployed URL —
**say so and stop making visual claims.** Describing a page you never rendered
is the single most common way UI work goes wrong undetected.

## The matrix

Six shots per state. Not one, not a single desktop hero crop.

| Width | Stands for |
|---|---|
| 375 | phone — where layouts actually break |
| 768 | tablet / the awkward middle breakpoint |
| 1440 | desktop |

× light and dark, if the site ships both themes.

## Run it

The pack ships a runner. From the repo root:

```bash
# against a local dev server
node .claude/skills/visual-proof/capture.mjs --url http://localhost:3000/ --label before

# ...make the change...
node .claude/skills/visual-proof/capture.mjs --url http://localhost:3000/ --label after

# or against a deployed preview
node .claude/skills/visual-proof/capture.mjs --url https://<preview>.vercel.app/pricing --label after
```

Output lands in `.visual-proof/<label>/<width>-<theme>.png` and the script prints
each path. `.visual-proof/` belongs in `.gitignore` — these are evidence for the
turn, not repo artifacts.

Flags: `--widths 375,768,1440` · `--themes light,dark` · `--full` (full-page
instead of viewport) · `--out <dir>`.

## Environment notes

- **Cloud / remote Claude Code sessions:** Chromium is already installed and
  `PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers` is set. Do **not** run
  `playwright install` — it is blocked and unnecessary. If a project pins its
  own `@playwright/test`, launch with
  `executablePath: '/opt/pw-browsers/chromium'`.
- **No dev server running:** start one in the background first
  (`npm run dev`), wait for the port, capture, then stop it. Do not leave a dev
  server running after the work is done.
- **Theme switching** is site-specific. The runner tries, in order:
  `?theme=dark` on the URL, a `data-theme="dark"` attribute on `<html>`, a
  `.dark` class on `<html>`, and Playwright's `colorScheme: 'dark'` emulation.
  If the site uses something else, pass `--themes light` and say dark mode was
  not verified.

## Reading the result

Look at the images. Specifically check:

- horizontal scroll at 375 (the most common regression)
- text that wraps into a widow or clips at 768
- contrast in dark mode on anything using a translucent surface
- the fold at 1440 — what is above it, and is the primary action there
- images that shift as they load (compare against `core-web-vitals`)

Then state what changed, in words, with the paths attached. "Hero is 40px
shorter at 375 and the CTA is now above the fold" is a finding. "Looks great" is
not.
