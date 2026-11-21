# Signature: frankx.ai homepage

Resolved 2026-10-20 by the studio director, in the order the `signature` skill gives.

## Sources read

- FrankX design system (Claude Design System artifact, extracted from `frankxai/frankx.ai-vercel-website` at `be85285`, synced 2026-09-29): README and `tokens.json`.
- `starlight-design-intelligence/brand-packs/frankx/`: BRAND, DESIGN, SURFACE_MODES, MOTION, COPY, TOKENS.
- `starlight/ops/TASTE_FEEDBACK_LEDGER.jsonl`, rows tagged frankx (2026-10-03 to 2026-10-18).
- Estate memory: typography doctrine (Playfair Display, all-caps near-banned), chrome and nav decisions are Frank's.

## Type

- Poppins for display and headings at 18px and up; Inter below 18px and for all body and UI.
- Playfair Display italic for **one** accent word in the hero and pull quotes; never a full heading. Two per viewport at most.
- JetBrains Mono only where a command or trace appears.
- Sentence case everywhere. The design system's 11px uppercase eyebrow conflicts with the all-caps doctrine and the eye pass (14 uppercase classes on the live page): open question below.

## Colour and material

- Ground `void` #0a0a0b, sections step to `space`, solid cards `elevated`.
- One spectrum per page. The homepage is a product page for builders: **tech** (`tech-primary` #10b981, `tech-secondary` #06b6d4). Music keeps its own route in the soul spectrum.
- Glass only over imagery, never over flat void. One of glow, border or blur per element.

## Composition

- Start with a real artifact or working scene (DESIGN.md §1). No centred slogan followed by identical cards (SURFACE_MODES failure mode).
- One primary CTA, `radius-full`. Two equal CTAs are refused.

## Motion

- One scroll set-piece per flagship page, only if it demonstrates. Transform and opacity only.
- Durations 100/200/350/500/700ms, easing `cubic-bezier(0.2, 0, 0, 1)`.
- Reduced motion is a designed state. Type does not animate in.

## Voice

- Founder-to-founder: "Practical before poetic." Example from the brand: "Help builders turn AI capability into owned systems."
- First person when true: "I build to understand. I document so the people I love can build after me." (Frank's existing line.)
- Refused: unleash, harness, seamless, elevate your, guru authority, fake urgency.

## Anti-signature (what would make it look like everyone else's)

- Obsidian plus cyan glow on every block.
- A rotating headline (live today) and a music card in the same first screen as an AI offer.
- Thirty phone screens of sections; third-party book covers as decoration.

## Open questions for Frank

1. Keep the uppercase eyebrow from the design system, or move eyebrows to sentence case to match the all-caps doctrine?
2. Does the homepage carry music at all, or link to the music route only?
