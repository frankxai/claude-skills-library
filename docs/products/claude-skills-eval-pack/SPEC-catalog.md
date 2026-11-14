# Spec: catalog

Module id `catalog` · depends on `verdict-store` and `eval-runner` · status: proposed.

## Objective

A public, per-skill proof surface inside `github.com/frankxai/claude-skills-library`. Each
listing shows the owning repo, version, verdict, the run receipt, the passing cases and the
failing cases. A buyer's agent can read the same data as JSON. No new site, no new domain, no new
brand.

## Tech stack

The repo's existing static catalog (`scripts/generate_catalog.py` → `docs/CATALOG.md`,
`scripts/generate_site.py` → `docs/index.html`) plus `graph/skills.graph.json` and
`ops/skill-eval-verdicts.json`. No new framework. Any page work follows
[DESIGN-EXPECTATIONS.md](DESIGN-EXPECTATIONS.md) and §11.3 before implementation.

## Commands

```text
python3 scripts/validate_skills.py
python3 scripts/generate_catalog.py --check
python3 scripts/generate_site.py --check
node scripts/check_counts.py
node scripts/check_links.py
node scripts/eval-pack-scoreboard.mjs --estate-root <starlight-root>
```

## Project structure

```text
docs/CATALOG.md                     # generated, do not hand-edit
docs/index.html                     # generated, do not hand-edit
scripts/generate_catalog.py         # add verdict + receipt columns here
scripts/generate_site.py            # render the same data
docs/products/claude-skills-eval-pack/scoreboard.latest.json
```

## Code style

Generated files carry a header naming the generating command. The generator reads the graph and
the verdict store; it never hardcodes a count:

```python
verdict = verdicts["skills"].get(skill["name"], {}).get("verdict", "UNEVALUATED")
receipt = verdicts["skills"].get(skill["name"], {}).get("receipt")
```

`UNEVALUATED` is shown as such. A missing receipt renders as a gap, never as a green badge.

## Testing strategy

- `generate_catalog.py --check` and `generate_site.py --check` prove the generated files match
  the tree; `check_counts.py` proves the totals match; `check_links.py` proves every receipt link
  resolves.
- Planted fault: remove a receipt pointer, regenerate, assert the link check fails.
- Browser evidence for any new page: 375 / 768 / 1440 widths, keyboard focus, reduced motion,
  and a real-device Playwright project. Emulation alone is not evidence (§11.3 predicate 10).

## Boundaries

- Always: one install CTA per page; sentence case; label `UNEVALUATED` honestly; cite the exact
  revision the verdict covers.
- Ask first: a new route, a new domain, a new visual language, changing the README's hero or
  install copy.
- Never: publish a count below `publicCountThreshold`; invent a seat, position or deadline; show
  a checkout before a G5 PASS; copy a reference site's layout.

## Success criteria

Every one of the 606 resolved names appears with a verdict state; every PASS links a resolvable
receipt showing at least one failing case; counts in the README match the tree under
`check_counts.py`; `check_links.py` exits 0; the scoreboard reports G1 ≥10% before Phase 3.

## Open questions

`[OPEN]` whether the proof surface is a readable column in `docs/CATALOG.md` or a separate
`docs/proof/` page. Decide after measuring which catalog paths actually get traffic
(`gh api repos/frankxai/claude-skills-library/traffic/popular/paths`).
