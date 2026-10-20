# Starlight Web Studio

A web design studio you install into Claude Code. Eleven specialist agents, a
graph that routes a site from audit to shipped page, and a scanner that needs no
model. It measures first, proposes with evidence, builds on a branch, and hands
the work to a critic from a different model provider and a verifier who did not
build it.

```bash
claude plugin marketplace add frankxai/claude-skills-library
claude plugin install starlight-web-studio@claude-skills-library
```

## What it does

| Command | What happens |
|---|---|
| `/studio <url or repo> [goal]` | The session becomes the director: signature brief, scout pass, a route, the right roles per phase, a decision with rejected options, build, critique, verify, hand-off. |
| `/studio-sweep [targets]` | Scans every property, ranks where an hour of work moves the most, sends the scout to the top three, writes proposals, opens draft PRs only for low-risk hygiene. |
| `/starlight-web-studio:studio-audit` | A workflow that audits many sites in parallel (measure, read copy and findability, critique) and ranks one proposal per site. Pass `{runId, targets: [{id, url, repo}]}`; `runId` names the evidence folder so runs never overwrite each other. |

Any harness or CI job can run the scripts directly:

```bash
node plugins/starlight-web-studio/bin/studio-doctor.mjs                            # what this machine can do: browser, second provider, companion skills
node plugins/starlight-web-studio/bin/studio-scan.mjs https://example.com          # markdown report
node plugins/starlight-web-studio/bin/studio-scan.mjs https://example.com --json   # exit 1 on any P0
node plugins/starlight-web-studio/bin/studio-sweep.mjs --targets targets.json --out .studio/sweeps
```

## The team

| Role | Model | Owns | Never does |
|---|---|---|---|
| site-scout | sonnet | evidence: scan, screenshots, eye rubric | propose or edit |
| audience-strategist | opus | the brief: buyer, job, three references to beat | design |
| art-director | opus | two or three genuinely different directions | decide |
| copy-chief | opus | every word a visitor reads | layout |
| search-strategist | sonnet | metadata, JSON-LD, crawler policy, sitemap | claim rankings |
| motion-director | opus | the motion score and its build | move before the still works |
| gpu-artist | opus | at most one WebGL or liquid-glass surface per page | ship GPU where CSS would do |
| media-producer | sonnet | prompt packets, assets, provenance | call a paid generator unapproved |
| site-builder | sonnet | static composition, components, draft PRs | merge |
| studio-critic | opus + second provider | the buyer's no | edit |
| release-verifier | sonnet | ship, revise or block, with evidence | fix what it finds |

The session running `/studio` is the director. Subagents cannot spawn subagents,
so orchestration stays in the main thread and the roles stay specialists.

## Routes through the graph

| Route | For | Roles |
|---|---|---|
| R1 sweep | no ask; find the next job | sweep, scout, director |
| R2 hygiene | metadata, JSON-LD, alt text, viewport | scout, search strategist or builder, verifier |
| R3 words | the page says too little or too much | scout, strategist, copy chief, critic, verifier |
| R4 page | a section or page needs a new composition | strategist, art director, copy chief, builder, critic, verifier |
| R5 flagship | a first screen that must stop people | all of R4, then motion, GPU and media, then critic and verifier |

## The scanner

`bin/studio-scan.mjs` reads what a crawler reads: server HTML, robots.txt,
llms.txt and the sitemap. Six dimensions, five points each:

- **search**: title, description, canonical, noindex, h1 and heading order, Open Graph, lang, sitemap
- **answer**: JSON-LD presence, validity and publisher entity; server-rendered text; content shipped at `opacity:0`; AI search crawlers blocked in robots.txt
- **mobile**: viewport, zoom, `viewport-fit=cover`, theme-color, manifest, touch icon
- **access**: image alt, links without a name, skip link
- **craft**: all-caps runs, stock vocabulary, placeholder copy, unbacked social proof
- **speed**: HTML weight, time to first byte, script count, font families

It cannot see layout, motion or contrast over imagery. That is the scout's
screenshot pass and the ten-dimension eye rubric in `skills/studio-audit`.

Two judgement calls are built in. Blocking AI training crawlers is reported but
costs no points; blocking AI search agents costs a point. A missing llms.txt is
informational only, because Google's guidance says AI Overviews need no special
file. An HTML page served at `/llms.txt` is a defect.

## Autonomy

| Level | Alone? | Examples |
|---|---|---|
| observe, propose | yes | sweep, scores, briefs, directions, proposals |
| hygiene PR | draft only | meta description, canonical, JSON-LD, alt text |
| page PR | draft, marked for design approval | copy rewrite, new section, motion |
| human | never alone | new routes, prices, DNS, external sends, paid generation, merging |

## Scheduling the sweep

The studio never registers its own schedule. `schedule/Register-StudioSweep.ps1` stages a
daily Windows task: run it with no switches to see the exact task, add `-Register` to turn it
on, `-Unregister` to remove it. Each run writes a board, the machine scores and a heartbeat
(`--heartbeat <file>`) whose status is `ok`, `degraded` or `failed` from what the run produced,
not from its exit code. The script points at the plugin copy it lives in; re-run it after
moving or reinstalling the plugin.

## Works with

The repo's own `design.md` and `taste.md` outrank every skill here. The studio
loads these when installed: the `web-excellence` pack in this repo
(`web-release-gate`, `visual-proof`, `core-web-vitals`, `gpu-surface`),
`impeccable`, `taste-skill`, `ui-ux-pro-max`, `frontend-design`, Emil Kowalski's
skills, GreenSock's `gsap-skills`, and `humanizer`.

## Tests and evals

```bash
node --test plugins/starlight-web-studio/tests/*.test.mjs    # 46 tests: scanner, RFC 9309 robots, sweep ranking, workflow
claude plugin eval plugins/starlight-web-studio
```

The workflow test runs the real `workflows/studio-audit.js` against stub agents,
so "a site with an incomplete review is never ranked" is checked, not claimed.

The evals check three behaviours: the scout scans before scoring and makes no
visual claim without a screenshot, the critic never passes off a same-model
review as independent, and a sweep refuses to merge or publish a new route on
its own while still doing the work that needs no approval.
