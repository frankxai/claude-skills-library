# DOCTRINE — how we make films that don't read as AI films

> The constitution of the pack. Everything else in `film-excellence` implements this.
> Where this file and a skill disagree, this file wins. Where a repo's own
> `film-design.md` / `film-taste.md` and this file disagree, the repo wins.

---

## The premise

Every entrant has the same models. Model access is not a differentiator and has
not been one since roughly the middle of 2025. Compute is table stakes; a jury
sees the same photoreal 8-second clip from four thousand people.

What is still scarce, in order of scarcity:

1. **A character someone believes in inside twenty seconds.**
2. **Sound that was designed rather than dropped on.**
3. **A formal rule the film obeys** — a self-imposed constraint that a viewer
   feels without being able to name.
4. **Dialogue that doesn't sound written by a language model.**
5. **Restraint** — the willingness to not use a capability you have.

Every one of those is a writing and taste problem, not a generation problem.
That is where our budget goes. This pack exists to force that allocation.

---

## The five laws

### Law 1 — Constraint before capability

Before any generation, the film declares a **formal rule it will not break**:
one camera law, one color law, one sound law. The rule must be simple enough to
state in a sentence and strict enough to hurt at least twice during production.

Examples of real rules (pick your own, don't reuse these):
- The camera never rises above standing eye-height until the final shot.
- Exactly one saturated color exists in the film, and it appears for four seconds.
- No cut happens on a movement; every cut lands on stillness.
- The film contains no visible screen, interface, or readable text.

A film with no declared rule is a reel, not a film. Juries can tell the
difference and so can audiences, even when they can't articulate why.

**Why this works:** a model's default output is the statistical center of its
training distribution. A constraint is the cheapest possible way to move off
that center in a direction you chose, rather than a direction noise chose. It
converts "the model made this" into "someone decided this."

### Law 2 — The turn is the film

A 3–5 minute film gets **one** reversal. Not three. One thing the audience
believed at 0:30 must be false at 3:00, and the falseness must recontextualize
everything before it rather than merely adding information.

Write the turn first. Write the last shot second. Everything between them is
service.

If you cannot state the turn as *"they think X; actually Y"* in one line, there
is no film yet and no amount of production value will install one.

### Law 3 — Earn the face

The audience must want something for a specific person before the world gets
explained. Not sympathy — *want*. They must want them to get the thing, open the
door, say the sentence.

Practical test: cut your first sixty seconds and ask a stranger "what does she
want?" If they answer with a plot fact ("to escape") rather than a human want
("to be believed"), the opening is world-building wearing a character costume.

World-building is the most seductive failure mode available to anyone with a
canon this large. Canon is a resource for the *background* of shots. It is not
the subject.

### Law 4 — Sound is half the film and gets half the discipline

The single largest quality gap in the AI film field is audio. Most entries are
picture with music laid over. That is a slideshow with a soundtrack.

Minimum bar for anything shipped from this pack:
- A **continuous spatial bed** per location, running under everything.
- **Foley on the three most important physical actions** in the film.
- At least one moment where the sound design carries a beat the picture does not.
- Music enters late and leaves before the end. If music is running under the
  final image, you didn't trust the image.

**A definition, because it gets misread every time.** When this pack says
*silence*, it means **speech-free** — nobody is talking. It says nothing about
what the bed is doing. Usually room tone, foley, and the location bed keep
running underneath, and the 20% budget is never asking for a signal-free track,
because that reads as a dropout rather than as silence.

If a film wants a truly signal-free moment, that is **total silence** — name it,
put it in the sound map with a timecode, and spend it once. It is one of the
loudest events available in the medium, which is exactly why it does not survive
being used twice.

**Total silence is a *subset* of speech-free, not a sibling.** A signal-free
moment obviously has no speech in it, so it counts toward the 20% budget and is
described separately in the sound map. Treating the two as mutually exclusive
produces a contract that contradicts itself — a beat listed under "the bed keeps
running" that is also the beat where the bed stops. Say which beats have the bed
running and which do not; do not try to sort the beat into one bucket.

### Law 5 — Imperfection is a signature

Model output trends toward clean, symmetric, well-lit, and unblemished, because
that is what "good" looks like in aggregate. Aggregate-good reads as nobody.

Deliberately introduce, and keep:
- At least three shots where something goes physically wrong in frame — dust
  obscures the subject, a flare wrecks the composition, focus misses and
  recovers.
- One asymmetry on every principal face: a scar, a crooked tooth, chapped lips,
  a lazy eye, sweat, a badly healed break. Written into the character sheet so
  it persists.
- **Hands, deliberately, three times.** Close, doing a real task. The field
  avoids hands because models used to fail at them. Shooting hands on purpose
  reads as confidence to anyone who knows the medium — and everyone on a jury
  knows the medium.

---

## The refusals

These are not stylistic preferences. They are the statistical center of the
field, and landing on any of them costs you the "who made this" question.

**Openers we do not shoot:** drone over a city at dusk · an eye opening in
extreme close-up · rain on neon · a hand reaching toward light · a hooded
figure walking away from camera · dust motes in a cathedral shaft · a slow
turn-to-camera in slow motion · a title card over a black screen with a low
drone.

**Grammar we do not use:** the 360° orbit · the hero walking toward camera not
looking at the explosion · the infinite push-in used on every shot because the
model does it well · unmotivated slow motion · a dolly zoom deployed for any
reason other than the one Hitchcock had.

**Palettes we do not grade to:** teal-and-orange · the purple-cyan gradient that
every image model reaches for when asked for "cinematic" · bloom on everything ·
pure black crush with no shadow detail.

**Sound we do not use:** the braaam · riser → silence → drop · generic epic
choir · "cinematic whoosh" as a transition · a needle-drop that tells the
audience how to feel thirty seconds before they'd have felt it.

**Faces we do not cast:** the beautiful blank. Symmetric, unlined, ageless,
expressionless. It is the model's default human and it is nobody.

**Structures we do not write:** the voiceover that explains the world · the
mentor who arrives to deliver rules · the montage of training · the final line
that states the theme · anything that could be described as "a lone survivor
in a ruined world reflects on what humanity lost."

---

## The evidence rule

Nothing ships as "done" on assertion. `film-release-gate` refuses to certify a
cut without:

- the declared formal rule, and the two places it hurt
- the turn, stated in one line
- a sound map showing bed / foley / music-in / music-out
- the three hand shots, timecoded
- a language pass logged against `LANGUAGE.md`
- a full-film watch at 1× with no scrubbing, by someone who did not make it

Self-assigned scores are not evidence. "It looks great" is not evidence. This
mirrors the `web-release-gate` contract and works for the same reason: the
person who made the thing is the worst available judge of it.

---

## What this doctrine is not

It is not a style. Two films built under it should not look alike — the two
reference builds (`holdfast`, `what-he-left-running`) deliberately share no
palette, no lens language, no tempo, and no genre.

It is a set of forcing functions against the specific way generative tools fail:
by producing the average of everything, beautifully.

---

Built on SIP.
