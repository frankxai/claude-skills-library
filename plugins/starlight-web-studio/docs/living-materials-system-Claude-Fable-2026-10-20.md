# Living materials: the design and build system behind what we show

Author: Claude Fable 5.1 (Claude Code), 2026-10-20, revision 1. Status: PROPOSED, nothing here is
RULED until Frank says so. Sources are linked inline with the date read. Measured numbers carry the
command that produced them.

## 1. What we show, measured today

The showcase is a list of things a stranger can open. Everything below exists on disk or on the
network on 2026-10-20; nothing is planned.

| Thing | Where | Proof |
|---|---|---|
| Starlight Web Studio: 11 agents, 8 skills, routed graph, model-free scanner | `plugins/starlight-web-studio` on `agent/claude/web-studio`, draft PR frankxai/claude-skills-library#77 | `node --test tests/*.test.mjs` passes 59 tests plus 19 for this gate (count printed by the run, 2026-10-20) |
| Glass lab: three.js liquid glass vs CSS glass, capability gate, 8 ms frame budget, measured 0.05 to 0.40 ms per frame on Arc 140T | `examples/gpu-glass/` | `README.md` carries the measurement and the Codex review |
| A complete R4 run on the frankx homepage: brief, three directions, decision, generated hero with provenance, motion score, GSAP and glass prototype, different-provider critique | `examples/frankx-homepage/` | nine files plus `media/` sidecars |
| Eye pass of 25 live sites, phone and desktop | `starlight/logs/excellence/eye-pass-2026-10-20.md` | frankx 24/50, animelegends 36/50 |
| Observatory: 17 routes, voice operator at `/operator` | `starlight-command-center/apps/observatory`, port 4321 | `preview_start` name `observatory` |
| web-excellence lint pack | `packs/web-excellence/ci/web-guidelines-lint.mjs` on this branch | eight rules in its table: `animate-layout-prop`, `block-paste`, `div-onclick`, `img-no-dims`, `keyframes-no-reduced-motion`, `no-zoom`, `outline-none`, `transition-all` (`grep` of the rule table, 2026-10-20); the dvh, hover-gating and manifest rules AGENTS.md §11.3 describes are on another branch and are not in this copy |
| The audience: `claude-skills-library` | 792 unique visitors in the 14 days to 2026-09-19 (`gh api repos/frankxai/claude-skills-library/traffic/views`; "unique" is GitHub's count, not verified humans; star count and referrer share come from separate endpoints and are not re-measured here) | the one measured demand signal, which is interest, not willingness to pay |
| Installable by a stranger: `@frankxai/mcp-doctor` 0.4.1 | npm | `npm view @frankxai/mcp-doctor version` |

Where it should be shown: one route, not six. frankx.ai today ships `/gallery`, `/design-lab`,
`/lab`, `/labs`, `/build` and `/agentic-builder-lab`; that is the "depth-less breadth" tell in
AGENTS.md §11.1. The showcase belongs on the `platform` row (`starlightintelligence.ai`, whose
primary user is an agent) as `/work`, rendered from the registries: `graph/products.graph.json`,
`PROPERTIES-REGISTRY.md`, the eye-pass receipts, the craft receipts. A card appears when its
receipt exists; a count is never typed. This needs a registry row and an R4 run, so it is a
proposed session, not something this document does.

## 2. The idea: materials, not effects

A living material is a surface that answers to light, pointer, scroll, state or time, and that
degrades on purpose. Liquid glass is one material. "Living" means every material ships with four
things or it does not ship:

1. a **still** that works with no script (the poster),
2. a **gate** that decides on the reader's device and preferences (`prefers-reduced-motion`,
   `prefers-reduced-transparency`, data saver, WebGL2, viewport, measured frame cost),
3. a **budget** (bytes, frame time, one GPU surface per page),
4. a **record** in the repo's `DESIGN.md` so the next agent inherits the rule, not the hack.

The five materials, lightest engine first:

