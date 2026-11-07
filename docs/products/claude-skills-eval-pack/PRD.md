# PRD - Skills that ship with their evals

Product id `claude-skills-eval-pack` · 2026-11-07 · authored by OpenCode · status: specification, not implementation.

## The job

A developer who installs agent skills into Claude Code, Cursor, Codex or OpenCode has no way to
tell, before installing, whether a skill still behaves under pressure. They read the `SKILL.md`,
install it, and find out in their own repo. Anthropic's own reference repository tells them to
"always test skills thoroughly in your own environment before relying on them" - the test is the
buyer's unpaid work.

The finished artifact that satisfies this job: an installable pack where **every skill carries a
published eval receipt** - the suite, the passing cases, the failing cases, and the exact revision
it was run against. A buyer can inspect the failures before deciding. Their agent can read the
same verdicts as machine data.

## Evidence (all measured by command)

| Fact | Value | Command | Date |
|---|---|---|---|
| Registry row exists | `claude-skills-eval-pack`, stage `concept`, gate `UNGATED`, band `25-99` EUR, price evidence `none yet` | `Get-Content starlight/graph/products.graph.json` | 2026-11-07 |
| Audience on the one measured surface | 1,347 views / 721 uniques, 14-day API window (`views[]` has 14 entries, 2026-10-23 to 2026-11-05) | `gh api repos/frankxai/claude-skills-library/traffic/views` | 2026-11-07 |
| Snapshot on an earlier date (not a comparable trend) | 790 views / 469 uniques | same command | 2026-10-24 |
| Skill namespace | 936 `SKILL.md` → 606 unique names, 0 conflicts, 115 versioned, 30 with an eval | `node tools/gen-skills-graph.mjs` | 2026-11-07 |
| Eval verdicts already produced | 30 PASS, 0 REVISE, 0 FAIL, planted faults caught 90/90 | `Get-Content ops/skill-eval-verdicts.json` | 2026-10-25 (generator `tools/eval-skills-suite.mjs`) |
| Demand funnel | exit 1: `KV_REST_API_URL/TOKEN required` | `node packages/demand-capture/report.mjs` | 2026-11-07 |
| This repo's PR queue | 16 open PRs (budget 10, so over budget); confirmed by both `gh search prs` and `gh api pulls?state=open` | `gh search prs --repo frankxai/claude-skills-library --state open --limit 100 --json number` | 2026-11-07 |
| Price evidence for any product | 0 `DemandSignal` rows readable; G5 has nothing to grade | `packages/demand-capture/report.mjs` exit 1 | 2026-11-07 |

Honest reading: the audience is real, but the two dated snapshots are overlapping rolling windows
and cannot be compared as a trend; the proof plumbing is 30 skills deep; the capture and price
evidence are absent because one credential set is missing. No price, no
checkout, no publication is claimed.

## The reference bar (§5b obligation 2)

| Reference | What it does well | The dimension we beat it on | Verdict |
|---|---|---|---|
| `anthropics/skills` (opened 2026-11-07, `https://raw.githubusercontent.com/anthropics/skills/main/README.md`) | canonical skill format, spec, licensed reference skills | **proof, not prose**: it disclaims and asks the buyer to test; we publish the test, its passes and its failures | beat required |
| `skills.sh` (opened 2026-11-07, `https://www.skills.sh/`) | cross-agent directory with per-skill install counts | **behavioural evidence**: install count is popularity, not behaviour; every listing carries a verdict and a run receipt | beat required |
| Writing the skill yourself in an afternoon (registry `mustBeat[]`) | zero install cost, full control | **time-to-trust**: a receipt that shows the failure cases beats re-deriving them alone | beat required |

"Comparable" is a failing verdict. If a listing has no eval receipt, the product does not exist
for that skill, whatever the copy says.

## Goals

Ranked, each with a command that measures it. Full table: [GOALS.md](GOALS.md).

1. Every public skill listing carries a verdict and a run receipt; nothing ships unverified.
2. The waitlist writes a real `DemandSignal` with `productId` and a price band.
3. One installable, versioned pack exists for three harnesses.
4. `PRODUCT-RELEASE-GATE.md` G0–G5 produce receipts before any price is asked.
5. The catalog passes §11.3 mobile predicates and a real-device Playwright check.

## Non-goals

- A new brand, a new repository, a new site or a new marketplace. The surface stays
  `github.com/frankxai/claude-skills-library`.
