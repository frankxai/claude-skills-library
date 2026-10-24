# CI changes that need Frank's hands

The agent's GitHub connector cannot modify `.github/workflows/*`: GitHub refuses with `403 Resource not accessible by
integration`, because the app lacks the `workflows` permission. Workflow fixes from the G3 review are kept here as a patch
to apply with a token that has that scope:

```bash
git apply products/skills-with-evals/ci/skill-eval.yml.patch
git commit -am "ci(skill-eval): apply the G3 workflow fixes" && git push
```

| Patch hunk | G3 finding | Why it matters |
|---|---|---|
| Trigger paths add `scripts/**`, `.claude-plugin/**`, `catalog/**`, `products/skills-with-evals/**` | P0-1 | A change to `marketplace.json` alone currently does not run the test job, so a stale catalog can slip through on stacked PRs (`catalog-check.yml` only runs on PRs to `main`) |
| Test job runs `node scripts/build-catalog.mjs --check` | P0-1 | Same check as `catalog-check.yml`, on every PR this job sees |
| Test job runs `eval-pack.test.mjs`, `trigger-lint --pack` and `eval-card --check` as named steps | P1-4 | Each check shows up as its own CI step instead of hiding inside another test file |
| Lift lane reads its skills from `pack.json` (`LIFT_PACK`) instead of a hardcoded list of 3 | P1-4 | The `run-lift-eval` label currently measures only ui-ux-design-expert, book-publishing and excellence-book-writing; 7 of 10 pack skills would never run. Reading the manifest means the list cannot drift again |

**Until it's applied:** the test job already runs `scripts/tests/eval-skill.test.mjs`, which imports
`scripts/tests/eval-pack.test.mjs`, so the catalog check, the pack-wide trigger lint and the card check run in CI
today whenever the job triggers. Two gaps remain until the patch lands: the trigger paths (first row), and the CI
lift lane covering only 3 skills. For G1, use `scripts/run-pack-lift.mjs`, which runs all 10 locally.
