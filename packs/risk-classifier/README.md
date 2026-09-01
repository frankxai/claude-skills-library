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

## Security posture (v1.1, per the PR #27 review)

- `--root` is resolved to the **git top-level** (realpath); a root outside any checkout
  is an error (exit 2).
- Every candidate path must be relative and traversal-free and must resolve inside that
  root; absolute paths, `..`, and empty segments are rejected as `unsafe_path` (gating).
- **Symlinks are never followed.** Every ancestor and the file itself are `lstat`ed; any
  symlink gates as `unsafe_path`, so a malformed or hostile `--files` list cannot make
  the secret scanner read outside the repository.
- Secret scanning **streams** the whole file in 1 MiB chunks with a 4 KiB overlap, so
  secrets past the first chunk or spanning a boundary are found. Files over 64 MiB gate
  as `unscanned` — never a silent clear.
- `prose_docs` is an **explicit bounded allowlist** of internal-notes roots, not an
  extension rule. `docs/launch.md`, `docs/customer/**`, policy variants and any other
  prose outside the list are unclassified and gate. Repos widen the list only through
  `.claude/ci/risk-classifier/overrides.json`, which may add `paths` to non-gating
  classes and is rejected if it touches anything else.
- Running with neither `--files` nor `--base` is **missing input** and exits 2; an empty
  diff under `--base` is a legitimate clear.
- The installer verifies the target via `git rev-parse --show-toplevel`, so it works for
  both normal checkouts and worktrees.

## Tests

```bash
node --test tests/risk-classify.test.mjs
```

24 cases over real temporary git repos: classification semantics (bounded prose
clears; launch/customer docs, `data/`, lockfiles, assets, claims, migrations, governing
docs, deletions, mixed sets gate; override widening and override rejection), path
safety (traversal, absolute, symlinked file, symlinked ancestor), size boundaries
(secret past 1 MiB, secret across the chunk boundary, over-limit → `unscanned`), and the
CLI contract (missing input → 2, empty diff → 0, non-git root → 2).
