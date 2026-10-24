# Answer key: seeded defects in checkout.html

Not shown to the model under test. The runner never stages files named `KEY.md`, and the case exposes only `resources/`. The same facts appear in the judge rubrics in `graders/`, which only the judge sees.

The review is scoped to static markup and CSS against WCAG 2.2 AA. Form submission wiring, scripts and image hosting are out of scope and the prompt says so.

| # | Defect | Where | WCAG 2.2 | Grader |
|---|---|---|---|---|
| 1 | Hint text `#a0a0a0` on white is 2.6:1, under 4.5:1 | `.hint` | 1.4.3 Contrast (Minimum) | `d1-contrast` |
| 2 | Product image has no `alt` | `<img src="/img/trail-runner-v3.jpg">` | 1.1.1 Non-text Content | `d2-alt` |
| 3 | Email field has a placeholder and no label | `<input type="email" … placeholder="Email">` | 1.3.1, 3.3.2 Labels or Instructions | `d3-label` |
| 4 | Focus indicator removed for buttons and inputs | `button:focus, input:focus { outline: none; }` | 2.4.7 Focus Visible | `d4-focus` |
| 5 | Two 20 × 20 px quantity buttons sit edge to edge (`gap: 0`), so the 24 px spacing exception does not apply | `.qty button` | 2.5.8 Target Size (Minimum) | `d5-target` |
| 6 | Card error shown only by a red border: no text and no `aria-invalid` | `input.error` on `#card` | 1.4.1 Use of Color, 3.3.1 Error Identification | `d6-color-only` |
| 7 | Zoom disabled | `maximum-scale=1, user-scalable=no` | 1.4.4 Resize Text | `d7-zoom` |
| 8 | A standalone "Click here" link with no surrounding context | `<p><a href="/terms">Click here</a></p>` | 2.4.4 Link Purpose (In Context) | `d8-link` |

Checked on purpose and not defects: input and divider borders are `#6b7480` (4.7:1 against white), the pay button is white on `#1b5fd1` (5.8:1), and the quantity buttons have accessible names.

Revision 2, 2026-10-20: revision 1 keyed two passes as failures (20 px targets with enough spacing, and "click here" with context in the same sentence) and had an extra low-contrast border. All three were found by a Codex review and corrected here.
