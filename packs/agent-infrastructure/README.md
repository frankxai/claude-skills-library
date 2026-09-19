# agent-infrastructure

A portable pack that gives every repo the **same nine agent-runtime skills**,
sourced from one canonical place, so an agent loading `swarm-orchestration`
gets the same instructions no matter which repo it is standing in.

## Why this pack exists

The 2026-08-28 drift measurement
([docs/skill-drift-2026-08-28.md](../../docs/skill-drift-2026-08-28.md)) found
1,065 `SKILL.md` copies across the estate under 371 names, 131 of them in 2–4
divergent versions — and the divergence concentrated in the multi-agent
operational layer that five repos (`FrankX`, `frankx.ai-vercel-website`,
`agentic-creator-os`, `arcanea`, `arcanea-ai-app`) copied around by hand.
Meanwhile the one skill distributed through a pack (`web-excellence`'s
`web-release-gate`) sat byte-identical in 15 repos. The mechanism works; this
pack extends it to the layer that drifted worst.

## Why these nine group together

They are one system, not a grab bag: the claude-flow / agentic-flow
operational layer a repo needs when it runs multi-agent work. They
cross-reference each other (`swarm-advanced` and `hive-mind-advanced` both
point at `swarm-orchestration`; `verification-quality` references the
hive-mind), and the five repos above already carried all of them side by side
— they were installed together by hand, which is what made them drift
together.

| Role | Skills |
|---|---|
| Coordination | `swarm-orchestration`, `swarm-advanced`, `hive-mind-advanced` |
| Memory | `reasoningbank-intelligence`, `reasoningbank-agentdb` |
| Lifecycle & pipelines | `hooks-automation`, `stream-chain` |
| Quality | `verification-quality` |
| Skill tooling | `skill-builder` |

Unlike `web-excellence`, nothing here is vendored from a third party: all nine
canonical copies live in this library's `free-skills/` tree, and the pack is a
**manifest plus installer** over them — no second copy inside `packs/` that
could drift against canon. [SOURCES.md](SOURCES.md) records where each
canonical version came from and every per-skill reconciliation decision.

## Install

```bash
# from a clone of this repo
packs/agent-infrastructure/install.sh /path/to/your/repo

# from anywhere
git clone --depth 1 https://github.com/frankxai/claude-skills-library /tmp/csl \
  && /tmp/csl/packs/agent-infrastructure/install.sh "$PWD"
```

Idempotent — re-run to upgrade. `--dry-run` shows what would change, which
doubles as a per-repo drift report: `ok` means already canonical, `DIVERGED`
means the local copy differs from canon.

**Diverged copies are never overwritten silently.** An existing skill that
differs from canon is set aside to `.claude/skills/.replaced/<name>/` and named
loudly in the output. That matters because at least one divergence is a
deliberate fork: `FrankX` and `frankx.ai-vercel-website` carry a SIP-flavored
rewrite under the name `swarm-orchestration` — see
[SOURCES.md](SOURCES.md#the-known-deliberate-fork--do-not-flatten-it) for the
recommendation (rename it locally, then install).

Which repos should install it: the five carriers above first — that alone
collapses 8 of the 131 drifted names to one version each. Any other repo that
runs swarm/multi-agent sessions can install it for the same canon.

## Keeping it honest

- `./sync-upstream.sh` — refreshes the content-hash pin table in
  [SOURCES.md](SOURCES.md) after canon changes in `free-skills/`.
- `./sync-upstream.sh --check` — CI-safe: exits non-zero if the pin table no
  longer matches canon or a manifest entry stops resolving.

Fixes land in `free-skills/` (that is where the model-fact corrections of
2026-08-28 landed), then `sync-upstream.sh` refreshes the receipt, then
consumers re-run `install.sh`. Never edit a consumer repo's installed copy —
that is how the drift started.

## Flagged for Frank (decisions this pack did not make)

1. **The FrankX `swarm-orchestration` fork** should get its own name in the
   two repos that carry it. Until then, installing there sets it aside to
   `.replaced/` rather than deleting it. Details and the stale-model-facts
   note in [SOURCES.md](SOURCES.md).

## Tests

```bash
python3 packs/agent-infrastructure/tests/test_install.py
```

79 checks, no dependencies: manifest entries resolve to spec-valid skills,
installed trees are byte-identical to canon, re-runs change nothing, diverged
copies are preserved and reported, dry-run writes nothing, bad manifest
entries fail loudly, and the sync script's drift detection goes red when canon
changes (proven hermetically, without touching the real `free-skills/`).
