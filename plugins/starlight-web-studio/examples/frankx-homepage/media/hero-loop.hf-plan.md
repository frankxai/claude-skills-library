# /hf-plan FrankX: a living hero loop for the studio window

Media producer, 2026-10-20. Read-only plan per `higgsfield-starlight-os`. **Nothing has been uploaded or generated.**

## Outcome and tier

Turn the accepted still (`hero-1440.webp`) into a 5-second seamless loop, so the first screen feels like a room at night rather than a photograph. Tier 3 (evergreen flagship asset). It only ships if the homepage direction B is approved; until then it is a costed option.

Why Higgsfield here: Codex image generation makes stills only, and this job needs image-to-video that starts and ends on the same frame. Claude has no native video generation.

## Route

| | Choice |
|---|---|
| Skill | `higgsfield-generate` |
| Start and end frame | `hero-16x9.png`, 1536×864: the accepted 1536×1024 still (`hero.png`, sha256 `6d28edea…4b61`) with the top 160 px removed, so the desk, lamp and skyline survive the 16:9 output. sha256 `46462e80c86a3953f99a321b50e3c8668fc2a04a59a202db65d52d4ff67ed5a5`. Made locally; not uploaded. |
| Primary model | `kling_o3_flf` (Kling 3.0 Omni, Frames): `start_image` = `end_image` = that frame, so the seam is the same frame |
| Settings | 16:9, 5 s, `mode pro`, `sound off`, `multi_shots false` |
| Comparison | `veo3_1_lite`, start and end frames set (forces 8 s), `generate_audio false` |

## Assets

- **Found:** the accepted still and its packet (`hero.packet.md`); provenance sidecar; FrankX tokens (void `#0a0a0b`, emerald `#10b981`, cyan `#06b6d4`).
- **Missing:** none. No person, voice or likeness is involved, so no Soul ID or consent step applies.

## Brief

Locked-off camera, no movement. Only three things change: the city bokeh drifts slowly left, a few windows in distant towers switch on or off, and the lamp's amber pool breathes very slightly. The desk, laptop, notebook, violin and window frame stay perfectly still. No new objects, no people, no text, no lens flare, no camera shake. The last frame matches the first.

## Cost (checked with `higgsfield generate cost`, 2026-10-20)

| Call | Credits |
|---|---|
| Kling 3.0 Omni Frames, 5 s, pro | 6.25 (std 5) |
| Veo 3.1 Lite, 8 s | 12 |
| One targeted repair, if needed: Kling 3.0 Omni Frames, pro, same frame | 6.25 |
| **Total if all three run** | **24.5** |
| **Cap** | **25 credits** of the 2,601 on the account |

Estimates were made without the frame images, because `generate cost` auto-uploads local files and uploading is not yet approved. Re-run the estimate with `--start-image`/`--end-image` after approval and stop if it exceeds the cap.

## Acceptance (quality gates, no critical dimension below 4)

1. **Seam:** no visible jump when the loop restarts, checked frame by frame at the boundary.
2. **Identity:** every object in the still keeps its shape and position; nothing appears or melts.
3. **Restraint:** motion only in the bokeh, distant windows and the lamp glow; it should read as calm, not as "AI video".
4. **Technical:** encoded to AV1 WebM plus H.264 MP4 at 1440 wide, under 1.5 MB each, muted, `playsinline`.
5. **Page behaviour (motion-director):** the still stays the poster and paints first. The loop starts only on desktop with `prefers-reduced-motion: no-preference` and data saver off. It pauses off screen and resumes on return. Reduced motion shows the still.

## Approvals needed from Frank

1. Upload exactly one file to Higgsfield: `hero-16x9.png`, sha256 `46462e80…d5a5`, derived from the generated-owned render. No other file, brand kit or agent sync.
2. Two paid calls plus at most one Kling repair, capped at 25 credits.
3. Using a loop at all: the motion score has one set-piece (the scroll scene); a living background is a second moving thing on the first screen, and the motion director would need to re-score it.
4. Publishing is a separate approval. A finished loop goes into a draft PR with its provenance sidecar and is not deployed, posted or listed without your word.
