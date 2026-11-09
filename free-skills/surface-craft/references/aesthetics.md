# Aesthetics and visual direction

## Contents

1. The bar
2. Principles
3. The direction card (template)
4. The anti-slop list, and what to do instead
5. Checking a direction before handoff

## 1. The bar

A surface passes when a stranger could not guess it was generated from a default. Every visual
choice can be traced to the product, the buyer or the content. "It looks premium" and "it's
modern" are not reasons. "Our buyers read this on a phone behind a café counter, so body text is
18px with high contrast" is.

If the repo you are working in has a brand pin, a design system or a `DESIGN.md`, it wins over
everything below. This file fills the gaps, it does not override a brand.

## 2. Principles

### Type pairing with a job

- Give each typeface a role: **display** (headlines), **reading** (body), and if needed **data**
  (tables, numbers, code). Two faces covers most products; three is the limit.
- Pick the reading face first, for the length and device people read on. Pick the display face
  to contrast with it in one clear way (weight, width, or serif against sans), not several.
- Write the job next to each face in the card. If you cannot name the job, drop the face.
- Set a type scale with visible steps (for example 16, 20, 28, 40, 56). Five sizes is plenty.

### One accent

- One accent colour, reserved for the primary action and the single most important highlight.
- Everything else is neutral. If the accent appears in more than about one place per screen, it
  stops pointing at anything.
- Check the accent against its background for contrast (4.5:1 for text, 3:1 for large text and
  UI shapes).

### Toned neutrals

- Use greys tinted toward the subject: warm (slightly red or yellow) for food, craft, people;
  cool (slightly blue) for finance, infrastructure, data.
- Avoid pure black on pure white for long reading. A near-black on an off-white is easier on the
  eye and looks considered.
- Define four or five neutral steps (background, surface, border, muted text, text) and use only
  those.

### Hierarchy before motion

- Take a static screenshot. If the reader cannot tell the order of importance in three seconds,
  motion will not fix it.
- Hierarchy comes from size, weight, spacing and position, in that order. Colour is the last tool.
- Add motion only to explain a change (a step completing, a panel opening). Cut decorative motion
  first when anything feels busy. Respect `prefers-reduced-motion`.

### No templated hero

- The default AI hero is a centred headline, a subhead, two buttons and a gradient or blob behind
  them. Do not start there.
- Start from what the product looks like in use: the rota on a phone, the filed tax return, the
  meal plan with its shopping list. Real output beats an illustration of a feeling.
- Left-aligned text with the product beside or below it is a sound default for most products.

## 3. The direction card (template)

Fill this in for every surface. It goes into the output of the pass.

```text
DIRECTION CARD: <surface name>

Reader and setting   who reads this, on what device, in what moment
One-line feel        three or four plain words tied to the buyer (not "premium, modern, clean")

Type
  Display            <face>, <weight>  | job: <why this face, for this buyer>
  Reading            <face>, <size>    | job: <why>
  Data (optional)    <face>            | job: <why>
  Scale              <five sizes>

Colour
  Neutrals           bg <hex>  surface <hex>  border <hex>  muted <hex>  text <hex>   (tone: warm | cool, why)
  Accent             <hex>  used for: <the primary action and ...>
  Contrast checked   accent on bg <ratio>, text on bg <ratio>

Layout
  Grid               <columns, max width, alignment>
  Hero               <what the visual shows, where the text sits>
  Density            <airy | balanced | dense>, why

Imagery              <real product shots | diagrams | photos of real customers>, source
Motion               <none | what moves and what change it explains>

Anti-slop check      <each hit from section 4, with its reason or "removed">
```

## 4. The anti-slop list, and what to do instead

These are the looks the estate treats as defaults that a model reaches for without thinking. A
hit is not automatically wrong, but it needs a reason tied to the product. "It's on trend" is not
one.

| Pattern | Why it reads as generated | Do this instead |
|---|---|---|
| **Cream and terracotta with a serif** | The default "warm, human, crafted" palette. It now signals "an AI picked warm". | Take colour from the product's real world: the café's own tiles, the paper stock of the invoice, the colour of the tool. If warmth is right, choose a warm neutral and an accent that is not terracotta. |
| **A lone acid accent on black** | The default "technical, edgy, developer" look: black page, one neon green or lime. | Ask whether the buyer works in the dark. If not, use a light surface. If dark is right, use a toned dark grey (not pure black) and an accent drawn from the product. |
| **Purple-to-blue gradient hero** | The most recognised AI-product look of the last few years. | A flat, toned background with the product itself as the visual. If a gradient earns its place, keep it subtle, single-hue, and away from the headline. |
| **Inter as the default** | Inter is an excellent face; using it because it is the default is the problem. | Pick the reading face for the reader and device and write down why. If you still choose Inter, say what job it does that the alternatives do not. |
| **Emoji as section markers** | Emoji before every heading reads as a generated README. | Use numbers for sequences, real icons drawn in one consistent style where icons help, or nothing. Headings carry the structure. |
| **Everything centred** | Centring every block removes the reading line and flattens hierarchy. | Left-align body text and most headings. Centre only short, standalone moments (a single CTA band) and on purpose. |
| **Uniform rounded cards with accent rails** | A grid of identical rounded cards, each with a coloured left border or top rail, is the generic feature section. | Vary the layout by content: a list where items are short, a table for comparisons, one large example instead of six small cards. If cards are right, drop the accent rail and let the content differ. |

Related tells worth catching while you are here: stock photos of people pointing at laptops,
3D blobs and glassmorphism with no reason, a fake browser window around a screenshot that hides
the actual product, dark mode as the only mode, and gradient text on headlines.

## 5. Checking a direction before handoff

- Screenshot the page at phone width and at desktop width. Does the hierarchy read in both?
- Cover the logo. Could this be any company's page? If yes, the direction is not specific yet.
- Count the accent. More than about one use per screen is too many.
- Run the anti-slop table row by row and write the result into the card.
- Check contrast for body text, muted text and the accent on its background.
- If the repo has a visual QA or release-gate tool (in this library, see the `web-excellence`
  pack's `visual-proof` and `web-release-gate` skills), run it after implementation.
