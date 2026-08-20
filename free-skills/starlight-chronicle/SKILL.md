---
name: starlight-chronicle
description: The reflective layer of the FrankX OS. A four-cadence practice — weekly Palace Review, monthly Survey, quarterly Constellation Census, annual Legacy Audit — that witnesses what's been built, blesses what is whole, and orients the next move from a sovereign vantage. Couples to /changelog as its factual underlayer. Use when invoking /palace, /chronicle, /bless, or when a Sunday reflection is requested.
inheritance: frankx-meta ← creator-meta
---

# Starlight Chronicle

The reflective layer of the FrankX OS. The Chronicle witnesses what's been built; the Changelog records what shipped. Both surfaces. Two registers. Coupled.

## What the Chronicle is for

Frank ships at high velocity. Eight operating systems composed in 90 days. The bottleneck is not output — it is the *witness*. Without a witnessing layer, work piles up uncategorised; the public-facing memory of what was shipped goes stale; the next ambition gets seeded by restlessness rather than orientation.

The Chronicle is the witnessing layer. Each cadence has a defined voice and a defined output. The practice is sovereign and re-entrant: skipped cadences are silent. Auto-fire hooks are forbidden — the ritual is invoked, not pushed.

## The four cadences

| Cadence | Slash | Voice | Output structure |
|---|---|---|---|
| Weekly (Sun) | `/palace` | **Palace Architect** | What to bless, what to ignore, Monday's one path, handover note |
| Monthly (1st Sun) | `/chronicle month` | **Horizon Surveyor** | Shape of the month, themes, drift |
| Quarterly | `/chronicle quarter` | **Constellation Cartographer** | What's alive / decaying / emerging |
| Annual (~Dec 21) | `/chronicle year` | **Legacy Chronicler** | What of this year matters in 10 years |
| Anytime | `/bless <slug>` | **The Witness** | Single-piece ratification — "this is whole" |

Only the weekly is active in v1. Monthly activates after 4 weekly entries; quarterly after the monthly is proven; annual when the calendar reaches winter solstice.

## The Sunday Palace Review (the only active cadence in v1)

### Inputs

1. The week's git history across all canonical repos (auto-rolled by `scripts/chronicle-roll-week.mjs`).
2. The current `data/changelog-entries.json` for the week.
3. The current `MEMORY.md` index.
4. The previous Palace Review (so the cadence has continuity).

### Output structure (must follow)

A single markdown file at `docs/chronicle/weekly/YYYY-W##-palace-review.md` with these sections, in order:

1. **§0 The Structural Truth** — one paragraph naming what the system actually became this week.
2. **§1 What Exists and Should Be Blessed / Preserved** — wholeness, not completeness.
3. **§2 What Is Structurally Important but Unfinished** — the load-bearing gaps, ranked.
4. **§3 What Should Be Ignored for the Next 7 Days** — permission to not-do.
5. **§4 The One Highest-Leverage Execution Path for Monday** — a single sentence, then the unpacking.
6. **§5 Handover Note** — code-block formatted; copies cleanly into Monday's first session prompt.

Length target: 800–1500 words. Surgical, not exhaustive.

## Voice rules (load-bearing)

- **Calm, sovereign, non-compulsive.** The reader should feel permission, not pressure.
- **No spiritual-bypass vocabulary.** The AI-slop refusal list: _manifest, abundance, vibration, energy, resonance, alignment-with-universe, journey, sacred, transformation, awakening_ — when used without grounding.
- **Allowed register:** _witness, ratify, bless, attend, orient, cadence, structural, wholeness, sovereign, restraint, lineage._ These have philosophical lineage and operational meaning.
- **No FrankX-brand canon leak.** "Elite Creator. AI Architect. Humble Excellence." voice belongs in `/blog/` and `/about/`. The Chronicle is its own register.
- **No Arcanean canon leak.** No Guardians, Gates, Realms, Seekers. Per `feedback_frankx_brand_clean.md`.
- **No preening.** A blessed thing is named, not celebrated. The voice is dignified, not promotional.
- **No emoji.** No section dividers ornamented beyond `---`. Restraint is the visual register.

## Blessing semantics (precise)

When the Chronicle says a thing is **blessed**, it means exactly:

> _Whole at this moment. Further iteration is creator-restlessness, not improvement. Future-you may extend it from a new vantage; present-you does not._

Blessing is not permanent. New facts may break wholeness; new ambitions may compose new rooms. When that happens, the next Chronicle records it. Until then, the blessing stands. This is closure semantics (Kahneman/Zeigarnik), not a metaphysical claim.

## Coupling to the Changelog

