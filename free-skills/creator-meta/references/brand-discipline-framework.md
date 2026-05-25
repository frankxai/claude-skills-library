# Creator Brand-Discipline Framework

_Voice rules, lexicon walls, AI-slop refusal — the abstract framework. Concrete creator-specific instances live in each `<creator>-meta/references/brand-discipline.md`._

## Why brand discipline matters

Without explicit voice rules and lexicon boundaries:

- Different sessions write in different voices
- Substrate brands leak into creator surfaces
- AI-slop tells (delve, dive into, certainly) creep into shipped copy
- Trust degrades — readers can sense the brand is unstable

This framework is the abstract contract. Each creator specializes it.

## The brand matrix template

Every creator should produce a table like this in their `brand-discipline.md`:

| Brand | Lives in | Tone | Lexicon | Hard rules |
|---|---|---|---|---|
| **{Primary creator brand}** | `{creator-repo}`, `{public-domain}` | "{tagline}" | "{vocabulary list}" | {what's forbidden} |
| **{Substrate-A}** | `{substrate-repo}` | {its tone} | {its lexicon} | {its hard rules} |
| **{Substrate-B}** | `{substrate-repo}` | {its tone} | {its lexicon} | {its hard rules} |
| **{Substrate-A surface on creator site}** | `{creator}/app/{route}/*` | Hybrid: introduces substrate using creator voice | Both — clearly attributed | Don't let substrate-specific terms leak into other creator surfaces |

The rule: **each brand stays in its repo. Cross-references are clearly attributed. No silent leaks.**

## Voice attributes (the abstract pattern)

Every creator's voice doc should answer:

**DO:**
- (specific tone — direct/playful/academic/etc.)
- (specific lexicon — technical/casual/vivid)
- (specific structure — leads with X, proves Y)
- (specific level of confidence)

**DON'T:**
- (specific anti-patterns — vague claims, jargon, etc.)
- (specific banned phrases — "delve", "dive into", "it's worth noting")
- (specific banned tones — guru, salesy, academic)
- (specific banned punctuation — em-dash overuse is the AI-slop tell)

**Memory-anchored facts:**
- (titles, names, organizations the creator uses)
- (specific words that are creator-specific, e.g., "{Creator}'s narrative is X")

## Substrate brand boundary contract

A substrate repo (open-source framework) is its own product with its own brand. The creator's main repo can:

- ✅ **Reference** the substrate (link to repo, name in copy)
- ✅ **Use** its data (import schemas, types, content via clean APIs)
- ✅ **Surface** it on the creator site with clear attribution
- ❌ **Never** copy the substrate's voice into creator-original surfaces
- ❌ **Never** put substrate-specific lexicon in creator copy
- ❌ **Never** vendor the substrate's source code into the creator repo

The boundary is a wall, not a guideline. Test it with automated grep on every PR.

## Lexicon-leak detection

Every creator should define a grep pattern for substrate-lexicon detection. Example:

```bash
# In a {creator}-repo PR, this should return ZERO matches in app/, components/, content/:
grep -rEi "({banned-term-1}|{banned-term-2}|{banned-term-3})" \
  {creator-repo}/app \
  {creator-repo}/components \
  {creator-repo}/content
```

Exception zones (allowed):
- `docs/` — when documenting the boundary itself
- `.claude/skills/` — when documenting the rule
- Comments in code that explain why a term is forbidden

Non-exceptions (forbidden):
- Any `app/` route copy
- Any `components/` JSX text
- Any `content/blog/`, `content/guides/`, MDX

## Visual brand discipline

| Concern | Rule |
|---|---|
| Image generation | Use the creator's chosen pipeline. Never the rejected fallback. |
| Image extension | Derive from `inlineData.mimeType`. Never hardcode `.png` from slug. |
| Hero image quality | Pass appropriate `imageSize` for retina quality. |
| Color palette | One source-of-truth (e.g., `lib/design-system.ts` + `tailwind.config.js`). |
| Typography | One spec. Mirrored in `design.md`-style agent-readable file. |
| Restraint | When in doubt, the answer is less. |
| AI-slop refusal | Each creator maintains a refusal list. |

## AI-slop refusal list (universal)

These phrases reveal AI-generated content. Banned in every creator's published surfaces:

- "Delve into…"
- "Dive into…"
- "It's worth noting that…"
- "Certainly,…"
- "Absolutely,…"
- "Picture this…"
- "In today's fast-paced world…"
- "Game-changing"
- "Revolutionary"
- "Disrupt" (overused)
- Em-dash overuse (specifically: 3+ em-dashes in 200 words)
- Sentence-initial "Now,…" or "Look,…" (guru tells)

Each creator can extend this list. None can shorten it without justification.

## When this framework activates

Before:
- Writing any copy that ships to the creator site
- Generating any image
- Drafting an email
- Naming a new system / route / skill / agent
- Reviewing a PR (especially substrate-bridge PRs)

If you're unsure whether a word/phrase fits, ask: "Does this word appear naturally in serious documentation in the creator's domain?" If yes → likely OK. If no → likely substrate-leak or AI-slop.

## How to specialize this framework

In each `<creator>-meta/references/brand-discipline.md`:

1. Fill in the brand matrix with your specific brands + substrates
2. Write your voice attributes (DO / DON'T / memory-anchored)
3. Define your lexicon-leak grep pattern
4. Specify your image pipeline + restraint rules
5. Extend the AI-slop refusal list with creator-specific tells

The framework is the bone structure. The creator specifies the muscles.

## Real-world example

`~/frankx/.claude/skills/frankx-meta/references/brand-discipline.md` is the FrankX specialization. Read it for a working reference.
