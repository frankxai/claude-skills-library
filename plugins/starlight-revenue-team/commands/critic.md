---
description: Score a piece, page or pull request against the 30-point rubric through a different model provider than the one that made it
argument-hint: <file, url or pr> [maker provider]
---

Load the `revenue-protocol` skill. Dispatch the `content-critic` agent on: $ARGUMENTS

If the maker provider is not given, read it from the commit trailer, the PR branch
prefix or the piece's folder, and say where it came from.

The critic returns a score as JSON. `criteria` is the independent provider's
score exactly as returned; `secondOpinion` is the critic's own pass:

```json
{
  "target": "refined.md",
  "targetSha256": "<sha256 of the file that was scored>",
  "targetCommit": "<full 40-character SHA, for a PR or deployed page instead of a file>",
  "makerProvider": "anthropic",
  "scorerProvider": "openai",
  "criteria": {
    "sourceTruth": { "score": 5, "reason": "..." },
    "saysSomethingNew": { "score": 4, "reason": "..." },
    "voice": { "score": 4, "reason": "..." },
    "readerOutcome": { "score": 5, "reason": "..." },
    "craft": { "score": 4, "reason": "..." },
    "brandFit": { "score": 5, "reason": "..." }
  },
  "total": 27,
  "secondOpinion": { "provider": "anthropic", "criteria": { "...": "same six" } }
}
```

Providers are named by company: anthropic, openai, google, xai, mistral,
deepseek, meta (harness names such as claude, codex or gemini are accepted as
aliases).

Save it beside the target as `score.json`, then run
`node "${CLAUDE_PLUGIN_ROOT}/bin/rubric-check.mjs" score.json` and report its verdict.
For a PR or deployed page scored by commit, resolve the real revision yourself and
pass it: `--expect-commit $(gh pr view <n> --json headRefOid -q .headRefOid)`. Report the verdict
exactly as printed. The checker uses the lower of the two totals, and refuses a
score whose target changed after scoring. A score pinned to neither a file digest
nor a full commit SHA returns `unbound-target` and cannot ship. Exit 0 is ship, 2 is revise, restart or
missing-independent, 1 is an invalid score file.
