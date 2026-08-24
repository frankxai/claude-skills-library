# PIPELINE — from premise to delivered cut

> Eight stages. Each has one owner, one artifact, and one gate. A stage does not
> start until the previous artifact exists on disk.

---

## Stage map

| # | Stage | Command | Owner | Artifact | Gate |
|---|---|---|---|---|---|
| 1 | Bible | `/film-bible` | Showrunner | `BIBLE.md` | Turn stated in one line |
| 2 | Characters | `/film-cast` | Dramatist | `CHARACTERS.md` | Word Ledger complete for every principal |
| 3 | Beats | `/film-beats` | Dramatist | `TREATMENT.md` | Turn is located at a timecode |
| 4 | Script | `/film-script` | Voice-Smith | `SCRIPT.md` | `LANGUAGE.md` checklist passes |
| 5 | Look & Sound | `/film-look` | Showrunner + Sound | `LOOK-AND-SOUND.md` | Formal rule declared; sound map exists |
| 6 | Shot list | `/film-shotlist` | Shot Wright | `SHOTLIST.md` | Camera law holds on every row |
| 7 | Generate | `/film-generate` | Wrangler | `assets/` + `LEDGER.jsonl` | Taste Gate per shot |
| 8 | Cut | `/film-cut` | Showrunner | the film | `film-release-gate` |

The order is not negotiable and the temptation to skip to stage 7 on day one is
the reason most AI shorts look like a bin of clips with a title card.

---

## Stage detail

### 1 — Bible

The premise, the turn, the world's rules *as they affect this story only*, and
the formal constraint. Two pages. If it runs to ten, the film is unfocused.

Mandatory fields: logline · the turn (`they think X; actually Y`) · the last
shot · the formal rule · what this film is **not** about.

That last field does more work than it looks like. Writing "this is not about
the war" prevents forty shots of the war.

### 2 — Characters

Per principal: want, wound, what they will not say, the physical asymmetry,
and the **Word Ledger** (5 words only they say, 5 they cannot say, 1 grammatical
tic — see `LANGUAGE.md`).

Also per principal: a **locked visual description** in the exact phrasing that
will be used for character-reference generation, so the same string produces the
same person every time. Wardrobe, age, build, hair, the asymmetry, and one
detail that never changes across the film. This string is copied verbatim; it is
never paraphrased.

### 3 — Beats

Twelve to eighteen beats for a four-minute film. Each beat: who wants what, what
blocks it, what changes. Timecode every beat — a beat sheet without durations is
a wish list, and runtime discipline is where most shorts lose the jury.

Locate the turn explicitly. In a 4:00 film it wants to land between 2:30 and
3:10 — late enough to have been earned, early enough that the audience gets to
live in the new understanding before the credits.

### 4 — Script

Run the generation protocol in `LANGUAGE.md` — want first, eight variants of the
hardest line, human picks, break the meter, subtract three lines. Then the
checklist.

**Subtract-three is not optional.** It is where a competent scene becomes good,
and it is the pass a model will never volunteer.

### 5 — Look & Sound

- **Look:** the formal camera rule, the palette law (including the forbidden
  color, if the film has one), lens language, aspect, grain/texture plan, and
  the three deliberate imperfections from Doctrine Law 5.
- **Sound:** the bed per location, foley on the three key physical actions,
  music in-point and out-point, and the location of the silence. Written *before*
  a frame is generated so picture can be cut to serve it.

### 6 — Shot list

One row per shot. Required columns:

```
id · beat · duration · size · height · movement · subject · light ·
prompt_seed · character_ids · sound_cue · rule_check
```

`rule_check` is a hard yes/no against the film's declared formal rule. Any `no`
either changes or gets a written exception in the bible. Three exceptions and
the rule wasn't real.

Budget **1.4× the shots you think you need.** Coverage is what lets you cut
around a shot that never comes out right, and in generative production some
shots simply never come out right.

### 7 — Generate

Mechanical, high-volume, pipelined per shot.

**Character consistency is the whole ballgame.** Create a character reference
once per principal, get the character ID, and reuse that ID on every shot that
person appears in. Never re-describe a character in a shot prompt hoping to land
the same face — that is how a film ends up with four different protagonists.
Consistency across an asset set is the capability that separates a film from a
moodboard, and it is the main reason to use a platform that supports persistent
character IDs rather than raw per-clip generation.

Per shot, the loop is:
```
prompt variants (Fable) → generate → Taste Gate → keep | retry (max 3) | flag for the Showrunner
```

Log **every** generation to `LEDGER.jsonl`: shot id, model, prompt, seed,
character ids, cost, verdict. Non-negotiable for three reasons — retry needs the
seed, the festival may require a production breakdown, and a film you cannot
reconstruct is a film you cannot defend.

Batch to what a human can screen in one sitting (~12). Screen every batch before
launching the next. A pipeline nobody is watching produces a large bin of
average.

### 8 — Cut

Assemble to the **sound map**, not to the shot list. Picture serves the sound
plan that was written in stage 5.

Then `film-release-gate`. It refuses without the evidence set in
`DOCTRINE.md` § The evidence rule.

Final check is a **1× watch with no scrubbing, by someone who did not make it,**
who is then asked exactly two questions: *what did she want,* and *what changed.*
If they can't answer both, the problem is upstream of the edit and no amount of
re-cutting fixes it.

---

## Failure modes and the stage that causes them

| Symptom | Real cause | Stage to go back to |
|---|---|---|
| "It looks beautiful but I don't care" | No want established before world | 2 |
| Characters sound the same | Word Ledgers missing or leaking | 2 |
| "Feels like a trailer for a film" | No turn, or the turn is information not reversal | 1 |
| Bin of clips, no film | Skipped 3 and 5 | 3 |
| Faces drift | Re-described instead of character-ID reuse | 7 |
| Reads as generic | Formal rule never declared, or broken silently | 5 |
| Great picture, flat impact | Sound started after the cut | 5 |

---

Built on SIP.
