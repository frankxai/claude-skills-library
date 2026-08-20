# CREW — the agent team, and which model runs which chair

> A film crew is small. The failure mode of agentic production is a forty-agent
> org chart that produces committee output. Seven chairs and two gates.

---

## The chairs

| # | Chair | Owns | Does **not** do | Volume |
|---|---|---|---|---|
| 1 | **Showrunner** | The turn, the spine, every cut decision | Generation, prompt-writing | Low, decisive |
| 2 | **Canon Keeper** | Consistency with the world's locked canon | Story structure, taste calls | Low, blocking |
| 3 | **Dramatist** | Beat sheet, scene order, where the turn lands | Dialogue lines, shot design | Medium |
| 4 | **Voice-Smith** | Dialogue passes under `LANGUAGE.md` | Deciding which line ships | **Very high** |
| 5 | **Shot Wright** | Script → shot list under the camera law | Executing generation | Medium → high |
| 6 | **Wrangler** | Generation batches, character IDs, seeds, retries, the asset ledger | Any creative judgment | **Very high, mechanical** |
| 7 | **Sound Designer** | Bed, foley, music map, the silence | Picture | Medium |

Plus two **gates**. Gates are not crew — they refuse, they don't contribute:

| Gate | Question | Authority |
|---|---|---|
| **Taste Gate** | "Does this land on anything in the refusal list?" | Blocks. Adversarial by design. Prompted to find the reason this is generic, not to praise. |
| **Continuity Gate** | "Does this contradict the bible, the canon, or an earlier shot?" | Blocks. Checks faces, wardrobe, light direction, prop state, time of day. |

**The Showrunner is a human.** Every chair drafts; the Showrunner picks. That
distinction is the entire authorship claim of the project and it should not be
delegated to save time — it is the only step that cannot be reconstructed later.

---

## Model routing

The routing principle is **job shape, not job importance**:

- **Judgment, structure, refusal, single-shot correctness** → strongest model.
  These are low-volume, high-consequence, and a wrong answer is expensive.
- **Variance generation with a human selector** → fastest capable model.
  These are high-volume and a wrong answer costs one discarded candidate.
- **Deterministic mechanical work** → mid-tier. No reasoning premium to pay.

| Chair | Model | Why |
|---|---|---|
| Showrunner | Opus 5 (+ human) | Every decision is irreversible in the edit |
| Canon Keeper | Opus 5 | Blocking authority; false negatives corrupt the world |
| Dramatist | Opus 5 | Structure is the highest-leverage artifact in the film |
| **Voice-Smith** | **Fable 5** | 8–12 line variants per beat, human picks one. Highest-volume creative-variance job in the pipeline |
| Shot Wright | Opus 5 → **Fable 5** | Opus designs the shot grammar once; Fable expands each shot into prompt variants |
| Wrangler | Sonnet 5 | API orchestration, retries, ledger writes. No judgment |
| Sound Designer | Sonnet 5 → Opus 5 | Sonnet for the map, Opus for the one moment sound carries alone |
| Taste Gate | Opus 5 | Adversarial refusal needs the strongest reader |
| Continuity Gate | Sonnet 5 | Checklist comparison against the bible |

### On Fable 5 specifically

Fable 5 is routed to the two jobs whose shape is *many diverse candidates, one
human selection*: dialogue variants and shot-prompt variants. That is a
throughput-and-diversity problem, not a judgment problem, and it is where a fast
model is worth more than a slow one — because the value comes from the *spread*
of the candidate set and the human's pick, not from any single candidate being
right.

**Verify this before committing the pipeline to it.** Run the bake-off below in
week 1 rather than trusting the routing table. Half a day of measurement beats a
month of a wrong assumption, and this pack's own doctrine says not to take
capability claims on faith.

#### Bake-off protocol (~30 minutes, run once)

1. Take one hard beat from the actual script — an exchange where a character
   must refuse to answer.
2. Give three models the identical context: the beat, both Word Ledgers, the ten
   rules from `LANGUAGE.md`.
3. Request twelve variants from each. Strip attribution.
4. Score each variant blind on four binaries: *breaks meter · deflects ·
   zero abstract nouns · has subtext.* Count 4/4s per model.
5. Also score **spread** — how many of the twelve are meaningfully different
   from each other, rather than twelve rewordings of one idea. For this job
   spread matters more than peak.
6. Route the chair to whichever model wins on `4/4 count × spread`, at the
   lowest cost that wins. Record the result in the film's `BIBLE.md`.

Re-run when a model version changes. Don't re-run per scene.

---

## Interaction rules

Borrowed from the substrate's `VOICES.md` because the failure mode is identical —
agents that agree with each other produce mush.

- Order in a review: **Dramatist → Voice-Smith → Sound Designer → Taste Gate → Showrunner.**
  The Taste Gate always speaks second-to-last, and the Showrunner last.
- Each chair gets **five sentences** in reflection mode, **three** in decision mode.
- A chair with nothing to add says so in one sentence. Fabricated notes are worse
  than no notes.
- **The Taste Gate may not be overruled by another chair** — only by the human
  Showrunner, on the record, with the reason written into the film's bible. If
  the gate is overruled more than twice in a production, the gate is
  miscalibrated or the film is in trouble; either way, stop and look.
- No chair may hold two roles on the same scene. The Voice-Smith does not get to
  approve its own lines; that is what produces the confident average.

---

## Parallelism

Shots are independent. Beats are not.

- **Writing is serial.** Bible → beats → script → shot list. Fanning this out
  produces four incompatible films. One chair at a time, in order.
- **Generation is a pipeline, not a barrier.** Each shot runs
  `prompt-variants → generate → taste-check → keep or retry` on its own clock.
  Shot 14 can be in retry while shot 3 is still generating. Never wait for all
  shots at one stage before starting the next — that costs you the difference
  between the slowest single chain and the sum of the slowest per stage, which
  on a 60-shot film is days.
- **Sound runs parallel to picture from the beat sheet onward.** It does not
  wait for a cut. This is the discipline that produces designed sound rather
  than laid-on music, and it is the single biggest reason to start it early.
- **Cap concurrency at what a human can review.** Sixty shots generating at once
  and nobody watching is how a film becomes a bin of clips. Batch to what the
  Showrunner can actually screen in a sitting — roughly 12.

---

Built on SIP.
