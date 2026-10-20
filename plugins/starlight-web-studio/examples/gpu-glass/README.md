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
- **One teardown.** A preference turned on mid-visit, a resize below 900px, a lost WebGL context or a failed image load all release every listener, observer and GPU resource and return to the CSS glass. The breakpoint and lost-context paths were checked in the browser.
- **SRI-pinned** three.js 0.160.0 minified build through the import map's `integrity` field. Browsers that enforce it refuse a changed file, and the CSS glass stays. Browsers without import-map integrity support load it unchecked; a production build should bundle or self-host three.js instead.

## Measured

One device, one browser: Chrome 152 in the Claude desktop browser pane, Intel Arc 140T, device pixel ratio 1, viewports 1024×609 and 1440×900, 2026-10-20. Frame time is the median of 12 probe frames, each timed around `render()` plus `gl.finish()`. That covers GPU work for the pass but not page compositing. The probe itself blocks the main thread for about 12 frames' worth (under 5 ms here) at startup.

| | CSS glass | three.js glass |
|---|---|---|
| Extra transfer | 0 | 167 KB (three.js, brotli) + 10 KB modules (uncompressed) |
| Median frame | n/a (compositor) | 0.05 to 0.40 ms at 1024 and 1440 wide |
| Refraction at the edge | no | yes |
| Safari | `backdrop-filter` with prefix | WebGL2, untested |
| Phone (< 900px) | yes | falls back to CSS by design |

## Verdict

The WebGL glass looks better at the edge, and on this device its frame cost was well under the 8 ms budget. That is one sample, not a fleet; slower GPUs are what the probe and fallback exist for. It still does not earn the homepage. It adds 167 KB for one panel that most readers see for a few seconds, and on phones it never runs at all. The ruling stands for direction B.

The wrapper is the starting point for an R5 flagship where the glass is the subject, such as a product reveal or an interactive object, rather than a frame around text. Re-measure on that page's slowest target device before shipping.

## Review

Codex (a different provider) reviewed the first version: "revise". The fixes since:
- one teardown for every fallback path;
- the drawing buffer's real size in the shader, so fractional sizes and DPR no longer offset the panel;
- a re-check at the 900px breakpoint;
- context-loss handling;
- the qualified measurement and SRI notes above.

One finding was declined. It claimed the cover-UV axes were reversed, but a screen wider than the image (`sr > ir`) crops the image vertically, which is the axis the shader crops, matching CSS `cover`.
