---
name: material-system
description: Give a site one material — a short block in design.md that fixes its metal, field, glass, and depth settings from the brand's tokens — and a surface map that says which route carries the one GPU surface and why. Use when planning shaders, glass, liquid-metal marks, or 3D across a whole site or several sites; when asked how the liquid-logo, shader-backdrop, liquid-glass, and r3f-scene recipes fit together; when a brand wants a signature look that is consistent between its website, Open Graph images, and social clips; or before the first GPU surface lands in a repo. Produces a proposal for the brand owner, then hands each surface to its recipe.
---

# Material system

Four recipes can each make a good surface. Used one request at a time they
make four unrelated effects. This skill decides once, per site, what the
brand's material is and where it appears, so every later surface is a reading
of the same few numbers.

It writes two short things into the repo and builds nothing itself:

1. a **Material block** in `design.md`: the settings every recipe reads
2. a **surface map**: which route has a surface, which kind, and its job

Both change how the brand looks. Draft them as a proposal with rendered
examples and get the brand owner's approval before either lands in `design.md`.

## 1. Read before proposing

- `design.md`, `taste.md` (either case), the Tailwind config or token file.
  Quote every line about gradients, glass, 3D, canvas, and motion.
- What already renders: `grep -rnE "<Canvas|ShaderMount|@paper-design/shaders|@react-three/fiber" app components`.
- `node .claude/skills/web-steward/peer-check.mjs --root .` An unmet peer
  under an existing scene is fixed before anything is added.

A taste file that refuses decorative gradients, glass stacks, or 3D has
already answered part of this. Leave those rows of the block as `none` and
say which line decided it. For some sites the right material is paper and
type, and the whole block is `none`.

## 2. The Material block

Add it to `design.md` under its own heading. Every value is a token name or a
number; no raw colour that is not already a token.

```markdown
## Material

| Layer | Setting | Value |
|---|---|---|
| tempo | base speed | 0.2 |
| metal | tint / back | `--accent` / transparent |
| metal | repetition, softness, shiftRed, shiftBlue, contour, angle | 2, 0.1, 0.25, 0.1, 0.4, 70 |
| field | colors | `--surface`, `--surface-2`, `--accent`, `--accent-soft` |
| field | distortion, swirl, grain | 0.7, 0.3, 0.15 |
| glass | surface, tint, blur, refract | `--surface`, 0.55, 14, no |
| depth | job | none |
| stills | mark frame, field frame, scene time | 3200, 42000, none |
```

How the recipes read it:

- **tempo** is the one speed. `shader-backdrop` uses it as is; `liquid-logo`
  uses three times it; an `r3f-scene` scales its motion by it. Change one
  number and the whole site moves together.
- **metal** → `liquid-logo` props. **field** → `shader-backdrop` props.
  **glass** → `liquid-glass` props. **depth** → the job sentence an
  `r3f-scene` must serve, or `none`.
- **stills** are the frame numbers. They are the brand's fixed images of its
  own motion (section 4).

## 3. The surface map

One table, kept beside the Material block. Default is `none`.

```markdown
## Surface map

| Route | Surface | Job |
|---|---|---|
| `/` | field | Sets the temperature behind the headline |
| `/brand` | metal (live mark) | The mark is the subject of the page |
| `/product` | depth | Turn the device to show the port side |
| every other route | none | |
| header, footer | metal still (image) | The mark, without a canvas on every page |
```

Rules the map must pass:

- **One row per route, one surface per row.** Glass is CSS and does not take
  a row; it appears wherever content needs to sit over an image or a surface.
- **Header and footer never hold a live surface.** They render on every page.
- **Routes people read on have none**: articles, docs, pricing tables, forms,
  checkout, account pages.
- **Each job sentence names what the surface does for the reader.** Cut any
  row whose job is appearance.
- Count the rows that are not `none`. Three on a whole site is already a lot.

## 4. One frame number, three outputs

A Paper shader draws from `frame`, milliseconds into its animation, and the
same number gives the same pixels on any machine. So each layer's entry in
`stills` yields three things that match exactly:

| Output | How | Used for |
|---|---|---|
| Live | The recipe's wrapper with `stillFrame` | The one route in the surface map |
| Still | `export.mjs --still <frame>` | Reduced motion, the header mark, Open Graph images, print |
| Loop | `export.mjs --loop --from <frame> --pingpong` | Social clips, a `<video>` where a canvas is not allowed |

`liquid-logo` section 6 has the commands. The site's reduced-motion render,
its share image, and the first frame of its social clip are then the same
picture, without anyone matching them by eye. Exported media goes through the
repo's own asset review before it is published.

An `r3f-scene` has no frame number. Its still is a screenshot at `stillTime`.

## 5. Order of work

1. Fix unmet peers (`web-steward`).
2. Propose the Material block and the surface map, with one rendered example
   per layer that is not `none`. Get approval.
3. Build one surface, the highest-value row, through its recipe.
4. Prove it (`gpu-surface` section 4) and export its still.
5. Only then the next row. Each surface is its own change with its own proof.

## 6. Across several sites

Each site keeps its own block in its own `design.md`; brands do not share a
material. What they share is the shape of the block, the recipes, and the
probe. To compare sites, read their blocks side by side: two brands with the
same `field` colours and `tempo` will look like one brand.

## Refusals

- A Material block or surface map merged without the brand owner's approval.
- Raw colours in the block.
- A surface built before its row exists in the map.
- A map with a surface on every route.
- One brand's block copied into another brand's repo.
