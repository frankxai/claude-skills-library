---
name: studio-audit
description: Score a live page the way a demanding design lead would, in two layers - a model-free machine scan (search, answer-engine, mobile, access, craft, speed, /30) and a ten-dimension eye rubric (/50) read from real screenshots and the deployed source. Use when auditing a website, comparing a page before and after a change, ranking properties, or when asked "how good is this site", "audit this page", "what should we fix first". Returns scores with file-level evidence and a fix list ordered by leverage.
---

# Studio audit

Two layers, never merged into one number. The machine layer is what a crawler
sees. The eye layer is what a person feels. A page can score 30/30 on the first
and 20/50 on the second; that gap is usually the whole story.

## Layer 1: machine scan (/30)

```bash
node "${CLAUDE_PLUGIN_ROOT}/bin/studio-scan.mjs" <url> --json > .studio/<id>/scan.json
```

Six dimensions, 5 points each. P0 costs 3, P1 costs 1, P2 costs 0.5, `info`
costs nothing. Exit 1 means a P0 exists; exit 3 means the page could not be
fetched, and then you say so and stop. The scan reads server HTML only: it
cannot see layout, motion or contrast over imagery.

A P0 is not automatically a bug. `noindex` on a funnel page may be deliberate.
Confirm intent from the repo or the registry before proposing a fix.

## Layer 2: eye rubric (/50)

Capture first with `visual-proof` at 375, 768 and 1440, light and dark if the
site ships both. Open every screenshot. Read the deployed source (`origin/main`,
not a local branch that may be ahead or divergent). Score each dimension 0 to 5
and name the file at fault.

| # | Dimension | 5 looks like | Common losses |
|---|---|---|---|
| 1 | First screen | one message, one action, the real subject shown; a stranger can say what this is in five seconds | headline is a name, not a promise; two competing CTAs; stock hero |
| 2 | Typography | three families at most, a clear scale, sentence case, measure 45 to 75 characters | all-caps runs, inverted heading sizes, gradient on text |
| 3 | Copy | every sentence earns its place; hero sub under 20 words; nouns the buyer uses | stock vocabulary, claims without evidence, walls of text |
| 4 | Imagery | real product or a custom, inspected render; through the image pipeline | decorative filler as hero, assets in the repo left unused |
| 5 | Surface | grain and depth with a reason; vignettes protect text | flat containers, banding, grain far outside 3 to 7 percent |
| 6 | Motion and 3D | motion explains state or focus; reduced motion is designed | scroll hijack, everything fades in, content shipped at opacity 0 |
| 7 | Mobile | composed for the phone: dvh shell, 44px targets, thumb reach | desktop shrunk to fit, sticky hover, clipped hero |
| 8 | Theme | both schemes designed, or one declared honestly | half-supported dark mode, mismatched status bar |
| 9 | Performance | LCP element prioritised, sane payload, no layout shift | unoptimised source images, heavy blur on sticky elements |
| 10 | Accessibility | one h1, landmarks, visible focus, contrast checked over imagery | icon links without names, focus lost in drawers |

Ship at 40+, iterate at 30 to 39, restart below 30. These bands match the
estate's existing excellence scoreboard, so a run here can append to it.

## Output

`.studio/<id>/audit.md`:

1. Header: domain, tier, both scores, date, deployed commit.
2. The two score tables with one-line justifications that name files.
3. Fix list: number, fix, where, change, effort (S/M/L), ordered by leverage.
4. "What excellent feels like here": one paragraph, the target state in plain words.

Inside the Starlight estate, also append one line to
`logs/excellence/scoreboard.jsonl`:

```json
{"t":"<iso>","id":"<property id>","tier":"tier-1","score":34,"max":50,"top_fix":"<fix 1, one sentence>"}
```

## Rules

- No score without the screenshot it came from.
- Compare against named references, not against "good design".
- If two dimensions fail for the same root cause, say so once and score both.
- Never round up to the ship band.
