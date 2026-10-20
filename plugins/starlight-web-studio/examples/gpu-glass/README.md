# Glass lab: three.js liquid glass vs CSS glass

The gpu-artist ruled "no WebGL" for the frankx.ai homepage ([decision.md](../frankx-homepage/decision.md)). This lab builds the WebGL version the ruling rejected, with the same content, so the call rests on a measurement instead of a preference.

Open `index.html` through any static server from the `examples/` folder (it loads `../frankx-homepage/media/`). The line under the page says which glass is running and why.

## What it does

One full-screen three.js pass over the hero photograph. Outside the panel it draws the photo unchanged, so it can replace the CSS poster pixel for pixel. Inside the panel's rounded rectangle it refracts the city at the bevel with a slight red/blue split, frosts the interior with a 13-tap blur, darkens toward the FrankX void and adds a rim light. On a mouse, a soft highlight follows the pointer.

The wrapper follows the gpu-artist contract:

- **Poster first.** The CSS background and CSS glass render before any script; the canvas fades in only after its first frame.
- **Capability gate** ([glass-gate.mjs](glass-gate.mjs), 7 tests). It requires WebGL2, a viewport of at least 900px, and no reduced-motion, reduced-transparency or data-saver preference. It also requires at least 4 GB of device memory where the browser reports it.
- **Frame budget.** Twelve probe frames are timed with `gl.finish()`; if the median exceeds 8 ms the page disposes the renderer and keeps the CSS glass.
- **Draw on change only.** It draws on pointer, resize or scroll, never on a loop, and stops while off screen.
- **SRI-pinned** three.js 0.160.0 minified build through an import map. If the hash fails, the module never runs and the CSS glass stays.

## Measured (2026-10-20, Chromium in the Claude desktop browser pane, Intel Arc 140T)

| | CSS glass | three.js glass |
|---|---|---|
| Extra transfer | 0 | 167 KB (three.js, brotli) + 8 KB modules |
| Median frame | n/a (compositor) | 0.05 to 0.40 ms at 1024 and 1440 wide |
| Refraction at the edge | no | yes |
| Safari | `backdrop-filter` with prefix | WebGL2, untested |
| Phone (< 900px) | yes | falls back to CSS by design |

## Verdict

The WebGL glass looks better at the edge, and its frame cost is negligible. It still does not earn the homepage. It adds 167 KB for one panel that most readers see for a few seconds, and on phones it never runs at all. The ruling stands for direction B.

Use this wrapper on an R5 flagship where the glass is the subject, such as a product reveal or an interactive object, rather than a frame around text.
