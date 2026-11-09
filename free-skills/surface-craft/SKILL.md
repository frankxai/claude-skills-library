---
name: surface-craft
description: Runs one ordered pass over any public surface a stranger will read (headline, hero, landing page, product page, waitlist page, pricing block, email subject line, deck title, or visual direction) covering the claim ledger, headline scoring, page copy, visual direction against an anti-slop list, the humanizer pass, and a declined-buyer critique. Use when asked to write, rewrite, punch up, review or design copy or look-and-feel for a page, launch, waitlist, product, email, deck or brand surface; when someone says "make this sound less AI", "write me headlines", "landing page copy", "hero section", "vibes", "aesthetic", "art direction" or "does this page convert". Not for internal notes, commit messages, code comments, standups or private docs.
metadata:
  version: "1.0.0"
---

# Surface craft

A public surface is anything a stranger reads before they trust you: a hero, a landing page, a
product page, a waitlist, a pricing block, an email subject line, a deck title, the visual
direction behind any of them. This skill is one pass, run in order, that takes a brief and
returns copy and direction you can ship without embarrassment and without a claim you cannot
back.

It folds together rules that otherwise live in five places: the humanizer, headline craft,
page copy, visual direction and the estate's aesthetic bar. The depth sits in `references/`.
This file is the order of operations and the hard rules.

## When to use

Use it for anything a stranger will read:

- a headline, subhead or hero section
- a landing page, product page, pricing page or waitlist page
- an email subject line, preview text or launch email
- a deck title or the title slide of a pitch
- a visual direction: type, colour, layout, imagery, "the vibe"
- a review of an existing page ("why is nobody signing up", "does this read as AI")

Do not use it for internal notes, standups, commit messages, code comments, tickets, private
docs or a reply to a colleague. Those have a reader who already trusts you. The pass is too
heavy for them and the claim ledger has nothing to hold.

