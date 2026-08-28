# Conformance

A skill conforms **at Level N** when it satisfies every requirement of Levels 1 through N. The [`validate-skill.mjs`](./validate-skill.mjs) tool computes the highest level a skill satisfies and prints a per-level report.

## Running the validator

```bash
node standard/validate-skill.mjs <path-to-skill-folder>
```

It is zero-dependency (Node 18+) and exits `0` after printing the report.

## The checklist

### Level 1 — Documented
- [ ] Folder root contains a file named exactly `SKILL.md` (uppercase).
- [ ] `name` is lowercase, hyphenated, ≤ 64 chars, and is not `anthropic` or `claude`.
- [ ] `description` is non-empty, ≤ 1024 chars, third person, and states **what + when + trigger keywords**.

### Level 2 — Referenced
- [ ] At least one of `references/`, `scripts/`, `assets/` exists and is non-empty.
- [ ] The `SKILL.md` body is under ~500 lines.
- [ ] Deep material lives in `references/`; deterministic checks live in `scripts/`.

### Level 3 — Evaluated
- [ ] `evals/` exists with at least three scenarios: success, incomplete input, misuse boundary.
- [ ] Scenarios are re-runnable.

### Level 4 — Governed
- [ ] Frontmatter declares `version`, `owner`, `risk_tier`, `status`, and `rollback`.
- [ ] `risk_tier` is one of `T0`–`T4`.
- [ ] The skill is recorded in the team's registry.

### Level 5 — Composed
- [ ] Frontmatter declares `composes`, `attestation`, and `boundary`.
- [ ] The skill coexists with its bundle without degrading routing.

## How the validator maps fields to levels

| Level | What the validator checks |
|---|---|
| L1 | `SKILL.md` present; `name` matches `^[a-z0-9][a-z0-9-]*$` and ≤ 64; `description` non-empty ≤ 1024 |
| L2 | a non-empty `references/`, `scripts/`, or `assets/`; body ≤ 500 lines |
| L3 | a non-empty `evals/` directory |
| L4 | frontmatter contains `version`, `owner`, `risk_tier`, `status`, `rollback` |
| L5 | frontmatter contains `composes`, `attestation`, `boundary` |

Unknown frontmatter fields are ignored, so a skill can carry extra metadata without affecting its level.
