# Worked case: Kade, a full design review with evidence

One complete studio review of an original page, kept so a buyer can check every handoff
instead of trusting the agent list. Kade is a fictional floating-studio maker invented for
this case; nothing here imitates a real business.

It runs the R4 route twice, because the first revision failed its critique:

| Step | Role | File |
|---|---|---|
| 1. Brief | audience-strategist | [brief.md](brief.md): buyer, job, the only facts the page may claim, three references |
| 2. First draft | (fixture) | [pages/before.html](pages/before.html): the kind of page an agent ships unreviewed |
| 3. Measure | site-scout | [audit.md](audit.md); raw output in [evidence/before](evidence/before/) |
| 4. Revision 1 | site-builder | [pages/v2.html](pages/v2.html), evidence in [evidence/v2](evidence/v2/) |
| 5. Critique | studio-critic, independent context | [critique.md](critique.md) round 1: **revise**, 28/50 |
| 6. Revision 2 | site-builder | [pages/after.html](pages/after.html), evidence in [evidence/after](evidence/after/) |
| 7. Verify | studio-critic, rounds 2 and 3 | [critique.md](critique.md): revise (31), then ship on the maker's side (36) |
| 8. Handoff | release-verifier | [handoff.md](handoff.md): what passed, what is unverified, the owner gates |

## The finding worth the whole exercise

| | v1 | v2 | v3 |
|---|---|---|---|
| Machine scan | 19.5 / 30 | 28.5 / 30 | 28.5 / 30 |
| Browser pass | 8.5 / 25 | **25 / 25** | 25 / 25 |
| Eye rubric (critic) | 5 / 50 | **28 / 50, revise** | 36 / 50, ship on the maker's side |

Revision 1 maxed both instruments and still lost the buyer. The maker had written proof the
brief never supplied (a captioned "studio no. 3" under an illustration, a numbered owner, an
off-grid season), dropped "from" off the price, and linked "See the plans" to a page with no
plan. Instruments measure what a page does; only a reader can see what it claims. That is why
the studio keeps the layers apart and why `evals/measured-is-not-judged` exists.

The instruments caught the maker four times in revision 2: a 20 px tall wordmark link, a 42 px
nav link, a 42 px skip link, and a floor plan that widened the whole grid track on a phone
(sideways scroll from `min-width: auto` on a grid item). The critic caught what they could not:
a dark-mode button at 3.8:1 that the browser pass had captured but never measured. That became
a tool fix (`access/contrast-dark`) with a test, before the page fix. The review also found and
fixed three instrument bugs: a scroll reveal hid grey body copy from contrast, mobile Chromium's
widened layout viewport hid sideways scroll, and SVG labels counted as layout edges.

## Capture what is shown

Each `evidence/<version>/` folder holds `eye.md` and `eye.json` (browser pass),
`scan.md` and `scan.json` (machine scan), and the screenshots: 375, 768 and 1440 at the
first screen and full page, 375 with reduced motion, and 1440 in dark scheme when the
page answers it. `evidence/after/375-plan.png` is the floor plan at phone width.

## Reproduce

```bash
cd plugins/starlight-web-studio
python3 -m http.server 8765 --bind 127.0.0.1 --directory examples/kade-review/pages &
mkdir -p .studio; for v in before v2 after; do
  node bin/studio-scan.mjs http://127.0.0.1:8765/$v.html --allow-private > .studio/kade-$v-scan.md
  node bin/studio-eye.mjs  http://127.0.0.1:8765/$v.html --allow-private --out .studio/kade-$v
done
node --test tests/studio-eye.test.mjs   # includes both pages end to end in real Chromium
```

Lab timings vary by machine; findings and scores should not.

## Independence, stated plainly

No second model provider was installed where this ran (`studio-doctor` found no `codex`,
`gemini`, `agy` or `grok`). The critique was therefore run by a separate agent with a fresh
context that was given only the brief, the screenshots and the HTML, and was told not to read
any other review file. That is independent of the maker's reasoning, not of its model. Per
`agents/studio-critic.md`, it is recorded as **same provider, independent context**, and a
different-provider pass is still owed before this would count as a cross-provider check.
