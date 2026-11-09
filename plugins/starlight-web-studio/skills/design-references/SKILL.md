---
name: design-references
description: Pull real, current design references into a brief, a direction, a style system or a motion score, using the reference libraries the user already pays for (Refero, Mobbin, 60fps) and the free ones (Codrops, Awwwards, recent.design), without copying their libraries. Use when a brief needs its three named references, when an art director needs a style system to start from, when a funnel, onboarding, paywall or checkout flow needs real examples, when the motion director needs a reference for a beat, or when someone asks to "use Refero", "use Mobbin", "find inspiration", "what do the best sites do here". Also use when someone asks to download, save or mirror a reference library.
---

# Design references

Agents that design from memory produce the average of their training data. That
average is what people call AI slop. This skill puts real shipped work in front
of every design decision, and keeps the studio inside the terms of the libraries
it reads.

The studio ships with no reference content. It reads the user's own accounts.
Whoever runs the studio connects their own Refero or Mobbin MCP; the studio
brings the method.

## 1. Find out what this machine can reach

Check which reference sources are connected before planning around them. Run
`node bin/studio-doctor.mjs` if it lists them, or look at the session's MCP tools.

| Source | Gives you | Access | Best for |
|---|---|---|---|
| Refero | screens, flows, and **styles**: type scale, colour roles, spacing, surfaces, components, do and don't | user's Refero Pro MCP, 8,000 calls a month, no rollover | style systems, web and iOS screens |
| Mobbin | screens, flows, **flows with animations**, iOS, Android and web | user's Mobbin Pro or Team MCP | funnels: onboarding, paywall, checkout, cancellation |
| 60fps | about 2,000 iOS interactions with motion breakdowns and SwiftUI code | separate 60fps MCP subscription | native app motion |
| Codrops | 500+ demos with source, MIT unless a demo says otherwise | free, the web | how a web effect is actually built |
| Awwwards | jury-picked sites, motion-heavy | free; a community MCP (`awwwards-mcp`) exists, review its code before installing | cinematic web direction |
| recent.design (`godly.website` redirects here) | curated web, motion and branding | free, browse only | web motion direction |

If nothing paid is connected, say so in the brief and work from the free
sources. Never invent a reference, a URL or a "best practice" to fill the gap.

## 2. Where references enter the studio

| Phase (see `studio-protocol`) | What to pull | Output |
|---|---|---|
| Brief | three references the page must beat, each on one stated dimension | `brief.md` reference rows |
| Directions | one style system per direction as a starting point | `directions.md`, then `design.md` tokens |
| Funnel or flow work | 3 to 5 real flows for the same job (signup, upgrade, cancel) | `references.md` flow rows |
| Motion score | one reference per beat that needs one | `motion-score.md` "reference" column |
| Build | Codrops or library source for any effect we have not built before | code, with the licence notice kept |

Pull at the moment of the decision, not in bulk up front. Twelve calls on the
right question beat four hundred on everything.

## 3. Write reference cards, never copies

Every reference the studio uses becomes one row in `.studio/<id>/references.md`:

| Source | Link | Phase | What it does well, in our words | What we take | What we reject |
|---|---|---|---|---|---|

"What we take" is a principle ("anchor the middle tier; annual toggle on by
default; the cancel flow asks why before it offers a pause"), never a pixel copy.
The link points back to the library. The image stays in the library.

## 4. Style systems: start from a reference, end in our own tokens

When Refero is connected, ask it for styles that match the brief (audience,
category, mood), pick two or three, and record them as cards. Then the art
director writes the page's own `design.md`: our type pairing, our colour roles,
our spacing scale, chosen against the brand pack and `taste.md`. A reference
style is evidence for a decision, not the decision. Copying a product's full
token set onto a client page is still copying.

Mobbin has no style feature. Its Figma plugin pastes flat images, which are useful
for a moodboard and useless as tokens.

## 5. The lines the terms draw

Both libraries allow internal reference and ordinary commercial design work.
Both forbid the same set of things, and so does this studio:

- **No mirror, cache, archive or bulk download** of library content (Mobbin
  terms 3.2e; Refero terms 10 and 14). Scripts that loop over a library to save
  screens are out, whatever the stated purpose.
- **No reference repository or search index** built from what the MCP returns
  (Mobbin 3.5c; Refero 13). A table of principles in our words with links is
  fine. A per-screen catalogue of their library is not.
- **No training, fine-tuning, evaluating or indexing AI** on their content
  (Mobbin 3.4b; Refero 10 and 13).
- **No account sharing.** One named person per seat (Mobbin 4.1b; Refero 2).
  The user's own agents working on the user's own projects are that person's
  use; handing the login to a client or partner is not.
- **No embedding in a customer-facing product** without a separate agreement.
  Refero sells one (usage pricing with a minimum commitment; contact on
  `doc.refero.design/mcp/business`). Until then a product we sell tells the
  buyer's agent to connect the buyer's own account.

Terms change. Before relying on a line here for anything new, open the current
terms page and quote the clause.

If someone asks to download or mirror a library, decline that part, say which
clause it breaks, and offer the reference-card route instead.

## 6. What the studio may keep, and where

- Reference cards (our words plus links): in the repo under `.studio/`.
- Codrops source we adapt: in the repo, with its MIT notice in the file header.
  We may use it in client and product work; we may not resell the demo itself.
- Our own captures of public pages, taken logged-out, for internal comparison:
  in object storage, never committed, never published.
- Library screens: nowhere outside the library.

Media lives in shared object storage so every machine reads the same set; a
reference that exists on one laptop is lost the day that laptop is.
