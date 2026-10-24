---
name: suno-prompt-architect
description: "Convert a finished creative brief and lyrics into a precise Suno Custom Mode packet: title, style, exclusions, structure/performance tags, pronunciation notes, and one controlled alternate. Use before any Suno browser generation."
version: 3.0.0
---

# Suno Prompt Architect

## Input requirement

Do not prompt from a vague mood alone when the full workflow is requested. First establish:
- listener/use case;
- emotional start → turn → ending;
- song form and duration intent;
- lyric or instrumental status;
- sonic thesis and negative space.

If lyrics are part of the work, run `lyric-composer` first. For meditations, run `guided-meditation-composer` and prefer a separate instrumental bed.

## Build this exact packet

### TITLE

Concrete, memorable, easy to pronounce. Usually 1–5 words. Avoid generic mood labels.

### MODE

- Custom Mode: on.
- Instrumental: on only for a true instrumental/meditation bed.
- Model: choose the newest stable model visible in UI at execution time.

### STYLE

Write one compact natural-language paragraph in priority order:

```text
<genre/fusion and era attributes>; <emotional state>; <BPM/meter/pocket>; <focal instruments and negative space>; <vocal persona/delivery or no vocals>; <section dynamic journey>; <mix/spatial character>; <ending>.
```

Use semicolons to separate layers. Prefer specific verbs and acoustic behavior over long adjective lists.

### EXCLUDE STYLES

List only the highest-risk drift: 3–8 concise exclusions.

### LYRICS / STRUCTURE

Use clean tags and whitespace. Put performance cues in the section heading only when needed. Example:

```text
[Intro - sparse, 4 bars]

[Verse 1 - close, conversational]
...

[Pre-Chorus - rising]
...

[Chorus - open, harmonized]
...

[Bridge - stripped]
...

[Final Chorus - full lift]
...

[Outro - intimate hard stop]
...
```

Do not add production prose between every lyric line.

### PRONUNCIATION NOTES

List only risky names, numbers, acronyms, multilingual words, or deliberate stretched vowels. Apply phonetic fixes directly in the lyrics after approval.

## Prompt checks

- No named artists, bands, songs, labels, franchises, or cloned voices.
- No contradictory genre, tempo, vocal, or energy instructions.
- No impossible precision disguised as control.
- No more than one main vocal persona.
- Style and lyrics describe the same dynamic arc.
- Exclusions do not negate the positive prompt.
- The strongest words appear early.
- The ending is specified.

## Controlled alternate

Create an alternate only when it tests one useful variable, such as:
- pulse: free-time vs 72 BPM;
- texture: organic acoustic vs glassy electronic;
- vocal delivery: restrained close-mic vs open ensemble chorus.

Keep hook, lyrics, and emotional contract fixed. State the single variable changed.

## Final delivery

Return:
1. recommended title;
2. full copy/paste STYLE field;
3. EXCLUDE STYLES field;
4. complete LYRICS field (or `instrumental, no vocals`);
5. pronunciation notes;
6. one-sentence reason this packet serves the brief;
7. optional one-variable alternate.

Before browser execution, write the packet into the run's `style-prompt.md` and run the taste gate.

## Shared fundamentals and provider boundary

Read the relevant modules in `https://github.com/frankxai/agentic-music-producer-os/blob/18dc9bee02001befb3a2a3bd7747b78f798dff13/docs/MUSIC-FUNDAMENTALS.md`, then `https://github.com/frankxai/agentic-music-producer-os/blob/18dc9bee02001befb3a2a3bd7747b78f798dff13/docs/PROVIDER-CAPABILITIES.md` and `https://github.com/frankxai/agentic-music-producer-os/blob/18dc9bee02001befb3a2a3bd7747b78f798dff13/docs/MUSIC-FACTORY-CONTRACT.md` when selecting tools or executing production. Canonical public source: https://github.com/frankxai/agentic-music-producer-os. The craft precedes the provider packet.

Suno v6 is the documented baseline checked 2026-10-01; capture the actual account model, settings, limits and credit cost before operating. No official public generation API was verified. Preserve the approved lyrics across adapters. Score/text analysis and a prompt review do not prove audio quality. Record real listening and measurements separately; keep unknown values null. Personal preferences and artist canon remain in their owner project.

For MiniMax Music 3, translate section tags to their own lines; never share inline Suno performance tags blindly. For Eleven Music, use a prompt or a chunk plan and preserve exact approved lyric text. For Lyria, treat duration and harmony as requested direction. These are separate provider packets, not Suno endpoints.

Resolve `docs/...` paths from the repository root, not from the skill folder. If using only this skill outside a checkout, read the same named documents from the canonical public source.


## Current craft and production integration

Checked 2026-10-01. Use the public [music fundamentals](https://github.com/frankxai/agentic-music-producer-os/blob/18dc9bee02001befb3a2a3bd7747b78f798dff13/docs/MUSIC-FUNDAMENTALS.md), [provider register](https://github.com/frankxai/agentic-music-producer-os/blob/18dc9bee02001befb3a2a3bd7747b78f798dff13/docs/PROVIDER-CAPABILITIES.md) and [factory contract](https://github.com/frankxai/agentic-music-producer-os/blob/18dc9bee02001befb3a2a3bd7747b78f798dff13/docs/MUSIC-FACTORY-CONTRACT.md). They cover harmony/voice leading, groove, motif, prosody, hooks, form, vocals, arrangement, low end, mixing, measured delivery, provenance and durable jobs. Load only the modules needed for this task.

Keep local artist/persona canon, identity, preferences and account entitlements scoped to this project. Shared craft does not assign a singer or overwrite canon. Select the current account-visible Suno model (documented baseline v6); no official public Suno generation API was verified. Lyria, Eleven Music and fal MiniMax Music 3 have separate documented API routes and constraints. A skill or MCP tool is not a connected generation account.

Preserve approved lyrics across adapters. Prepare, authorize/reserve, submit, reconcile, archive, listen, measure, attest rights and stage release separately. Bind receipts to exact contract/asset hashes. Never infer audio quality, measured BPM, playback, rights or publication from a text review or completed job. Unknown paid submissions remain held for reconciliation; no blind rerender.
