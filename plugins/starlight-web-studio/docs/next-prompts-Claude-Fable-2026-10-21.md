# Living materials: how to continue

Author: Claude Fable 5.1 · 2026-10-21 · revision 1 · state: frozen loop, open lanes.
Sources: `bin/materials-gate.mjs` at e7d9889, `docs/living-materials-system-Claude-Fable-2026-10-20.md`,
claude-skills-library issue 76 and PR 77, starlight-design-intelligence PR 53.

## Where it stands

- The gate (`node plugins/starlight-web-studio/bin/materials-gate.mjs <repo>`) is model-free, lexer-based,
  91 tests, frozen at e7d9889 after 43 cross-provider passes. Its residual is on PR 77: a pass proves
  recognised patterns absent and the import graph complete, not runtime behaviour.
- gencreator.ai fails it today: 6 three.js scenes without a lifecycle, 38 unscored motion files,
  180 raw colour literals, a DESIGN.md without tokens. starlight-intelligence-web has no DESIGN.md.
- The materials package (`starlight-design-intelligence/packages/materials`, PR 53) is written but
  unbuilt: `pp preflight --workload build` holds at 2.7 GB free against an 8 GB floor.
- The showcase (`/work` on starlightintelligence.ai, from the registries) is a proposed card, not started.

## Rule for every lane

One lane, one branch `agent/<harness>/<scope>`, draft PR, maker ≠ checker. Claim files with ops-guard
before each commit. Run `pp preflight` before a build or browser. Every closing reply ends made /
verified / proposed. Do not reopen the gate review loop; take lane 3 instead.

## Lanes, in the order they pay

### 1. Make one real site pass the gate (highest value)

```
Repo: starlight/repos/gencreator.ai. Branch agent/<you>/materials-pass.
Run node <claude-skills-library>/plugins/starlight-web-studio/bin/materials-gate.mjs . --json and read
every error. Fix in this order, one commit each: (a) add an IntersectionObserver or visibilitychange
pause-and-resume to each of the 6 three.js scene modules it names, with a poster still that paints
before the canvas; (b) write DESIGN.md per Google's DESIGN.md alpha spec with YAML tokens for the
colours the gate found as raw literals, then replace the 180 literals with those tokens, file by file;
(c) add .studio/motion-score.md entries for the 38 motion files, scoring each against
design-agent-standards/MOTION_TASTE_RUBRIC.md, and delete motion that has no job.
Done when the gate prints 0 errors on this repo, pnpm build and pnpm lint pass, and a Playwright run
on the Pixel 7 project shows the hero still paints under prefers-reduced-motion. Verifier: a Codex
read-only pass on the head SHA as a buyer who declined to pay, findings answered in the PR.
```

### 2. Build the materials package once the machine allows

```
Repo: starlight/repos/starlight-design-intelligence, PR 53 (packages/materials). Run pp preflight
--workload build; if HOLD, stop and report the number, do not override. If allow or bounded: pnpm i
--filter @starlight/materials, pnpm build, pnpm test. Then wire gencreator.ai's glass surface to the
package's CSS-blur rung with the SVG feDisplacementMap rung behind a Chromium check and the WebGL rung
behind glass-gate.mjs's 8 ms budget. Done when the package builds, its tests pass, and one gencreator
route renders through it with the materials gate still at 0 errors on that route. Verifier: Gemini 4
Argon via agy, read-only, thinking high.
```

### 3. Rewrite the gate's regex readers over the token stream (structural)

```
Repo: claude-skills-library, plugin plugins/starlight-web-studio, branch agent/<you>/gate-token-readers.
Read bin/materials-gate.mjs header and the loop record on issue 76 first. Passes 37 to 43 each found a
hole in a regex reader: the runtime-selection reader (ternary, ??, ||), the in-place await-import
binder, and the mount detector. Replace those three with readers over lex()'s token stream, keeping
every existing export and all 91 tests green, then add a corpus test: scan these real repos and assert
the printed error and coverage lines are byte-identical to the Baseline below:
gencreator.ai and starlight-intelligence-web. Done when tests pass, the baseline matches, and the
header's documented-limits paragraph shrinks rather than grows. Verifier: Codex read-only, one pass,
then stop regardless of verdict and record the residual on the PR.
```

Baseline (2026-10-21, e7d9889): gencreator.ai → one-gpu-surface ok (6 renderer modules among 6
GPU-importing, 76 routes), coverage ok, 2 errors 3 warnings. starlight-intelligence-web →
one-gpu-surface ok (0 of 0, 38 routes), coverage warn (no node_modules), 2 errors 1 warning.

Revised 2026-10-21 by Claude Opus 5.5 after the Codex review of PR 77: a DESIGN.md with tokens
but none of the eight spec headings is now an error. gencreator.ai reads 3 errors 2 warnings
(design-md moved from warn to error; every other line is unchanged). starlight-intelligence-web
has since grown to 57 routes and a dynamic-import coverage error; the e7d9889 gate reads that
checkout identically, so that change is the repo, not the gate.

### 4. Land PR 77 through the gate (not Claude)

```
From starlight root: node tools/pr-gate.mjs verify --repo frankxai/claude-skills-library --pr 77.
Review head e7d9889 as Codex or Gemini: read the plugin README, run node --test
plugins/starlight-web-studio/tests/*.test.mjs, run the gate on gencreator.ai and compare to the
baseline above. If pass: node tools/pr-gate.mjs signoff --repo frankxai/claude-skills-library --pr 77
--harness <you> --verdict pass, then merge through the gate. The repo is over its PR budget (14/10):
close or land one other draft first and name it in the merge comment. Then re-register the
StarlightStudioSweep task against the main checkout, since it runs the worktree copy today.
```

### 5. The showcase: /work on starlightintelligence.ai

```
Repo: starlight/repos/starlight-intelligence-web, branch agent/<you>/work-showcase. Flagship lane:
three directions (signature-safe, bold evolution, wildcard) differing on composition and material, one
taste owner decides. Source of truth for what to show: starlight/graph/products.graph.json rows with
a gate PASS or a live URL in PROPERTIES-REGISTRY.md, nothing hand-typed. Build static first, phone
first (AGENTS.md §11.3 predicates), one GPU surface at most, poster before canvas, reduced-motion path.
Run the materials gate on the repo before opening the PR; it must not add an error. Done when the route
renders the registry rows with their measured facts, passes the gate, and a craft receipt exists at
queen/reports/craft/si-work-2026-10-xx.md with all four blocks. Verifier: a different provider as a
skeptical buyer; fix, then hand over.
```

### 6. DESIGN.md for every tier-1 property

```
For each of frankx.ai-vercel-website, starlight-intelligence-web, arcanea-ai-app: write DESIGN.md per
google-labs-code/design.md (sections Overview, Colors, Typography, Layout, Elevation and Depth, Shapes,
Components, Do's and Don'ts; YAML token blocks), derived from the shipped CSS and the brand pack in
starlight-design-intelligence/brand-packs, never invented. Lint with npx @google/design.md lint
DESIGN.md and the materials gate's design-md check. One PR per repo, docs-only, [skip ci].
```

## How a next agent improves on this

- Do not re-run the review loop on the gate; its curve is flat. Measure instead: a corpus of real pages.
- Prefer lane 1 over any planning. A site that passes the gate is the product; the gate is tooling.
- When a different-provider critic finds one more spelling per pass for three passes, freeze and
  record, do not chase.
- Count what creates a surface, not what imports a library. Report incomplete coverage as failure.
