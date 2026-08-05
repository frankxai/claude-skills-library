# THE SPOKEN LAW — dialogue that does not read as machine-written

> The hardest and most valuable layer in the pack. Picture quality has converged
> across the field; language has not. Almost every AI short still gives itself
> away in the first spoken line.

---

## Why AI dialogue is identifiable

Not because it is bad. Because it is *regular*. Eleven tells, in rough order of
how fast they give you away:

| # | Tell | What it sounds like |
|---|---|---|
| 1 | **Theme stated aloud** | "Maybe the real power was inside us all along." |
| 2 | **Abstract nouns** | destiny, purpose, balance, truth, legacy, journey |
| 3 | **Symmetric exchange** | Every question gets a complete, on-topic answer |
| 4 | **Metrical evenness** | Every line lands within a few words of the last |
| 5 | **Emotional self-report** | "I'm afraid." "I feel lost." |
| 6 | **Explaining the known** | Two insiders explaining their own world to each other |
| 7 | **No interruption** | Nobody is ever cut off mid-word |
| 8 | **Name-calling** | "Sarah, you have to understand—" as an ID badge |
| 9 | **Zero subtext** | The line means exactly and only what it says |
| 10 | **Complete sentences** | Nobody trails, fragments, or restarts |
| 11 | **The closing aphorism** | The last line is the moral, polished |

A model produces these because it is trained to be maximally comprehensible.
Real speech is not optimized for comprehension. It is optimized for the speaker
getting what they want while giving away as little as possible.

---

## The ten rules

Each is binary and checkable. `film-release-gate` runs them as a pass.

**1. Nobody names the theme.**
If a line could serve as the film's logline, cut it. No exceptions, no "but it's
earned." It is never earned.

**2. No abstract nouns in dialogue.**
Banned outright: *destiny, purpose, balance, truth, power, legacy, journey,
chosen, fate, darkness, light, hope, meaning, connection.* Characters speak in
concrete nouns and physical verbs. Instead of "you're afraid," a character says
"your hands are shaking." Instead of "we've lost our way," "we passed that rock
already."

**3. Answer the wrong question.**
In every exchange of three or more lines, at least one reply must answer
something that was not asked, or refuse to answer at all. This single rule does
more than the other nine combined. Real conversation is two people talking past
each other with occasional collisions.

**4. Break the meter.**
No two consecutive lines within four words of each other in length. Force
asymmetry: a nine-word line, then a two-word line, then a twenty-word line that
runs out of air.

**5. Every scene has a physical want.**
Under the verbal negotiation, someone wants a thing in the room — the cup, the
chair, the door open, to be touched, to leave. Blocking plays the physical want.
Dialogue plays the verbal one. They should be in tension.

**6. The world is old to them.**
Nobody explains anything they've known since childhood. Terminology is used the
way a nurse says "sats" — flat, fast, unglossed. If the audience needs a term,
they get it once, from behavior, in the background, and never again.
*Corollary: the more canon you have, the less of it belongs in the mouth.*

**7. Interruption budget.**
At least one line per scene is cut off mid-word — by another character, by an
event, or by the speaker abandoning it. Write the fragment; don't write the
whole line and trim in the edit.

**8. Twenty percent silence.**
At least a fifth of runtime has no speech in it. In a four-minute film, that's
forty-eight seconds where the film has to work on picture and sound alone. If it
can't, the script is leaning on dialogue it hasn't earned.

**9. Names cost something.**
A character says another's name only when it does work — as a warning, a plea,
a claim of intimacy, an accusation. Never as identification for the audience.

**10. The last line is mundane.**
The final spoken line should be small, practical, and apparently about
something else, landing on the largest moment in the film. "You'll want a coat."
"It's the third one down." Never the summary.

---

## Positive technique — build a mouth, not a voice

Rules prevent slop. These produce *character*.

### The Word Ledger

Every principal gets, written into their dossier before a line is drafted:

- **Five words only they say.** Drawn from their trade, their region, their
  damage. A stonemason says *bed, course, spall, plumb, green* (green stone =
  freshly quarried, still wet). Nobody else in the film may use them.
- **Five words they cannot say.** Usually the emotional register they avoid.
  A character who cannot say *sorry, scared, stay, please, mine* will spend the
  whole film going around those words, and the audience will feel the shape of
  the hole.
- **One grammatical tic.** Not an accent — a *structure*. Answers questions with
  questions. Never uses contractions. Starts sentences twice. Ends declaratives
  on an upward inflection. Uses the passive voice when lying.

The ledger is the single highest-leverage artifact in the writing phase. Two
characters with different ledgers cannot sound alike even if the same model
writes both.

### Idiolect over dialect

Never write phonetic accent (*"Oi don' rightly know"*). Write **syntax**. Region
and class live in word order and sentence length, not spelling. Phonetic accent
is the mark of an amateur in every medium.

### Load the object

The strongest line in a scene is usually about an object. Grief goes into "the
kettle's broken." Love goes into "I kept your side of the bed made." Route the
emotion through the nearest physical thing in the room and let the actor's face
carry the rest.

---

## Voiceover

**Default: no voiceover.** It is the field's most-abused device precisely
because it's the easiest thing to generate.

VO is permitted only if it passes all three:
1. It is **in scene** — someone is actually speaking, to someone, for a reason.
2. It contains **information the speaker is wrong about.**
3. Removing it would make the film *unclear*, not merely *less atmospheric.*

If it's a disembodied gravelly reflection on what humanity lost, delete it and
you have improved the film.

---

## The generation protocol

How to actually get these lines out of a model.

**Never ask for a scene.** Asking a model for "a scene between X and Y" returns
the center of the distribution — regular, symmetric, thematic. Instead:

1. **Write the want.** Each character's want in the scene, in one line, and what
   they will not say.
2. **Generate eight versions of the single hardest line**, with the Word Ledger
   and the ten rules in context, and an explicit instruction that at least three
   versions must refuse to answer the question.
3. **The human picks.** Not the model. Picking is the authorship.
4. **Pass 2: break the meter.** Feed the assembled scene back with one job —
   vary line lengths, insert the interruption, remove one line entirely.
5. **Pass 3: subtract.** Remove the three lines the scene can survive without.
   There are always three. This pass is where the scene becomes good.

This is a high-volume, high-variance job with a human selector — which is
exactly what to route to a fast model (see `CREW.md`). Structural work — the
turn, the scene order, what the film is about — is not, and stays on the
strongest model available.

---

## Checklist (run before any scene is shot)

- [ ] No line states the theme
- [ ] Zero banned abstract nouns
- [ ] At least one deflected or unanswered question per exchange
- [ ] No two consecutive lines within four words of each other
- [ ] Physical want identified and blocked
- [ ] Nothing explained that both speakers already know
- [ ] At least one interruption, written as a fragment
- [ ] Silence ≥ 20% of scene runtime
- [ ] Names used only when they cost something
- [ ] Final line is mundane
- [ ] Every principal's Word Ledger respected — no cross-contamination

---

Built on SIP.
