---
name: film-release-gate
description: Sequences film and short-form narrative work and defines the finish line. Use FIRST for any film, short, series episode, trailer, or narrative video work — before writing a script, designing a shot, or generating a single frame. Also use when asked to review, certify, or ship a cut. Refuses to certify without evidence.
---

# film-release-gate

The entry point for narrative film work. It does two jobs: it **sequences** the
other artifacts in the `film-excellence` pack, and it **defines done**.

It is the film equivalent of `web-release-gate`, and it works the same way:
you don't get to self-certify.

---

## Read order (do not skip)

1. The repo's own `film-design.md` and `film-taste.md` if they exist — **they
   outrank everything below.**
2. `DOCTRINE.md` — the five laws and the refusal list
3. `LANGUAGE.md` — before any dialogue is written
4. `film-design.md` (pack template) — the token contract
5. `CREW.md` — which chair, which model
6. `PIPELINE.md` — the eight stages

---

## Sequence

Refuse to jump stages. The most common and most expensive error in generative
film production is starting at stage 7.

```
1 BIBLE      → turn stated in one line, formal rule declared
2 CHARACTERS → Word Ledger + locked visual string per principal
3 BEATS      → timecoded, turn located between 2:30 and 3:10
4 SCRIPT     → LANGUAGE.md checklist passes
5 LOOK+SOUND → sound map written BEFORE any frame is generated
6 SHOTLIST   → rule_check = yes on every row
7 GENERATE   → character IDs reused, every generation logged
8 CUT        → assembled to the sound map, then this gate
```

If a user asks to "just generate some shots" before stage 5 exists, say what is
missing and what it will cost — a bin of unusable clips and a face that drifts —
then offer the shortest real path: bible and beats first, one hour.

---

## The gate

Certification requires **all** of the following as artifacts, not assertions:

- [ ] **The turn**, in one line, in the form *they think X; actually Y*
- [ ] **The formal rule**, declared, plus the two places it hurt (shot ids)
- [ ] **Sound map**: bed per location · foley on three actions · music in/out ·
      the planned silence with its function and duration
- [ ] **Three hand shots**, timecoded
- [ ] **Three deliberate imperfections**, timecoded
- [ ] **Language pass** logged — the eleven-item checklist from `LANGUAGE.md`
- [ ] **Speech-free ≥ 20%** of runtime, measured not estimated. *Speech-free*
      means nobody is talking; room tone and foley continue. Do not accept a
      signal-free track as evidence — that is a dropout. A deliberate **total
      silence** is a separate, timecoded entry in the sound map
- [ ] **Generation ledger** complete — every shot reconstructible from seed
- [ ] **Cold watch**: one person who did not make it watched at 1× with no
      scrubbing and can answer *what did she want* and *what changed*
- [ ] **Runtime** inside the target window
- [ ] **Submission copy** passes the language refusals in `film-taste.md`

Missing any item → **not certified.** Report which, and the shortest path to
each. Do not soften this and do not average the criteria into a score.

**Never assign a numeric quality score to your own work.** The gate is
pass/fail on evidence. A score is a way of feeling finished without being
finished.

---

## Adversarial pass

Before certifying, run one deliberate hostile read. The prompt to yourself is
not "is this good" — it is:

> **"A jury has watched four hundred of these this week. Give me the three
> sentences they will use to dismiss this one."**

If those three sentences are true, the film is not ready. If you cannot produce
three, you are not looking hard enough — produce them anyway, then check.

---

## Anti-patterns this gate exists to catch

| Pattern | What it actually is |
|---|---|
| "The visuals are stunning" | No turn |
| "It's more of a mood piece" | No want |
| "The music really carries it" | The performances don't |
| "We'll fix it in the edit" | Stage 3 was skipped |
| "Every shot took forty retries" | Character IDs weren't used |
| "I'd give this a 9" | Self-certification |

---

Built on SIP.
