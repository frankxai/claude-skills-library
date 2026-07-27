---
name: web-release-gate
description: The sequencing contract for any website or web-design work — new page, landing page, hero, redesign, component, layout, styling, motion, or visual polish on a web surface. Use whenever a task will change what a site looks like, feels like, moves like, or how it is interacted with, including any edit to .tsx/.jsx/.vue/.svelte/.css/.scss under app/, components/, pages/, src/, or styles/. Routes to the right specialist skill for each phase (ui-ux-pro-max, emil-design-eng, apple-design, review-animations, web-design-guidelines, core-web-vitals, visual-proof, image-to-code, extract-design-system, brandkit) and defines what "done" requires. Read this before writing UI code, not after.
---

# Web Release Gate

The specialist skills in this pack are each good at one thing and none of them
know about each other. This is the contract that orders them and says when work
is finished.

Two failure modes it exists to prevent:

1. **Skipping straight to code.** An interface written before the direction is
   chosen inherits whatever the model's defaults are. That is the origin of AI
   slop — not bad taste, but no decision.
2. **Self-certifying.** Declaring a page "polished," "production-ready," or
   scoring it out of 10 with no audit output and no screenshot. A claim is not
   evidence.

## The five phases

Run them in order. Skip a phase only by saying which one and why.

### 1. Capture — what exists now

Before touching anything visual, capture the current state at desktop **and**
mobile width. Use `visual-proof`. If capture is impossible (no dev server, no
browser, remote-only), say so and stop — you cannot show a delta from nothing,
and every later claim becomes unfalsifiable.

Also read, if the repo has them: `design.md`, `taste.md`, `tailwind.config.js`,
`lib/design-system.*`, and the repo `CLAUDE.md`/`AGENTS.md`. **These outrank
every skill in this pack.** The pack supplies craft; the repo supplies the brand.
On conflict, the repo wins.

### 2. Decide — commit to a direction before code

Pick the direction explicitly and name it. `ui-ux-pro-max` is the reference
database for this — query it for style, palette, font pairing, and the product
type's known UX rules rather than inventing them. `emil-design-eng` and
`apple-design` carry the judgment the database does not: restraint, hierarchy,
what earns its place on the screen.

For a high-value page or a redesign, compare exactly **three** directions and
say why the winner won. One option is not a decision.

Do **not** reach for a whole-aesthetic skill that imposes a look the repo has
already settled. If `design.md` exists, the aesthetic is decided; you are
choosing within it.

### 3. Build

Write the code. During this phase:

- **Motion** — `emil-design-eng` for the craft bar, `apple-design` for
  gesture/spring/physical interactions, `animation-vocabulary` when you need the
  exact name for an effect. `find-animation-opportunities` when the question is
  "should anything move here at all" — it is equally willing to answer no.
- **From a screenshot or a visual reference** — `image-to-code`. Its one
  non-negotiable rule: generate a readable reference per section, never one
  compressed board for the whole page.
- **From another site's tokens** — `extract-design-system`, for competitive and
  reference work only. Never re-import your own site's scraped tokens over the
  tokens of record.
- **New sub-brand or product identity** — `brandkit`. Not for a property whose
  identity is already locked; that is a fight with the existing brand system,
  and the brand system wins.

### 4. Audit — the part that is not optional

Run `web-design-guidelines` against the files you changed. It fetches the live
Web Interface Guidelines and reports in `file:line` form. Fix what it finds or
state explicitly why a finding does not apply.

If the change involved motion, also run `review-animations` on the diff. Its
default is to flag; approval is earned.

Then `core-web-vitals` if the change touches images, fonts, above-the-fold
markup, client components, or any list that can grow.

Minimum bar, regardless of what the audits say:

- keyboard reaches every interactive element, and focus is visible
- `prefers-reduced-motion` has a real reduced variant, not just "no animation"
- the layout holds at 375px, 768px, and 1440px with no horizontal scroll
- both themes render — if the site has dark mode, it was checked in dark mode
- no `transition: all`, no `outline-none` without a `:focus-visible` replacement
- images carry explicit dimensions

### 5. Prove

`visual-proof` again — after shots at the same widths and themes as the capture.
The receipt is: audit output + before/after screenshots + what you changed and why.

## Done means

```
Direction:  <the one chosen, and what it beat>
Changed:    <files>
Audit:      web-design-guidelines — N findings, N fixed, N waived (with reason)
Motion:     review-animations — verdict, or "no motion in this change"
Vitals:     core-web-vitals — measured / not applicable because <reason>
Visual:     before + after, 375 / 768 / 1440, light + dark
Open:       <anything knowingly left>
```

Any line you cannot fill honestly is stated as unfilled. **Never invent a score,
a Lighthouse number, or a "production-ready" verdict.** "I could not capture
screenshots in this environment" is a valid and useful answer. A fabricated
score is not.

## Refusals

These hold even when asked directly, unless the person overrides them knowing
the cost:

- **Do not rename a working URL, delete a page with traffic, or "consolidate" by
  deleting.** Fix navigation instead. URL changes need explicit approval.
- **Do not restyle beyond the task.** Adjacent components you did not need to
  touch stay untouched. Mention what you noticed; do not fix it in this change.
- **Do not add a dependency to solve a styling problem** the existing token
  system already solves.
- **Do not ship motion that cannot be interrupted** or that runs identically
  under `prefers-reduced-motion: reduce`.

## When this does not apply

Backend logic, API routes, database work, config, CI, scripts, docs — unless the
change alters what something looks like, feels like, moves like, or how it is
interacted with. A `page.tsx` that only changes a fetch call is not web-design
work. Say so and move on rather than running the whole gate on a one-line fix.
