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

**Until it's applied:** the test job already runs `scripts/tests/eval-skill.test.mjs`, which imports
`scripts/tests/eval-pack.test.mjs`, so the catalog check and every pack test run in CI today whenever the job
triggers. The remaining gap is the trigger paths (first row).
