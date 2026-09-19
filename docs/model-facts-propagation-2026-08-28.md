# Model facts correction — 2026-08-28

`free-skills/model-routing/SKILL.md` is the skill that tells agents in Frank's estate which
Claude model to spend money on. It was quoting pricing and default model IDs two generations
stale — Haiku 3.5 pricing presented as current Haiku 4.5 pricing, Sonnet 4.6 pricing presented as
current Sonnet pricing, an Opus figure that matches neither current nor the immediately-prior Opus
generation, and `claude-opus-4-8` / `claude-sonnet-4-6` named as the current defaults. The same
staleness had spread into three other skills that document or demonstrate model choice.

## Corrected model facts (verified 2026-08-28)

| Model | ID | Context | Max output | Input $/1M | Output $/1M |
|---|---|---|---|---|---|
| Claude Fable 5 | `claude-fable-5` | 1M | 128K | $10.00 | $50.00 |
| Claude Opus 5 | `claude-opus-5` | 1M | 128K | $5.00 | $25.00 |
| Claude Sonnet 5 | `claude-sonnet-5` | 1M | 128K | $2.00 | $10.00 |
| Claude Haiku 4.5 | `claude-haiku-4-5` | 200K | — | $1.00 | $5.00 |

Model IDs are complete as written — never append a date suffix. Cross-checked against this
library's own `claude-api` skill (Anthropic model reference, cached 2026-06-24), which agrees on
every ID, context window, and price above. Re-verify both against
[platform.claude.com](https://platform.claude.com/docs/en/about-claude/models/overview) before
citing these numbers again — they have already moved twice in 2026.

## Files corrected in this repo

1. **`free-skills/model-routing/SKILL.md`** — the primary fix. Rewrote the "current model IDs"
   callout, all three tier prices in the routing matrix (Haiku, Sonnet, and an Opus figure that was
   actually old Claude 3 Opus pricing, $15/$75), and the cost-optimization worked example. Expanded
   the matrix, routing rules, and escalation chain from three tiers to the four that are actually
   current (added Fable as an explicit escalation-only tier — it was previously only mentioned in
   passing). Added a "Relationship to other routing configs" section (see below) and a
   `Last verified: 2026-08-28` line.
2. **`free-skills/opus-extended-thinking/SKILL.md`** — frontmatter `external_version` and the
   intro paragraph both named Opus 4.8 / Sonnet 4.6 as the current family; updated to Opus 5 /
   Sonnet 5, with a changelog entry (this file already tracked version history, so the correction
   follows its own convention). Updated the one code example's model ID and the "Model notes"
   section. Left the file's technical content on the adaptive-thinking/effort API and
   `budget_tokens` removal alone — that material is accurate independent of which model is "current."
3. **`free-skills/claude-sdk/SKILL.md`** — the most pervasive instance: 17 code examples hardcoded
   `model="claude-sonnet-4-6"`, and a "Model Selection" section named `claude-opus-4-8` as the
   default with `### Claude Opus 4.8` / `### Claude Sonnet 4.6` headers. All swapped to
   `claude-sonnet-5` / `claude-opus-5`, headers renamed to match, stale "June 2026" verification
   date updated.
4. **`free-skills/arcanea-book-cover/SKILL.md`** — frontmatter `model: claude-opus-4-8` →
   `claude-opus-5`.
5. **`free-skills/mcp-architecture/SKILL.md`** — one code example, `claude-sonnet-4-6` →
   `claude-sonnet-5`.
6. **`free-skills/oracle-agent-spec/SKILL.md`** — four YAML/JSON agent-spec examples using
   `claude-sonnet-4-6` as the illustrative model choice → `claude-sonnet-5`.
7. **`free-skills/langgraph-patterns/SKILL.md`** — one code example, `claude-sonnet-4-6` →
   `claude-sonnet-5`.

Verification: `python3 scripts/validate_skills.py` still reports all 113 skills spec-compliant
after these edits (no frontmatter or structural regressions).

## The routing-config fragmentation

Frank has at least four sources of "which model should this task use" truth across the estate,
and they were not ranked anywhere. `model-routing/SKILL.md` now documents the hierarchy (see its
new "Relationship to other routing configs" section) without merging the four:

- **`starlight-evals/routing-table.json`** — confirmed evidence-derived: each task-class entry
  carries a `route`, `confidence`, `stakes`, an `evidence` string citing specific eval rounds, and
  an `autoApply` gate that gets set only once results are concordant across rounds. This is the
  source of truth for *task-class* routing (which tier a kind of task should hit).
- **`agentic-ops-hub/fleet/model-routing.json`** — an operational fleet config. Confirmed it exists
  (it wasn't visible in a shallow directory listing, only via `find`). It routes by abstract tier
  name (`"model": "opus"`, `"fallback_model": "sonnet"`) rather than raw model IDs, so it doesn't
  itself carry the stale-ID bug — but it depends on something else to say what "opus" currently
  resolves to, which is this skill's job.
  - `~/.starlight/routing.toml` — referenced by the task that produced this fix; not present in
  this sandbox to inspect (it's described as a per-machine file on Frank's own environment, not
  something this repo ships), so its content is undocumented here beyond naming it in the
  hierarchy.
- **`free-skills/model-routing/SKILL.md`** (this repo) is now positioned as the **model-facts
  reference** the other three should cite — current IDs, context windows, and pricing — not a
  competing source of task-class routing policy.

## Downstream copies still carrying the stale facts

Confirmed by direct comparison, not assumption:

```
md5(claude-skills-library/free-skills/model-routing/SKILL.md)              = 1cd97454cf1b22b501813ace42484802  (canonical, post-fix)
md5(frankx.ai-vercel-website/.claude/skills/model-routing/SKILL.md)        = 37340b31177024f6f12485d5a61ee4c6  (unfixed)
```

The two files are not a clean fork of each other, either — the website's copy is missing the
"Current model IDs" callout block entirely and carries a slightly different frontmatter
`description` wording, on top of carrying the exact same stale pricing lines
(`$0.25/1M`, `$3/1M`, `$15/1M`, `$75/1M`) this fix removed from the canonical copy. That means a
reinstall there needs a real diff-and-merge against this repo's version, not a blind file copy —
a copy-over would either clobber whatever caused the two to diverge, or (if done carelessly in the
other direction) resurrect the stale numbers here.

**No other repo was touched.** Per the task scope, this fix stayed inside
`claude-skills-library`. Any repo that installed `model-routing`, `opus-extended-thinking`,
`claude-sdk`, or `arcanea-book-cover` from this library before 2026-08-28 should be treated as
stale until it re-installs from here — this repo is canonical, not the reverse.

## Found, not fixed (out of scope for this pass)

- **`free-skills/partner-anthropic/SKILL.md`** cites "Opus 4.7 ~$15/$75 per million input/output
  (to verify)" as partner/pricing intelligence for content generation about Anthropic-as-a-company.
  That figure doesn't match any current or immediately-prior Opus generation (real Opus 4.7
  pricing is $5/$25) — it looks like even older Opus pricing carried into a "to verify" note. It's
  a different kind of skill (partner narrative, not agent routing) and wasn't part of the grep
  pattern this task targeted, so it's flagged here rather than edited.
- `free-skills/partner-nvidia`, `partner-google`, `partner-vercel`, `partner-arrow`, and
  `free-skills/oci-services-expert` all carry "May 2026, to verify" pricing for other vendors —
  unrelated to Claude model routing, not touched.
- `free-skills/anthropic/mcp-builder/reference/evaluation.md` documents an evaluation script whose
  `--model` flag defaults to `claude-3-7-sonnet-20250219` — vendored reference docs for that
  script's actual coded default, not a "current model" claim, not touched.
- `free-skills/v-swarm/references/elevate-playbook.md` uses `'anthropic/claude-opus-4-7'` as an
  illustrative AI Gateway routing string — an example, not touched.

## Verification

```
grep -rn "0.25/1M\|\$3/1M\|claude-opus-4-8" --include="*.md" .
```

returns no matches (previously matched lines across all 7 files corrected above).