If the request is half internal and half public (for example "draft the launch email and a note
to the team about it"), run the pass on the public half only and say so.

## Inputs to collect first

Ask for, or find in the brief, before writing a word:

1. **The product or offer** in one plain sentence.
2. **The buyer**: who reads this and what they use today instead.
3. **The source material**: notes, a spec, an existing page, customer quotes, numbers. Every
   claim on the surface must come from here.
4. **The action**: what the reader should do next (join a waitlist, book a call, buy).
5. **The constraints**: brand pin or voice guide if one exists, length, channel.

If the source material is missing, the surface carries fewer claims. You do not fill the gap
with plausible numbers.

## The pass, in order

Run all eight steps. Do not skip to step 3 because headlines are the fun part.

### 1. Outcome and audience in one sentence

Write one sentence: *who* reads this, *what* they get, and *what* they do next.

> Independent café owners with 3 to 15 staff get a rota that fills itself from availability,
> and join the waitlist for the spring beta.

If you cannot write that sentence, stop and ask. Every later step is scored against it.

### 2. The claim ledger

List every claim the surface will make, one row each, with its source. A claim is any
statement a reader could check: a number, a feature, a price, a date, a customer, a comparison,
an outcome, a quality ("fast", "secure", "private").

| # | Claim as it will appear | Source | Status |
|---|---|---|---|
| 1 | "Builds next week's rota in under a minute" | founder demo log, 2026-10-14 | sourced |
| 2 | "Works with Square and Lightspeed" | integrations page, live | sourced |
| 3 | "Loved by baristas" | none | **cut** |

Rules:

- **None added.** The ledger lists what the source supports. You do not invent a claim to
  improve a headline, and you do not round a number up.
- A claim with no source is cut or rewritten into something the source does support.
- A quality word ("fast", "simple", "secure") is a claim. It needs a source or a concrete
  replacement ("rota built in under a minute" instead of "fast").
- The ledger is part of the output. It travels with the copy so a reviewer can check it.

### 3. Headline work

Write **ten** headline candidates. Score each against the rubric in
[`references/headlines.md`](references/headlines.md). In short:

- **Specific**: names a thing, a number or a situation, not a category of feeling.
- **Verifiable**: every claim in it is in the ledger.
- **Names the buyer or the outcome**: a reader knows within a second whether it is for them.
- **No stock AI words**: no unlock, elevate, seamless, supercharge, empower, reimagined.
- **No not-X-but-Y**: no "It's not a tool, it's a teammate."
- **No colon-reveal**: no "Productivity, reimagined: meet Flow" and no dash version of it.
- **Sentence case**: capital on the first word and proper nouns only.
- **Under 9 words** for a hero headline (eight or fewer).

The last five are gates: fail one and the headline is out, whatever it scores elsewhere. Keep the
**two** highest scorers. Show both with their scores and one line on why each survived.

`references/headlines.md` also has twelve patterns that work and twelve that read as AI, each
with an example and a fix. Draw from the working patterns; do not fill a template.

### 4. Body copy

Apply [`references/copy.md`](references/copy.md). The rules that matter most:

- One idea per sentence.
- Active voice. The product or the reader does the verb.
- Concrete nouns: "your Friday rota", not "your scheduling needs".
- Numbers only with a ledger row behind them.
- No superlatives ("best", "most powerful", "world-class", "leading").
- The CTA names the action **and** the next thing that happens: "Join the waitlist" plus "We
  email you once, when your invite is ready."

`references/copy.md` gives the page anatomy (hero, proof, how it works, who it is for, what it
costs, FAQ, CTA) and the rules for each block. Leave out a block you have nothing true to put
in. An empty proof section is better than a fake one.

### 5. Visual direction

Apply [`references/aesthetics.md`](references/aesthetics.md) and fill in its direction card.
The principles:

- **Type pairing with a job.** Each face has a stated role (display, reading, data). Two faces
  is usually enough. "Inter because it is the default" is not a job.
- **One accent colour**, used for the action and almost nothing else.
- **Toned neutrals.** Warm or cool greys that suit the subject, not pure black on pure white.
- **Hierarchy before motion.** The page must read in a static screenshot. Motion is added after
  hierarchy works and is cut first when it competes.
- **No templated hero.** No centred headline over a gradient blob with two buttons by default.
  Start from what the product looks like in use.

Then check the direction against the anti-slop list in `references/aesthetics.md`: cream and
terracotta with a serif, a lone acid accent on black, a purple-to-blue gradient hero, Inter as
the default, emoji as section markers, everything centred, uniform rounded cards with accent
rails. Any hit needs a reason tied to the product or it goes.

### 6. Humanizer pass

Run the existing **humanizer** skill over the final text, with **all** of its patterns: banned
words, banned phrases, banned openers and closers, and banned shapes (negative parallelism,
rule of three, stacked transitions, staccato fragments, uniform paragraph length, em dashes,
sycophancy, the closing rhetorical question).

- The humanizer is maintained in the estate's Claude Code config repository
  (`frankxai/claude-code-config`, at `skills/humanizer/SKILL.md`) and is installed in most
  estate sessions as the `humanizer` skill. Load it; do not paraphrase its lists from memory.
- This skill does not copy the humanizer's lists. One source, so the two never drift apart.
- If the humanizer skill is not available in the session, say so in the output under a
  "Humanizer" line and list which patterns you checked by hand. Do not claim the pass ran.

Run it over headlines, subheads, body, CTAs, alt text and the email subject. Headlines that
change in this step are re-scored against the rubric.

### 7. Critique as a buyer who declined

Read the surface as a specific person who looked at it and did **not** sign up. Name them
("owner of a two-site café who already uses a spreadsheet rota") and write their three to five
honest reasons in their words:

- "I couldn't tell what it costs."
- "It said 'loved by teams' and showed no team."
- "I don't know what happens after I give my email."

Then fix each reason on the surface, or write down why it stays. A reason you cannot fix with a
true claim is a product or evidence gap. Report it; do not paper over it with copy.

### 8. Output

Return four things, in this order:

1. **Final copy**, block by block, ready to paste.
2. **The two headlines** with their rubric scores and one line each on why they survived.
3. **The direction card** from `references/aesthetics.md`, filled in.
4. **The claim ledger**, with every claim on the final surface, its source and its status. Cut
   claims stay in the ledger marked "cut" so the reviewer sees what was removed.

Add one line for the humanizer result (ran, or not available and checked by hand) and the
declined-buyer reasons that could not be fixed.

A complete worked pass, before and after, is in [`references/examples.md`](references/examples.md).

## Hard rules carried from the estate

These hold whatever the brief says. If a brief asks you to break one, say which rule and offer the
nearest honest version.

1. **Honest scarcity only.** No seeded counts ("2,431 people on the waitlist" when the number is
   invented or padded), no countdown timers, no "launching soon" with a date nobody has decided.
   If spots are limited, say how many and why, and only if it is true.
2. **No unsourced proof.** Nothing public claims an award, a metric, a customer, a press mention
   or an outcome without a ledger row behind it. "Trusted by" needs names you are allowed to
   show. Testimonials are real, attributed and used with permission.
3. **Sentence case in interfaces.** Buttons, headings, nav, labels and headlines use sentence
   case. Title Case reads as a template.
4. **The waitlist comes before any checkout.** A new offer collects intent first. Do not put a
   buy button, a price-locked preorder or a payment form on a surface for something that does
   not yet exist. Changing checkout, payments or billing code is out of scope for this skill.

## Quick reference

| Step | Done when |
|---|---|
| 1 Outcome | One sentence names reader, gain and next action |
| 2 Ledger | Every checkable statement has a source or is marked cut |
| 3 Headlines | Ten written, scored, two kept with scores |
| 4 Copy | Each block follows its rule in `references/copy.md` |
| 5 Direction | Card filled; anti-slop list checked, every hit justified or removed |
| 6 Humanizer | Existing skill run with all patterns, or its absence stated |
| 7 Critique | Declined-buyer reasons written and fixed or reported |
| 8 Output | Copy, two headlines with scores, direction card, ledger |

## Common failures

- **Writing headlines before the ledger.** The best headline is usually the most specific true
  claim. You cannot find it before you have listed the claims.
- **Adding a number to make a line land.** If the source does not have it, the line does not get
  it.
- **Fixing AI tells by swapping synonyms.** "Leverage" to "harness" is the same tell. Rewrite the
  sentence around a concrete noun.
- **Taste by default.** Every direction choice needs a reason tied to the product or the buyer.
  "It looks premium" is not a reason.
- **Skipping the critique because the copy feels good.** The declined buyer finds what you
  stopped seeing two drafts ago.

## References

- [`references/headlines.md`](references/headlines.md): the rubric, twelve patterns that work,
  twelve that read as AI.
- [`references/copy.md`](references/copy.md): page anatomy and rules per block.
- [`references/aesthetics.md`](references/aesthetics.md): direction card, anti-slop list, what to
  do instead.
- [`references/examples.md`](references/examples.md): one full pass on a fictional product page.
- `evals/`: trigger and outcome cases in the `claude plugin eval` format.
