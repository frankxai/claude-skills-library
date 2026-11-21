# Critique: Kade, three rounds

**Provider for the independent pass:** none different available. `studio-doctor` found no
`codex`, `gemini`, `agy` or `grok` on the machine that ran this. The critic was a separate
agent with a fresh context, given only `brief.md`, the screenshots and the two HTML files, and
told not to open `eye.md`, `scan.*`, `audit.md`, this file or the README. **Recorded as: same
provider, independent context.** A different-provider pass is still owed.

Frame given every round: "You are the buyer named in the brief. You looked at this page and
decided not to book a viewing. Say exactly why, worst first, with what you saw."

Findings below are condensed from the critic's reports, keeping every finding, its severity
and its evidence location; wording is shortened, never softened.

---

## Round 1: v2 (`pages/v2.html`, `evidence/v2/`) · verdict **revise** · 28 / 50

Browser pass on the same page: 25 / 25. Machine scan: 28.5 / 30.

### P0
1. "See the plans" leads to no plan: `#studio` holds a paragraph, a spec list and stat cards.
2. Materials contradict: the hero says "oak and lime plaster", the next section "FSC larch". Oak and lime plaster are not on the spec sheet.
3. Invented proof presented as fact: "Studio no. 3, moored at the NDSM wharf" under an illustration; an anonymous "owner of studio no. 1"; "Apr–Sep off-grid", "~4 days", "tow beyond 40 km", "price fixed when the plan is", permit help, options. None are in the brief.

### P1
4. The booking action is a bare mailto at the bottom with no place, time or next step; v2 deleted v1's only concrete viewing line.
5. "From €248,000" became "€248,000, fixed once the plan is signed": misstates the brief.
6. No evidence of craft: one illustration, no yard, build, detail or interior.
7. Price not on the first screen (about 75% down on desktop, 2,470 px on a phone).

### P2
8. Facts repeated to fill space ("7 months" four times; stat cards repeat the spec list).
9. Two FAQ questions that re-ask what the page already said.
10. The quote section is a dead band with about 700 px of empty paper.

### Optical composition
Hero text centred against image plus caption, so it sags about 18 px below the image's centre;
nav right edge (1244) misses the content edge (1256); `text-wrap: balance` leaves a 150 to 210
px hole beside a dark, heavy image; spec list strands the right half of its column and the stat
row breaks the 5/7 grid; uniform 64 px padding emphasises nothing; h3 equals the lede, card
numerals equal h2, price equals h1; the illustration's edges vanish in dark mode.

### Scores

| Dimension | v1 | v2 |
|---|---|---|
| First screen | 1 | 3 |
| Typography | 1 | 3 |
| Copy | 0 | 2 |
| Imagery | 1 | 1 |
| Surface | 1 | 3 |
| Motion and 3D | 0 | 3 |
| Mobile | 0 | 3 |
| Theme | 0 | 2 |
| Performance | 1 | 4 |
| Accessibility | 0 | 4 |
| **Total** | **5** | **28** |

**Maker's answer (v3):** every claim not in the brief removed; "from €248,000, mooring
excluded" moved into the hero; a floor plan added and linked; stat cards, quote and steps
deleted; hero top-aligned to the image; nav edge aligned; dark-mode image edge added.

---

## Round 2: v3 · verdict **revise (small)** · 31 / 50

Fix status: plan partly (indicative, needs drawings: owner gate); claims partly; price
answered; booking partly (place and dates: owner gate); dark edge and nav answered; optical
centring answered; cards and quote answered, FAQ partly.

### P1
1. Plan caption said "from the spec sheet"; the spec sheet lists no rooms.
2. "Photographs follow the first launch" leaves "Request a viewing" without an object.
3. **Dark-mode CTA at about 3.8:1** (white on #c86a3a): a regression on the page's one action.
4. Phone plan cropped with no scroll cue, and placed after the spec list.
5. "You need a mooring right before we build" and "our yard" are unbacked process claims.

### P2
6. Plan card stretched about 200 px below its caption. 7. "Glazed canal side" collides with the hull line. 8. Plan labels about 10 px at 1440. 9. Serif stack fell back to a heavy Linux default. 10. Heading widow ("hull") and a split phrase in the h1. 11. FAQ still filler. 12. The load fade means nothing.

**Score 31 / 50** (first screen 4, typography 3, copy 3, imagery 2, surface 3, motion 3,
mobile 3, theme 3, performance 4, accessibility 3).

**Finding against the instrument.** The browser pass had scored this page 25 / 25 because it
captured dark scheme but did not measure it. `bin/studio-eye.mjs` now runs the text collector
in dark scheme and reports `access/contrast-dark` (test: "dark scheme contrast is judged on its
own"); the v3 integration test went red on this exact button before the page was fixed.

**Maker's answer (v3.1):** dark CTA back to dark text on peach; caption now "Illustrative
layout. The room programme is not yet confirmed by construction drawings."; `align-self:
start` on the plan; labels at 16 to 18 units (about 12 to 14 px); a separate portrait plan for
phones, placed before the spec list; FAQ removed rather than answered with facts the brief does
not hold; a line on what the viewing request does; `text-wrap: balance` on headings; the serif
stack reverted; the motion removed; process claims removed.

---

## Round 3: v3.1 · verdict **ship on the maker's side** · 36 / 50

All five maker items answered, with evidence: CTA about 7:1 in dark; honest caption; card no
longer stretched, labels clear and legible; upright phone plan at the hull's real proportion,
before the spec list; FAQ removal judged right ("an honest gap beats invented reassurance").

Remaining P2s: "Request a viewing in Amsterdam" against "place confirmed in our reply"; orphan
"pump." in the hero sub at 1440; about 130 px of empty column under the plan. The first two
were fixed after this round (the reply now confirms "the date and the address in Amsterdam";
`text-wrap: pretty` on the sub); the third is accepted.

| Dimension | v3.1 |
|---|---|
| First screen | 4 |
| Typography | 3 |
| Copy | 4 |
| Imagery | 2 |
| Surface | 4 |
| Motion and 3D | 3 |
| Mobile | 4 |
| Theme | 4 |
| Performance | 4 |
| Accessibility | 4 |
| **Total** | **36 / 50** |

**Critic error, recorded rather than corrected silently.** Round 3 credits "one opacity fade"
under motion. v3.1 has no animation (`grep -c animation pages/after.html` is 0 after the round-2
fix). The motion score of 3 therefore rests on a misread; it is left as given, not re-scored by
the maker.

### Owner gates (block a booking, not the build)
1. Viewing: the real address and dates, and what exists to view.
2. Plans: confirmed construction drawings to replace the illustrative layout.
3. Imagery: photographs of the yard, the build or a finished unit.
4. Type: a licensed serif, so headings stop depending on the viewer's installed fonts.

The page sits at 36, in the iterate band (30 to 39). That is the right reading: honest and competent, and it cannot convert this buyer until gates 1 and 2 close.
