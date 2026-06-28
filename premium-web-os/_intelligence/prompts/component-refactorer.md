# Prompt — Component Refactorer

**Use when:** an existing component works but violates OS standards (raw hex, wrong server/client boundary, motion ownership, a11y) and must be brought to standard without changing behavior.

**Read first:**
- [../implementation-standards.md](../implementation-standards.md) — server/client boundary, token discipline, file/module rules
- [../design.md](../design.md) — token categories, component standards, one glass recipe / one radius rhythm
- [../motion.md](../motion.md) — GSAP/Motion ownership, named variants, `LazyMotion`+`domAnimation`
- [../accessibility.md](../accessibility.md) — contrast, keyboard, focus, semantics, reduced motion
- [../brand-worlds.md](../brand-worlds.md) — the real token source to bind to

## Prompt

You are refactoring one component to Premium Web OS standards inside an existing repo. The hard rule: **behavior and visual output must not change.** This is a standards refactor, not a redesign. If you find yourself wanting to improve the design, stop — that is a different task.

First, capture the baseline: read the component, note its rendered output, props, states, and any visual quirks. If practical, screenshot before. You will compare against this at the end.

Bring it to standard on these axes only:

1. **Tokens, not hex** — replace raw hex/arbitrary spacing/radii with the brand token source named in brand-worlds.md. Preserve the exact resolved values; do not "round" a color or spacing to a nearer token if that changes the pixels — if no token matches, flag it in `decision-log.md` rather than silently shifting the look.
2. **Server/client boundary** — Server Component by default; add `'use client'` only where state, refs, browser APIs, motion, or 3D actually require it. Split a client leaf out of a server parent rather than marking the whole tree client.
3. **Motion ownership** — if it animates: `LazyMotion` + `domAnimation` (never `domMax`); use the named variants/easings from motion.md; ensure no property is animated by both GSAP and Motion; animate transforms/opacity, not layout; clean up timelines on unmount. Preserve the existing motion's feel.
4. **Accessibility** — real semantics (landmarks, one h1 per page, no heading skips, labels not placeholders), keyboard operability with a visible focus state (no bare `outline:none`), ≥44px targets, meaningful `alt` (empty on decorative), and a `prefers-reduced-motion` path for any animation. Add what's missing without altering layout.
5. **Module hygiene** — keep the file focused; do not split into a cascade of shallow single-use wrappers; clear names over narrating comments.

Constraints:
- Surgical changes only. Touch what these five axes require; do not reformat or "improve" adjacent code, and do not delete unrelated dead code — mention it, leave it.
- Match the surrounding style even if you would write it differently.
- Verify any package API from `node_modules`/docs before relying on it. Do not add a dependency without logging it.
- No TODOs in code — open items go to `decision-log.md` with owner + reason.

Required outputs:
- The refactored component.
- A short diff summary: what changed per axis (tokens / boundary / motion / a11y / hygiene), and confirmation that resolved values are pixel-identical.
- Any unmatched token, or unrelated issue you noticed but did not touch, logged in `decision-log.md`.

Definition of done:
- Behavior and rendered output unchanged (verified against baseline).
- No raw hex/arbitrary values; correct server/client boundary; single motion ownership; a11y non-negotiables met; reduced-motion path present.
- Build green, types clean, lint clean; changes are surgical.
