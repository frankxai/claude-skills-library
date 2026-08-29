# risk-classifier

Manifest-driven risk classifier for PR readiness gating across the frankxai estate.
Built for the 2026-08-29 campaign reviews on
[FrankX#149](https://github.com/frankxai/FrankX/pull/149) and
[Starlight-Intelligence-System#111](https://github.com/frankxai/Starlight-Intelligence-System/pull/111),
which retired path-based "content-only auto-ready" as a safety boundary.

## What it decides

Given a set of changed files, every file is classified against the eight risk classes
in `classes.json`:

`executable_config` (includes `data/`, agent-governing docs, workflows) ·
`generated_artifacts` · `public_claims` · `asset_rights` · `secrets` (path **and**
content scan) · `dependencies` · `migrations` · `production_surfaces` — plus the one
non-gating class `prose_docs` (plain `.md`/`.mdx`/`.txt` with no other role).

**Verdict is fail-closed:**

- `clear` — every file matched at least one class, none of them gating. In practice:
  pure prose documentation.
- `gated` — a gating class was touched, secret-shaped content was found anywhere, or
  a file matched no class at all (unknown fails closed). The JSON output names which
  classes and files, so a human can flip readiness with one glance.

Errors also fail closed (exit 2).

## Usage

```bash
# classify an explicit file set
node ci/risk-classify.mjs --root /path/to/repo --files docs/a.md lib/x.ts

# classify a PR-style diff against a base ref
node ci/risk-classify.mjs --root /path/to/repo --base origin/main
```

Exit codes: `0` clear · `1` gated · `2` error (treat as gated).

## Who consumes it

- **pr-steward-daily** (FrankX `docs/ops/prompts/pr-steward-daily.md`): runs this on a
  green PR's changed files and posts the classification as a PR comment. The steward
  never flips draft → ready.
- **Auto-ready** (Agent Operations Contract, SIS `docs/ops/`): stays **disabled
  fleet-wide** until this classifier has been reviewed and adopted. Shipping this pack
  does not enable auto-ready; it makes the review possible.

## Vendoring

Per library doctrine, tests live here with the pack. Repos vendor copies via
`./install.sh /path/to/repo` (copies `classes.json` + the engine into
`.claude/ci/risk-classifier/`) and upgrade by re-running it — never by hand-editing
the vendored copy.

## Tests

```bash
node --test tests/risk-classify.test.mjs
```

11 cases: prose clears; `data/`, lockfiles, public assets, content claims, secrets in
prose, unknown extensions, migrations, governing docs, deletions, and mixed sets all
gate.
