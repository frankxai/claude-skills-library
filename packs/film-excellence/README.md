# film-excellence

A portable pack that makes narrative film and short-form work go through the
same sequence in every repo — the film counterpart to `web-excellence`.

It exists because the constraint in generative filmmaking has moved. Model
access is table stakes; a jury sees the same photoreal clip from thousands of
people. What is scarce is a believable character, designed sound, a formal rule
the film obeys, dialogue that doesn't read as machine-written, and restraint.
Every one of those is a writing and taste problem. This pack forces the budget
there.

## What's in it

| File | What it is |
|---|---|
| [`DOCTRINE.md`](DOCTRINE.md) | The constitution — five laws, the refusal list, the evidence rule |
| [`LANGUAGE.md`](LANGUAGE.md) | **The Spoken Law** — eleven AI-dialogue tells, ten rules that kill them, the Word Ledger technique, the generation protocol |
| [`film-design.md`](film-design.md) | Token contract template — palette, lens, light, texture, sound map, cast locks |
| [`film-taste.md`](film-taste.md) | Restraint test template — the four questions, language/structural/production refusals |
| [`CREW.md`](CREW.md) | Seven chairs, two gates, model routing, and the bake-off protocol for verifying it |
| [`PIPELINE.md`](PIPELINE.md) | Eight stages from premise to cut, with the failure-mode table |
| [`skills/film-release-gate/`](skills/film-release-gate/SKILL.md) | The entry-point skill — sequences the pack, defines done, refuses without evidence |
| [`templates/`](templates) | Story bible, character dossier, shot list schema |

## Install

```bash
packs/film-excellence/install.sh /path/to/your/repo
```

Then one line in the repo's `CLAUDE.md`:

> Film / narrative video work goes through the `film-release-gate` skill first.
> See `.claude/skills/film-release-gate/SKILL.md`.

## The contract shape

Deliberately identical to the web contract already in use across the estate:

- `film-design.md` carries **tokens** (what the film is made of)
- `film-taste.md` carries **refusals** (what it will not be)
- `film-release-gate` **sequences** the specialists and defines the finish line
- A repo's own filled `film-design.md` / `film-taste.md` **outrank every skill**

Nobody has to learn a new operating model — only a new medium.

## Reference builds

Two films built under this doctrine, sharing no palette, no lens language, no
tempo, and no genre — which is the point. The doctrine is a set of forcing
functions, not a style.

- **`Holdfast`** — Arcanea, series-episode. Canon-bound.
  → `frankxai/arcanea` `films/holdfast/`
- **`What He Left Running`** — Starlight, freeform. Canon-free, substrate register.
  → `frankxai/Starlight-Intelligence-System` `films/what-he-left-running/`

Craft lives here so it can be reused; canon stays in the sovereign repo that
owns it. Per SIP § Sovereignty, the substrate does not absorb vertical canon.

---

Built on SIP.
