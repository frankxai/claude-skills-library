---
name: suno-ai-mastery
description: Design professional song and instrumental direction for the newest stable Suno model using genre, harmony, rhythm, arrangement, vocal persona, production, dynamics, and controlled iteration. Use for Suno composition strategy, arrangement, production troubleshooting, covers, extensions, and remasters.
version: 3.0.0
---

# Suno AI Mastery

## Freshness rule

Suno changes quickly. Do not hardcode an old model as current. When operating the UI, capture it and select the newest stable model available to the logged-in account unless the user requests another. Treat exact character limits and feature names as UI facts to verify, not memory.

## Translate intent into seven musical layers

1. **Form:** song length, section sequence, bar/energy proportions.
2. **Rhythm:** BPM range, meter, pocket, swing/syncopation, density.
3. **Harmony:** tonal center/mode, harmonic tension, cadence character, rate of change.
4. **Melody:** register, contour, motif behavior, hook interval/mouthfeel.
5. **Timbre:** focal instruments, supporting textures, negative space.
6. **Performance:** vocal persona, articulation, dynamics, ensemble behavior.
7. **Production:** era without trademarks, spatial image, saturation/clarity, transient character, dynamic arc.

A prompt is not a keyword dump. It is an arrangement brief compressed into natural language.

## Style prompt order

Use this order so the model receives priorities clearly:

```text
Genre/fusion; emotional state and energy; tempo/meter/pocket; focal instrumentation; vocal persona and delivery; section-to-section dynamic journey; production and spatial character; ending behavior.
```

Name 3–6 important instruments. Over-specification makes arrangements muddy and generic.

## No named-artist shortcuts

Do not write "in the style of", "sounds like", or named-voice references. Translate a reference into attributes:
- decade or production era;
- vocal range, grain, intimacy, articulation;
- drum pocket and bass behavior;
- harmonic vocabulary;
- arrangement density;
- spatial and saturation choices;
- emotional/dynamic movement.

This produces more original work and avoids imitation/voice-clone requests.

## Vocal persona

Specify a person-like performance, not only gender:
- range: contralto, alto, tenor, baritone, etc.;
- grain: clear, smoky, weathered, breath-edged, dry;
- placement: close-mic, room-present, distant, choir-backed;
- articulation: conversational, legato, clipped, melismatic, restrained;
- arc: almost spoken → sung → open belt → fragile close;
- harmony behavior: unison, thirds, octave doubles, call-response.

Avoid "perfect" or celebrity voice language. Human detail beats generic power.

## Dynamic architecture

Map energy by section. A useful default is not a rule:

```text
Intro 2 → Verse 4 → Pre 6 → Chorus 8 → Verse 5 → Bridge 3/7 → Final Chorus 9 → Outro 2
```

Contrast is the engine: sparse/dense, dry/wet, low/high register, solo/stacked, held/pulsed, silence/impact. The final chorus should change because the story changed.

## Structural and performance tags

Use only high-value tags in lyrics:
- `[Intro]`, `[Verse 1]`, `[Pre-Chorus]`, `[Chorus]`, `[Bridge]`, `[Outro]`;
- one performance cue such as `intimate`, `harmonized`, `spoken`, `stripped`, `full lift`;
- an instrumental cue only when arrangement depends on it.

Keep 1–3 cues per section. Contradictory or crowded tags reduce control.

## Exclusions

Use Exclude Styles to protect the thesis. Typical exclusions:
- unwanted vocal type or choir;
- genre drift;
- excessive distortion, trap hats, festival drops, cinematic swells;
- spoken samples;
- long intro/outro;
- abrupt ending;
- dense midrange for narration beds.

Do not use exclusions to negate half the prompt. If the positive direction is unclear, rewrite it.

## Controlled iteration

