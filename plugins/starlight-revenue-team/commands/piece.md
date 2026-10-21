---
description: Produce one content piece for a brand - brief, the operator's own material, research, draft, refinement pass, second-provider score, then a scheduler draft only
argument-hint: <brand> <topic>
---

Load the `revenue-protocol` skill. Brand and topic: $ARGUMENTS

Work in `.studio/pieces/<brand>-<slug>/` and keep every stage's file.

1. `brief.md`: the reader in one sentence, the existing piece this must beat and on
   which dimension, the one thing the reader should do afterwards, and the channel.
   Without a named piece to beat, stop and find one.
2. `sources.md`: start from the operator's own material (their notes, transcripts,
   published work). Research supplies evidence, never the angle. Use the harness's
   built-in web search first; a paid scraper only after a built-in call failed, and
   name that call.
3. `draft.md`: written for the channel in the brief. If the environment has a voice
   or polish agent (for example `content-polisher` or `social-content-generator`),
   use it; otherwise write it yourself.
4. `refined.md`: a separate pass whose only job is cutting and sharpening. Save the
   diff between draft and refined as `refinement.diff`.
5. Run `/critic` on `refined.md`. It writes `score.json`, checked by
   `bin/rubric-check.mjs`.
   - ship (26 or more, independent): continue
   - revise (22 to 25): one more refinement pass, then score again
   - restart or missing-independent: stop and report
6. Images: every generated image gets a provenance sidecar beside it with the
   prompt, model and provider. No sidecar, no image.
7. Save the piece as a draft in the operator's scheduler if one is connected
   (Postiz or Taplio drafts). Otherwise leave `final.md` for them.

This command never publishes, schedules a send, posts, or emails. The operator
presses send.