- Rebuilding the eval runner. `tools/eval-skills-suite.mjs` and `ops/skill-eval-verdicts.json`
  already work; harden and extend them.
- A general agent framework, a hosted service, multi-tenant compute, or a support channel.
- Publishing anything to npm or a marketplace in this slice.

## Anti-goals (a technical pass here still fails)

- A catalog that shows a green badge with no receipt file behind it.
- Evals that only grade the `SKILL.md` text and never exercise an agent.
- A waitlist that captures an email without `productId`, or asks for a price before giving a gift.
- A count, position, seat or deadline invented because the real number is below threshold.
- Prose that calls the pack "verified" when the verdict is less than a week old and the skill has
  changed since.

## Requirements

| id | Requirement | Acceptance |
|---|---|---|
| R1 | One owning repo per skill name | `node tools/gen-skills-graph.mjs` exits 0 with 0 conflicts; `resolvedBy` records the rule |
| R2 | Verdicts are a machine-readable registry | `ops/skill-eval-verdicts.json` with `passed/revise/failed`, `plantedFaultsCaught`, `updatedAt`, per-skill `receipt` pointer |
| R3 | Evals exercise the agent | at least one `skill-used` assertion and one near-miss `not-skill-used` case per suite; `--repeat 3` on nondeterministic cases |
| R4 | Failure cases are visible | each listing links its failing cases and the exact `SKILL.md` revision |
| R5 | Standard demand capture | two-step form writing `DemandSignal` with `productId: claude-skills-eval-pack`, `priceBand`, `consent: true` |
| R6 | Give before ask | the registry `gift` (one skill + eval suite + run output with failures) is packaged and delivered before any price question |
| R7 | Agent-native surface | `/.well-known/starlight.json`, install manifests per harness, CLI `--json` with stable exit codes |
| R8 | Gates before money | G0–G5 receipts exist; `gate` string in the registry moves off `UNGATED` only with a dated PASS |

## Constraints and gates

- `TRUTH.md` wins over this document. Registry row first (§5c.1); standard capture, never bespoke
  (§5c.3); no build by taste while claiming to have read demand (§5c.5).
- Frank holds: KV/Resend/`POLAR_ACCESS_TOKEN`, a separate gated Polar slot, DNS, repo visibility,
  first-time publication, prices and checkout.
- Admission control: this repo has 16 open PRs today (measured 2026-11-07 by both `gh search prs`
  and `gh api pulls?state=open`), over the 10-PR budget. Per section 13, no new PR opens here until
  one is landed or closed. This definition suite stays on its branch without a PR for now.
- Maker ≠ checker: consequential output is reviewed by a different provider before Frank sees it
  (§5b.1 block 4).
- Every number in a shipped page maps to an evidence path (G0). Counts are generated, never typed.

## Decisions made in this suite (all reversible)

1. Build on the existing `claude-skills-eval-pack` row and the existing eval machinery.
2. Keep verdicts in a separate JSON registry, not in `SKILL.md` frontmatter (ADR-0001).
3. Use Promptfoo's agent-skill eval pattern, deterministic assertions first (ADR-0002).
4. Keep the catalog inside this repo; no new site (ADR-0003 covers namespace ownership).
5. Sequence publication behind G5 price evidence and Frank's release gate (ADR-0004).

## Failure and recovery

- `gen-skills-graph.mjs` exits 1 on an unresolved name conflict: the catalog build fails closed
  rather than publishing an ambiguous install slug.
- A missing or stale verdict renders `UNEVALUATED`, never a green state, and the scoreboard reports
  G2 or G3 as FAIL.
- KV or Resend unavailable: the capture returns an honest error, keeps step 1 resumable, and never
  reports a silent success. The gift email retry is idempotent.
- A wrong merge is reverted the same session; an unpublished pack stays unpublished. No recovery
  path depends on a backup of personal data outside KV.

## Open `[OPEN]`

- Real price evidence. `report.mjs` cannot read KV; no `DemandSignal` rows are available today.
- Which ten skills get evals first. Rank by measured traffic paths, then by install intent;
  re-measure `traffic/popular/paths` at Phase 1 start.
- Provider-% burn for the north-star metric (shipped artifacts ÷ provider-% burned).
- Whether the first fifty public answers in the README discussion count as price evidence. They
  are public intent, not a `DemandSignal`; G5 still needs the standard field.