1. **One Create action** yields the initial take pair.
2. Review both against the same brief; do not move the goalposts.
3. Name the strongest 15–30 seconds and the single largest failure.
4. Choose one operation: regenerate prompt, replace section, extend, cover, or remaster.
5. Change one dominant variable at a time so learning compounds.

For extensions, restate the core genre, vocal persona, and ending target to reduce drift.

## Troubleshooting

- **Generic output:** strengthen premise, focal instrument, rhythmic pocket, and dynamic contradiction; remove adjectives.
- **Muddy vocal:** reduce instrumentation, request close/dry vocal and restrained midrange, use a sparse verse.
- **Flat song:** define section jobs and explicit energy contrast; add a silence or stripped bridge.
- **Wrong tempo/feel:** state BPM plus pocket (half-time, swung, straight, syncopated).
- **Mispronunciation:** spell out numbers/acronyms and respell the problem word phonetically.
- **Overlong intro:** state immediate vocal entry or exact short intro behavior; exclude long intro.
- **Weak ending:** specify hard stop, final held chord, unresolved cutoff, or long fade.

## Output

Provide one recommended production direction and, only when useful, one deliberate alternate that changes a single thesis variable. Include why the recommendation best serves the emotional contract.

## Shared fundamentals and provider boundary

Read the relevant modules in `https://github.com/frankxai/agentic-music-producer-os/blob/18dc9bee02001befb3a2a3bd7747b78f798dff13/docs/MUSIC-FUNDAMENTALS.md`, then `https://github.com/frankxai/agentic-music-producer-os/blob/18dc9bee02001befb3a2a3bd7747b78f798dff13/docs/PROVIDER-CAPABILITIES.md` and `https://github.com/frankxai/agentic-music-producer-os/blob/18dc9bee02001befb3a2a3bd7747b78f798dff13/docs/MUSIC-FACTORY-CONTRACT.md` when selecting tools or executing production. Canonical public source: https://github.com/frankxai/agentic-music-producer-os. The craft precedes the provider packet.

Suno v6 is the documented baseline checked 2026-10-01; capture the actual account model, settings, limits and credit cost before operating. No official public generation API was verified. Preserve the approved lyrics across adapters. Score/text analysis and a prompt review do not prove audio quality. Record real listening and measurements separately; keep unknown values null. Personal preferences and artist canon remain in their owner project.

Resolve `docs/...` paths from the repository root, not from the skill folder. If using only this skill outside a checkout, read the same named documents from the canonical public source.


## Current craft and production integration

Checked 2026-10-01. Use the public [music fundamentals](https://github.com/frankxai/agentic-music-producer-os/blob/18dc9bee02001befb3a2a3bd7747b78f798dff13/docs/MUSIC-FUNDAMENTALS.md), [provider register](https://github.com/frankxai/agentic-music-producer-os/blob/18dc9bee02001befb3a2a3bd7747b78f798dff13/docs/PROVIDER-CAPABILITIES.md) and [factory contract](https://github.com/frankxai/agentic-music-producer-os/blob/18dc9bee02001befb3a2a3bd7747b78f798dff13/docs/MUSIC-FACTORY-CONTRACT.md). They cover harmony/voice leading, groove, motif, prosody, hooks, form, vocals, arrangement, low end, mixing, measured delivery, provenance and durable jobs. Load only the modules needed for this task.

Keep local artist/persona canon, identity, preferences and account entitlements scoped to this project. Shared craft does not assign a singer or overwrite canon. Select the current account-visible Suno model (documented baseline v6); no official public Suno generation API was verified. Lyria, Eleven Music and fal MiniMax Music 3 have separate documented API routes and constraints. A skill or MCP tool is not a connected generation account.

Preserve approved lyrics across adapters. Prepare, authorize/reserve, submit, reconcile, archive, listen, measure, attest rights and stage release separately. Bind receipts to exact contract/asset hashes. Never infer audio quality, measured BPM, playback, rights or publication from a text review or completed job. Unknown paid submissions remain held for reconciliation; no blind rerender.
