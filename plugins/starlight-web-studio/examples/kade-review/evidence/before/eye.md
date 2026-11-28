# Browser layer: `http://127.0.0.1:8765/before.html`

**8.5 / 25** · measured in Chromium; lab profile 4x CPU, 150 ms RTT, 1600 kbps

| Dimension | Score |
|---|---|
| speed | 4.5 / 5 |
| access | 0 / 5 |
| mobile | 1 / 5 |
| type | 2.5 / 5 |
| composition | 0.5 / 5 |

## Measures

- LCP 1552 ms (p.lead) · CLS 0.0554 · TBT 0 ms · blocked before first paint 351 ms · 2 requests, 9 KB
- Median measure 173.5 cpl over 2 paragraph(s)
- Type scale: 11 sizes, ratio spread 0.384
- Spacing on a 4 px grid: 0%
- Strongest left edges at 1440: 27px×14, 49px×4, 0px×3, 145px×3, 345px×3, 460px×3, 520px×3, 991px×2
- First screen: phone h1 yes, 3 action(s); desktop h1 yes, 0 action(s)
- Keyboard: 8 stops, 8 without visible focus · reduced motion: 1 running animation(s) · dark scheme: not answered

## Findings

- **P0** `mobile/overflow-x` The page is 292px wider than a 375px screen; it scrolls sideways.
  - div
  - div.num
  - h3
  - p
  - table.spec
- **P1** `access/contrast` 27 text block(s) below WCAG AA contrast on a solid background.
  - a "Studio" 4.48:1 (needs 4.5)
  - a "How" 4.48:1 (needs 4.5)
  - a "Price" 4.48:1 (needs 4.5)
  - a.btn.primary "Book a call" 2.99:1 (needs 4.5)
  - p.lead "We believe the future of work is fluid. " 2.81:1 (needs 4.5)
- **P1** `access/no-name` 2 link(s) or button(s) without an accessible name.
  - a
  - a
- **P1** `access/lang` The html element has no lang.
- **P1** `access/img-alt` 1 image(s) without an alt attribute.
  - img
- **P1** `access/focus-invisible` 8 of 8 keyboard stops show no visible focus change.
  - a
  - a
  - a
  - a
  - a
- **P1** `mobile/target-tiny` 5 tap target(s) under 24px at 375 wide (WCAG 2.5.8).
  - a 37x15
  - a 26x15
  - a 30x15
  - a 18x15
  - a 18x15
- **P1** `type/measure-wide` 2 paragraph(s) run past 90 characters per line at 1440.
  - p.lead ~165 cpl
  - p ~182 cpl
- **P1** `type/text-tiny` 1 text block(s) under 12px on a phone.
  - footer 11px
- **P1** `composition/hidden-at-rest` 18 text block(s) still at opacity 0 after load; content waits on script or scroll.
  - h2 "The studio"
  - p "Every Kade studio is built by hand in ou"
  - td "Floor area"
  - td "38 m² plus 9 m² loft"
  - td "Hull"
- **P1** `composition/reduced-motion-ignored` 1 animation(s) keep running with prefers-reduced-motion: reduce.
  - bob
- **P1** `composition/reduced-motion-hidden` 4 text block(s) stay invisible with reduced motion on.
- **P2** `speed/blocked-before-paint` Script held the main thread 351 ms before first paint.
- **P2** `access/h1-count` 2 h1 element(s) rendered; one is expected.
- **P2** `access/landmarks` Missing landmark(s): main.
- **P2** `type/too-many-sizes` 11 distinct font sizes at 1440; a scale needs six to eight.
- **P2** `composition/competing-actions-375` 3 button-styled actions compete on the first screen at 375 wide.
  - Book a call
  - Download brochure
  - Watch the film
- **P2** `composition/no-action-1440` No button-styled action on the first screen at 1440 wide.
- **P2** `composition/off-grid` 0% of margins, paddings and gaps sit on a 4px grid.
- **info** `access/contrast-unverified` 4 text block(s) sit on an image or gradient; contrast unverified, check by eye.
  - div.kicker "The future of living on water"
  - h1 "Kade"
  - p.sub "Innovative, sustainable, next-generation"
  - a.btn.ghost "Download brochure"
- **info** `composition/single-scheme` The page does not respond to prefers-color-scheme: dark. Fine if declared; confirm intent.

## Screenshots (open every one before scoring the eye rubric)

- 375.png
- 375-full.png
- 768.png
- 768-full.png
- 1440.png
- 1440-full.png
- 375-reduced-motion.png
