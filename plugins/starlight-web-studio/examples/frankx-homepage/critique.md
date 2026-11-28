# Critique: frankx.ai homepage prototype

Critic: Codex (OpenAI, `codex exec`, read-only sandbox), a different provider from the maker (Claude). Prompted as the buyer in [brief.md](brief.md) who looked and did not sign up, then as a front-end reviewer. 2026-10-20.

## Round 1: revise

| Finding | Severity | Fix in the next revision |
|---|---|---|
| Every "Inspect" link was `href="#"`; the promised free thing could not be taken | P1 | Real links: frankx.ai `/ai-architecture`, `/acos`, `/library`, `/blog` (each returned 200) |
| The panel was a labelled-illustrative checklist, not proof | P1 | Replaced with public evidence: issue #76 and PR #77 |
| Claims of personal use, local execution and "a second model on every change" were unproven | P1 | Removed or narrowed to what a stranger can check |
| No standard viewport meta, so phones could get the desktop pin | P1 | `width=device-width, initial-scale=1, viewport-fit=cover`, zoom kept |
| Inactive rows at 0.45 opacity fell below text contrast | P1 | Text stays opaque; the active row gets a background and marker |
| The phone crop led with the violin, not the work | P2 | Re-cut at 0.47 of the width: window, desk, laptop, notebook |
| Glass at 6% white with no fallback | P2 | Dark base, `@supports not (backdrop-filter)` and reduced-transparency paths |
| Row state read raw scroll progress while the veil was smoothed | P2 | Both follow the smoothed timeline's progress |
| A queued frame could relight the glass after pointerleave | P2 | Pending frame cancelled on leave, cancel and preference change |

## Round 2: revise

Seven of nine round-1 findings confirmed fixed; two partly.

| Finding | Severity | Fix |
|---|---|---|
| Issue #76 (the audit) and PR #77 (the plugin) shown as one "recorded run"; "11 agents" counted definitions, not participants; "every step on the record" overclaimed | P1 | Relabelled "Development snapshot"; "11 specialist roles"; review row links the PR comment that reports the six rounds; deck and note say only what the links show |
| A touchscreen on a hybrid laptop could light the glass | P2 | Highlight responds to `pointerType === 'mouse'` only |
| `aria-live` on the step count made the scroll replay chatter to screen readers | P2 | Live region removed; the count is `aria-hidden`, the rows carry the state |

Round 3 was not run. Remaining unverified: Safari rendering, a real touch device, live browser interaction (see [handoff.md](handoff.md)).
