# Shot list schema

One row per shot. Budget **1.4× the shots you think you need** — coverage is
what lets you cut around a shot that never comes out right, and in generative
production some shots never do.

## Columns

| Column | Type | Notes |
|---|---|---|
| `id` | `S001` | Stable. Never renumber; the ledger references it. |
| `beat` | int | Which beat from `TREATMENT.md` |
| `duration` | seconds | Sums to the runtime target. Check this early. |
| `size` | `ECU\|CU\|MCU\|MS\|WS\|EWS` | |
| `height` | `ground\|knee\|table\|chest\|eye\|above` | The column that enforces most camera laws |
| `movement` | `locked\|pan\|tilt\|dolly\|handheld\|rack` | `locked` should dominate. If it doesn't, ask why. |
| `subject` | text | |
| `light` | text | Name the in-world source. Unmotivated light reads as rendered. |
| `prompt_seed` | text | The generation prompt, minus character description |
| `character_ids` | list | **Reused IDs, never re-descriptions.** |
| `sound_cue` | text | From the sound map in `film-design.md` |
| `rule_check` | `yes\|no` | Hard check against the declared formal rule |
| `status` | `pending\|generating\|kept\|retry\|flagged` | |
| `takes` | int | Retry count. Cap 3, then flag to the Showrunner. |

## Rules

- **`rule_check = no` is not allowed to ship.** Either the shot changes or the
  bible records a written exception. Three exceptions and the rule wasn't real.
- **`character_ids` is never empty on a shot with a person in it.** A shot that
  re-describes a character in `prompt_seed` is a face-drift bug waiting to
  happen, and it is entirely self-inflicted.
- **`takes > 3` escalates.** Do not grind. A shot that will not come out is
  usually a shot that is wrong, and the fix is upstream in the shot list.
- **`movement = handheld` requires a written justification.** If the camera has
  a body, the film is claiming something. Claim it once.

## CSV header

```csv
id,beat,duration,size,height,movement,subject,light,prompt_seed,character_ids,sound_cue,rule_check,status,takes
```

## Generation ledger

Separate file, `LEDGER.jsonl`, one line per generation attempt — not per shot:

```json
{"shot":"S014","attempt":2,"model":"<model>","prompt":"<full>","seed":"<seed>",
 "character_ids":["<id>"],"cost":0.00,"verdict":"retry","reason":"eyeline wrong",
 "ts":"<iso8601>"}
```

Non-negotiable for three reasons: retry needs the seed, a festival may require a
production breakdown, and a film you cannot reconstruct is a film you cannot
defend.

---
Built on SIP.
