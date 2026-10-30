---
name: media-desk
description: Produce generated imagery and video for a web page - hero renders, section art, product scenes, loops - through a written prompt packet, the cheapest capable native generator first, paid platforms only behind an approved plan, and a provenance sidecar for every file. Use when a page needs images or video, for "generate a hero image", art direction for generated media, Codex image generation, Nano Banana, Veo, Higgsfield, or replacing stock or filler imagery.
---

# Media desk

Generated media is the most common source of slop on a premium page. The packet
is what prevents it.

## 1. The prompt packet

Before any generation, write `.studio/<id>/media/<asset>.packet.md`:

- **Job**: where it appears, at what size and crop, what it must make the visitor feel or understand.
- **Subject and world**: the real subject, the setting, the brand world it belongs to.
- **Composition and camera**: framing, lens, angle, where the text will sit.
- **Light and material**: time of day, key light, surfaces, grain.
- **Palette**: tokens from the repo's design system, not colour names.
- **Negative constraints**: the estate anti-slop list plus the brand's own anti-signature.
- **Delivery**: dimensions for 375, 768 and 1440 crops, format (AVIF/WebP), max weight.
- **References**: continuity images already on the site.

## 2. Route to a generator

Native and already-paid tools first:

1. A generator the harness already has (for example Codex image generation, or
   the Antigravity/Gemini image tools), run through its own CLI.
2. A configured free or subscription API the repo already uses.
3. Paid per-generation platforms (Higgsfield and similar) only after the
   operator approves a written plan for that campaign with a credit cap. Never
   as the first call.

Claude has no native image generation. If no generator is reachable, deliver the
packet as a hand-off and say generation did not happen.

## 3. Provenance, every file

Beside each asset write `<file>.vis.provenance.json` with: exact prompt,
negative prompt, model, provider, seed if exposed, settings, the agent and
session, date, and `rights_status`. Mark outputs whose model cannot be pinned as
non-reproducible. Inside the Starlight estate also append a line to
`logs/image-generation-ledger.jsonl`.

## 4. Inspect before it ships

Open every output at real crop sizes. Reject anything with malformed hands or
text, a generic composition, or a palette outside tokens. Generate text and
logos as code overlays, never inside the image. Score with the asset gate the
repo uses; first-pass outputs are drafts.