The changelog at `/changelog` is the factual auto-maintained shipping log. The roll-up script `scripts/chronicle-roll-week.mjs` mines git history across canonical repos every Sunday and synthesises raw entries into `data/changelog-entries.json`. Conventional-commit prefixes (`feat:`, `fix:`, `ship:`, `feat(scope):`, etc.) are detected automatically.

The Palace Review reflects *on top of* this auto-roll. Changelog = what shipped (factual). Chronicle = what was witnessed (reflective). Different registers. No duplication.

If the auto-roll has not run when `/palace` fires, the skill must run it first. If sibling repos are unreachable (e.g. on different machines), the skill must note the gap explicitly rather than silently produce an incomplete witness.

## Public surface rules

- `/chronicle` on frankx.ai is the **manifesto only** — the practice itself, not the contents. Like `/library/approach`.
- `/chronicle/letters/{slug}` carries selectively published witness letters. **Each letter is opt-in.** Nothing is published automatically. The default state of every Palace Review is private.
- The skill must never produce a public-letter draft unless explicitly asked. Private archive is the default.

## What the skill must never do

- Auto-fire on a hook. The ritual is invoked or it does not run.
- Generate a Palace Review for a week the user did not ask about.
- Write hagiography. Wholeness is recognised, not celebrated.
- Use future tense for work that has not happened. The witness only sees what *is*.
- Inflate cadence — do not run monthly/quarterly/annual until activated.
- Pull the Constellation Census or Legacy Audit forward to "feel productive." Anti-leverage.
- Suggest building Phase 2 tooling before the practice has proven adoption (≥3 of 4 weekly Palace Reviews actually happened).

## What the skill must always do

- Begin by reading: previous Palace Review (if any), this week's git roll, current `MEMORY.md`, current `docs/_moc/MOC-Chronicle.md`.
- Run `scripts/chronicle-roll-week.mjs` if `data/changelog-entries.json` lacks current-week entries.
- Use the exact six-section structure above for weekly Palace Reviews.
- File the output at `docs/chronicle/weekly/YYYY-W##-palace-review.md`.
- Update `docs/_moc/MOC-Chronicle.md` with a one-line index entry for the new review.
- Refuse to write longer than 1500 words. Surgical, not exhaustive.

## Visual layer (optional, restrained)

A weekly Palace Review **may** include:

- **One hero image** generated via `scripts/nb-generate.mjs` with a structured design-thinking prompt (CONCEPT / ART DIRECTION / SCENE / COMPOSITION / LIGHTING / PALETTE / MOOD / STYLE REFERENCES). Restraint over flourish. No people, no glow, no AI-slop.
- **Up to 3 screenshots** of shipped surfaces from the week. Real evidence, not decoration.
- **One quote of the week** — a sentence from the work that encodes the week's truth.

The visual layer is **never required**. A text-only Palace Review is a complete Palace Review. Visuals are only added when they earn their place.

## Lineage (the one paragraph the skill carries)

The practice is not invented. The Stoics did the evening review. Christian monastics kept the Examen. Jews keep Sabbath. Engineers do postmortems. Buddhists do sangha ratification. They all encode the same insight: **the work of witnessing is its own work, and complex systems become legible only at the right cadence.** Daily is too noisy; yearly is too sparse. Weekly, monthly, quarterly, annual — these are the chreods of cognition meeting complexity.

The honest reframe of "law of attraction": you cannot direct attention toward what you have not first witnessed. Selective attention compounds. The Chronicle is the foundation of any manifestation claim, not its replacement.

## File map

| Concern | Path |
|---|---|
| Founding witness | `docs/chronicle/0-state-of-the-palace.md` |
| Weekly archive | `docs/chronicle/weekly/YYYY-W##-palace-review.md` |
| MOC | `docs/_moc/MOC-Chronicle.md` |
| Skill (this file) | `.claude/skills/starlight-chronicle/SKILL.md` |
| Slash commands | `.claude/commands/palace.md`, `chronicle.md`, `bless.md` |
| Auto-roll script | `scripts/chronicle-roll-week.mjs` |
| Public manifesto | `app/chronicle/page.tsx` |
| Hero prompt template | `.claude/skills/starlight-chronicle/hero-prompt.txt` |

## Phase gate (when to extend)

This skill ships v1 with weekly only. Activate the next cadence only when:

- **Monthly:** ≥3 of the first 4 weekly Palace Reviews actually happened.
- **Quarterly:** ≥10 of the first 12 weekly Palace Reviews actually happened, OR the monthly cadence has run for 3 consecutive months.
- **Annual:** the calendar reaches winter solstice 2026-12-21.

Until each gate clears, the higher cadences are deliberately inactive. Anti-leverage to pull them forward.

---

_Built on the substrate triple: arcanea-meta ← creator-meta ← frankx-meta._
_The Chronicle inherits the brand-cleanliness rule and the design contract._
_The Chronicle does not inherit Arcanean canon._
