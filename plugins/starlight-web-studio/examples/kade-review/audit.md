# Audit: Kade landing page, three versions

Domain: local fixture (`pages/`, served on 127.0.0.1). Kade is fictional. Date: 2026-11-21.
Instruments: `bin/studio-scan.mjs` (machine, /30), `bin/studio-eye.mjs` (browser, /25),
eye rubric (/50). All three versions were measured by the same final build of both tools;
the raw output is in `evidence/<version>/`.

## Scores

| Layer | v1 `before.html` | v2 `v2.html` | v3 `after.html` |
|---|---|---|---|
| Machine (crawler) | 19.5 / 30 | 28.5 / 30 | 28.5 / 30 |
| Browser (measured) | 8.5 / 25 | 25 / 25 | 25 / 25 |
| Eye (judgement) | 5 / 50 critic · 6 / 50 scout | **28 / 50** critic, revise | 31 (v3), **36 / 50** (v3.1), ship on the maker's side |

The row that matters is the middle column. v2 maxed both instruments and still lost the buyer:
it invented proof the brief never gave and promised a plan it did not have. No crawler or
browser metric can see a fabricated caption. That is why the layers are never summed.

## Layer 1: machine scan

| Dimension | v1 | v2 | v3 | What moved |
|---|---|---|---|---|
| search | 0 | 4.5 | 4.5 | description, canonical, lang, one h1, heading order, Open Graph |
| answer | 4 | 5 | 5 | JSON-LD Organization, Product with a `minPrice` offer, FAQPage |
| mobile | 3 | 4 | 4 | `viewport-fit=cover`, theme-color per scheme; manifest and touch icon still absent (fixture) |
| access | 3.5 | 5 | 5 | alt text, named links, skip link |
| craft | 4 | 5 | 5 | stock vocabulary gone ("innovative, sustainable, next-generation") |
| speed | 5 | 5 | 5 | tiny fixture; this dimension cannot separate them |

## Layer 2: browser pass (phone lab profile: 4x CPU, 150 ms RTT, 1.6 Mbps)

| Measure | v1 | v2 | v3 |
|---|---|---|---|
| LCP | 1552 ms | 376 ms | 388 ms |
| CLS | 0.055 | 0 | 0 |
| Main thread blocked before first paint | 358 ms | 0 | 0 |
| Sideways scroll at 375 | 292 px (P0) | 0 | 0 |
| Text blocks below AA on solid backdrops | 27 | 0 | 0 |
| Keyboard stops with no visible focus | 8 of 8 | 0 of 8 | 0 of 8 |
| Tap targets under 24 px at 375 | 5 | 0 | 0 |
| Median measure at 1440 (line boxes) | 174 cpl | 44 cpl | 57 cpl |
| Distinct type sizes at 1440 | 11 | 5 | 6 |
| Dark-scheme text below AA | n/a (no dark scheme) | 0 | 0 (v3 before the fix: 1, the CTA) |
| Spacing on a 4 px grid | 0% | 100% | 100% |
| Text left at opacity 0 after load | 18 blocks | 0 | 0 |
| Animations ignoring reduced motion | 1 (infinite bob) | 0 | 0 |
| Dark scheme | not answered | designed | designed |

v1's CLS of 0.055 is a real shift (a promo bar prepended at 700 ms) but under the 0.1 line, so
the tool did not flag it. The eye pass did.

## Layer 3: eye rubric, v1 (scout pass, before any build)

Read from `evidence/before/*.png` and `pages/before.html`.

| # | Dimension | Score | Evidence |
|---|---|---|---|
| 1 | First screen | 1 | h1 is the brand name in letterspaced caps; three equal pills; at 1440 the hero image pushes every action below the fold (`1440.png`) |
| 2 | Typography | 1 | eleven sizes on no ratio; grey body at 2.8:1; 159-character lines (`before.html` `.section p`) |
| 3 | Copy | 0 | "innovative, sustainable, next-generation"; a 90-word lede; "100% solar, all year" with an asterisk |
| 4 | Imagery | 1 | the only image bobs forever and has no alt |
| 5 | Surface | 1 | default pills and hairline cards; centred everything |
| 6 | Motion | 0 | infinite bob; scroll reveal that hides content with no reduced-motion path (`375-reduced-motion.png`) |
| 7 | Mobile | 0 | 640 px spec table and a three-card flex row overflow the phone (`375-full.png`) |
| 8 | Theme | 0 | no dark scheme, no `color-scheme` |
| 9 | Performance | 2 | small payload, but a 350 ms synchronous loop before paint and an injected bar that shifts layout |
| 10 | Accessibility | 0 | `outline: none`, no lang, unnamed icon links, 11 px footer |
| | **Total** | **6 / 50** | restart band |

The full-page captures of v1 show long blank stretches. Per the studio-audit rule, that is not
a finding until the source is read: here the source confirms the content only exists after an
IntersectionObserver fires and has no reduced-motion or no-script path, so it is a finding.

## Fix list for v1, by leverage (what the build answered)

| # | Fix | Where | Effort |
|---|---|---|---|
| 1 | State the offer in the h1 and price on the first screen; one primary action | hero | S |
| 2 | Kill the reveal-at-opacity-0 and the infinite animation; design the reduced-motion state | CSS, script | S |
| 3 | Make the spec a definition list that reflows; remove the fixed-width table | `#studio` | S |
| 4 | Body copy at AA contrast, 45 to 75 characters per line, a 1.25 type scale | tokens | S |
| 5 | Visible focus, names on icon links, lang, alt | global | S |
| 6 | Remove every claim not on the spec sheet | copy | S |
| 7 | Show the plan the buyer reads before anything else | new figure | M |

## What excellent feels like here

A buyer who already holds a mooring right lands, reads the promise, the price and the plan in
under ten seconds, and every number on the page is one they can check against the spec sheet.
Nothing moves except to show state; nothing claims what the yard cannot prove yet.