| Material | Engine ladder | Where the gate exists today |
|---|---|---|
| Glass | CSS `backdrop-filter` blur → SVG `feDisplacementMap` refraction (Chromium only; Safari has an open WebKit bug, Firefox passes `@supports` and renders nothing, per [ekino, read 2026-10-20](https://medium.com/ekino-france/liquid-glass-in-css-and-svg-839985fcb88d) and [buildmvpfast](https://www.buildmvpfast.com/blog/liquid-glass-css-backdrop-filter-recipes-2026)) → WebGL refraction (`examples/gpu-glass`, or `naughtyduk/liquidGL` after a licence read) | `examples/gpu-glass/glass-gate.mjs` |
| Light | CSS pointer-lit rim and spotlight via custom properties → shader only when the light is the subject | gpu-artist rule: one GPU surface per page |
| Grain and paper | CSS `mask`/`mix-blend-mode` noise → never a video texture | anti-slop list: no un-grained flat containers |
| Depth | `View Transitions` and `layout` moves → ScrollTrigger pin and scrub → 3D only with a brand metaphor | cinematic-motion skill, motion score |
| Motion | CSS transitions → Motion → GSAP ScrollTrigger and SplitText → Lenis only where scenes need it | motion score with a reduced-motion column per beat |

Buttons, cards and sheets are not materials; they are primitives that wear a material. A card
is shadcn's card with a `material` prop (`glass`, `paper`, `ink`) and interaction states defined
once (press depth, focus ring, hover gated to `(hover: hover) and (pointer: fine)`). That is how
"general buttons and cards and their interactivity" stays one system instead of a per-site rewrite.

## 3. Files, repo by repo

### 3.1 Every product repo (the contract a repo must carry)

| File | Purpose | Enforced by |
|---|---|---|
| `DESIGN.md` | Google's open DESIGN.md spec: YAML tokens plus prose in the eight sections Overview, Colors, Typography, Layout, Elevation & Depth, Shapes, Components, Do's and Don'ts (alpha, Apache-2.0, [google-labs-code/design.md, read 2026-10-20](https://github.com/google-labs-code/design.md)). The estate's anti-signature goes in Do's and Don'ts; materials go under Components | `npx @google/design.md lint DESIGN.md` and `materials-gate design-md` |
| `design.sidecar.json` | impeccable's sidecar, written from the shipped build, never from intentions | `impeccable-documenter` |
| `taste.md` | the operator's recorded likes and dislikes for this brand, pulled from the taste ledger | `signature` skill, resolution order |
| `.studio/<id>/` | evidence per run: scan, screenshots, brief, directions, decision, motion-score, critique, handoff | studio protocol phase contracts |
| `motion-score.md` (in `.studio/<id>/` or `docs/`) | one row per beat with a reduced-motion state | `materials-gate motion-scored` |
| `.claude/ci/web-guidelines-lint.mjs` | the vendored web-excellence rules | `web-excellence.yml` on every non-draft PR |

### 3.2 The materials package (proposed home: `starlight-design-intelligence/packages/materials`)

`starlight-design-intelligence` is the brand and media runtime in the estate map, its tree is clean,
and it is under the PR budget (2 open). `_intelligence/` resolves to the estate root and is never
pushed, so it cannot host runtime code.

```
packages/materials/
  package.json            @starlight/materials, Apache-2.0, peer: react 19, next 16, tailwind 4
  registry.json           shadcn registry so any repo runs: npx shadcn add @starlight/glass-card
  src/
    gate/                 glass-gate (moved from the lab), frame probe, env reader, SSR-safe hook
    glass/                GlassSurface: poster → CSS → SVG → WebGL ladder behind one component
    light/                PointerLight, RimLight (CSS custom properties, no script on reduced motion)
    grain/                Grain, Paper (CSS only)
    motion/               useBeat (GSAP + @gsap/react), ScoreProvider that refuses a beat without a row
    primitives/           Button, Card, Sheet, Dialog: shadcn base + material prop + state contract
    tokens/               DESIGN.md → CSS custom properties (via `npx @google/design.md export`)
  examples/               one Next.js 16 app route per material, each with its motion score
  DESIGN.md               the package's own design system, linted in CI
```

Next.js 16 fit, from the [release post, read 2026-10-20](https://nextjs.org/blog/next-16): the
poster renders in a Server Component; the material hydrates as a client island; route moves use
React 19.2 View Transitions; the showcase reads receipts at build time under Cache Components,
so a changed receipt reaches the page on the next build or an explicit `updateTag()` call,
never by itself; `proxy.ts` is the new name for `middleware.ts`, which the post lists as
deprecated but still available.

### 3.3 The studio plugin (this PR)

- `bin/materials-gate.mjs`, model-free and static, exit 1 on error: `design-md`,
  `glass-gated`, `one-gpu-surface`, `gpu-lifecycle`, `poster-first`, `motion-scored`,
  `raw-colour`. Nineteen tests in `tests/materials-gate.test.mjs`, including a subprocess
  run from a path with spaces. It proves a pattern is absent in shipped code (tests, fixtures
  and `.studio` prototypes excluded, comments and type-only imports stripped); it never
  proves a page behaves. The one-surface budget at renderer creation, the gate's effect on
  that creation, and the no-script poster are enforced and tested in the materials wrapper
  (§3.2), not here. Raw WebGL without a library and CDN script tags are out of scope and
  go in Do's and Don'ts. None of its rules overlaps the web-excellence table above.
- Roles unchanged. The gpu-artist, motion-director and media-producer already own the three
  material lanes; the gate is what they were missing. Two skills to add next, not agents:
  `shot-planning` (shot list, lens, duration, continuity refs, delivery crops, routed to
  Remotion, HyperFrames or Veo through the media packet) and `materials` (the ladder above as
  decision rules). The roster stays at eleven because subagents cannot spawn subagents and this
  box has 1.7 GiB free (`Get-CimInstance Win32_OperatingSystem`, 2026-10-20).

## 4. How quality is enforced, in order, with the command

| Gate | Catches | Command | Runs |
|---|---|---|---|
| DESIGN.md lint | missing tokens, wrong section order | `npx @google/design.md lint DESIGN.md` | pre-commit and CI |
| web-excellence lint | zoom, layout-prop animation, paste blocking, div onclick, images without dimensions, keyframes without reduced motion, `outline: none`, `transition: all` | `node .claude/ci/web-guidelines-lint.mjs --changed` | every non-draft PR in the 9 repos that vendor it |
| materials gate | ungated refraction, two GPU modules on a route, GPU without visibility handling, motion library without a score, colour soup | `node bin/materials-gate.mjs <repo>` | today: by hand; proposed: every non-draft PR and the `site-builder` handoff (neither wired yet) |
| studio scan /30 | search, answer, mobile, access, craft, speed from server HTML | `node bin/studio-scan.mjs <url> --json` | daily sweep (`StarlightStudioSweep`, 07:10) |
| eye rubric | layout, contrast over imagery, motion feel | scout screenshots at 375, 768, 1440 | R2 and up |
| critic, different provider | the buyer's no | `codex --profile review` or Gemini via `different-provider-critic-recipe` | R3 and up; same-provider is recorded as missing |
| craft receipt | research, bar, refinement diff, critique | `node tools/craft-receipt.mjs --product <id> --receipt <path>` | before `gh pr ready` |
| PR gate | maker signing their own work | `node tools/pr-gate.mjs verify / signoff / merge` | merge |

A rule without a row here is prose, not a rule (AGENTS.md §13). Implemented and running on a
trigger today: web-excellence lint, studio scan, the critic recipe, craft receipt, PR gate.
Implemented, run by hand only: the materials gate. Proposed, not written: the DESIGN.md lint
in pre-commit and CI, the materials gate in CI and in the builder's handoff. Running the
gate's own tests is not gating a product.

First run of the gate on the two reference candidates (`node bin/materials-gate.mjs <repo>`,
2026-10-20, worktrees and dot folders excluded):

| Repo | design-md | glass-gated | one-gpu-surface | gpu-lifecycle | poster-first | motion-scored | raw-colour |
|---|---|---|---|---|---|---|---|
| gencreator.ai (670 shipping files) | warn: prose, no YAML tokens | error: `LiquidGlassZoom.tsx`, `lib/brand-system.ts` have no gate call or import | ok: 6 GPU modules, no route reaches two over 76 pages and 1 layout; 1 specifier unresolved | error: 6 three.js scenes never pause off-screen | warn: the same 6 name no poster | error: 38 motion files, no score | warn: 180 colour literals (hex, rgb, hsl, oklch) |
| starlight-intelligence-web (316 shipping files) | error: no DESIGN.md | ok: 10 CSS blur files, no refraction | ok: 0 GPU modules | ok | ok | error: 9 motion files, no score | ok: 14 |

So the proposed reference surface fails its own bar twice. That is the point of a gate that
runs before anyone argues taste: PR 3 in §9 is now a measured list, not a wish.

## 5. Stack, by layer, and what each one is for

| Layer | Choice | Why, and the limit |
|---|---|---|
| Surfaces | TypeScript, React 19.2, Next.js 16, Tailwind 4, shadcn, Magic UI | hover gating is free on Tailwind 4; frankx is still Tailwind 3 and React 18 and is the migration, not the reference (gencreator.ai is the proposed reference, AGENTS.md §11.3) |
| Materials | CSS first, GSAP for motion, three.js or OGL behind one wrapper | measured ladder in §2 |
| Media | Codex image gen, Nano Banana, Veo, HyperFrames and Remotion for programmable video, Higgsfield behind `/hf-plan` | every output carries `.vis.provenance.json` and a ledger row |
| Pipelines and evals | Python with `uv` | scans, eye-pass scoring, promptfoo evals; never the UI |
| Rust | only where a measurement says JS is the bottleneck (image processing in the factory, a WASM gate probe) | no Rust in this plan until a profile names the hot path |
| Sites hosting | Vercel: Next.js, Workflows (GA April 2026), Sandbox (GA, Drives in beta), AI Gateway, Agent (beta) per [Vercel changelog and community recap, read 2026-10-20](https://community.vercel.com/t/vercel-weekly-2026-06-22/44187) | one deploy path per project; never an Actions deploy beside git integration |
| Agent runtimes and media storage | Cloudflare: Agents SDK on Durable Objects, Facets, Workflows v2, Sandbox SDK 1.0, R2 ([Agents Week, April 2026, read 2026-10-20](https://www.cloudflare.com/press/press-releases/2026/cloudflare-expands-its-agent-cloud-to-power-the-next-generation-of-agents/)) | persistent agents and long jobs live here; sites do not |
| Open core | `@starlight/materials`, the gate, the DESIGN.md profiles: Apache-2.0 public | managed layer: hosted studio runs, sweeps, the showcase, the registry with evals |

## 6. Factories, verticals, marketplace

A factory is a studio route plus a materials package plus a `DESIGN.md` plus a template. Its
outputs: a funnel (waitlist-first, standard capture), an app, a desktop shell (the three Tauri
shells already exist and are not registry properties until Frank rules), a swarm app (Observatory
pattern). Nothing is a factory until it has produced two artifacts through the gates.

A vertical is one `DESIGN.md` profile plus one template plus one data pack, sold through the
shadcn registry and Polar. The demand signal is already measured elsewhere:
[VoltAgent/awesome-design-md](https://github.com/VoltAgent/awesome-design-md) holds 122k stars
for a list of DESIGN.md files (`gh search repos`, 2026-10-20); stars are interest in the format,
not evidence anyone pays for a plugin. Our edge is not another list; it
is profiles that ship with materials, gates and evals, and a studio that installs into the
buyer's harness. The marketplace is the registry: `registry.json` entries with a `DESIGN.md`,
components, a motion score and a gate receipt per item.

## 7. Many desktops on one screen, with 1.7 GiB free

Not on this machine. Local virtual desktops or VMs are off the table while free RAM sits under
the 4 GiB floor. The pattern that fits: agents' browsers and desktops run in cloud sandboxes
(Vercel Sandbox, Cloudflare Sandbox SDK; both GA), each emits a text stream plus a periodic
frame, and Observatory `/fleet` composes them into one view. Text first, frames on demand, no
WebRTC until the C940 hosts it. What stays `[OPEN]`: which sandbox API exposes frames cheaply
enough, and whether a single composited stream can run under 300 MB in the pane. Measure before
building.

## 8. Adoption, feedback, partnerships

- Adoption pack for anyone, no estate dependencies:
  `claude plugin install starlight-web-studio@claude-skills-library`, then
  `npx @google/design.md lint DESIGN.md` and
  `node <plugin>/bin/materials-gate.mjs .` as two CI steps. A clean-install smoke test of
  that sequence on a fresh repo is owed before the pack is advertised.
- Opinionated forks only where we add a gate the upstream lacks, with the licence read first:
  candidates are `liquidGL` (glass), `gsap-skills` (motion score), the shadcn registry template
  (material prop). No fork of a framework.
- Feedback loop: every studio run writes receipts; `foundry.mjs graph` reads them; a skill with no
  eval stays out of the default prompt. Partnerships (Vercel, Google, Anthropic, Cloudflare) are
  earned by shipped surfaces on their stacks, tracked by the partner specialists already in the
  roster.

## 9. Build order, five PRs

| # | Repo | What | Gate |
|---|---|---|---|
| 1 | claude-skills-library (fold into #77) | this gate, this document, README row | 12 tests, Codex review |
| 2 | starlight-design-intelligence | `packages/materials` with `gate/` and `glass/` moved from the lab, a shadcn registry, its own `DESIGN.md` | gate passes on itself; one Next 16 example route measured on the slowest device |
| 3 | gencreator-ai (reference surface) | `DESIGN.md` per spec, materials gate in CI, one glass card | gate green in CI |
| 4 | starlight-intelligence-web | `/work` showcase from registries, Cache Components | registry row first; R4 run; craft receipt |
| 5 | claude-skills-library | `shot-planning` and `materials` skills with evals | `claude plugin eval` |

Over budget today: claude-skills-library (13 open) and agentic-ops-hub (82). PR 1 folds into #77;
PRs 2 to 5 wait for Frank to clear the budget or name the fold target.
