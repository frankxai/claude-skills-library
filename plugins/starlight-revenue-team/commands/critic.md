---
description: Score a piece, page or pull request against the 30-point rubric through a different model provider than the one that made it
argument-hint: <file, url or pr> [maker provider]
---

Load the `revenue-protocol` skill. Dispatch the `content-critic` agent on: $ARGUMENTS

If the maker provider is not given, read it from the commit trailer, the PR branch
prefix or the piece's folder, and say where it came from.

The critic returns a score as JSON:

```json
{
  "target": "<path or url>",
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
  "total": 27
}
```

Save it beside the target as `score.json`, then run
`node "${CLAUDE_PLUGIN_ROOT}/bin/rubric-check.mjs" score.json` and report its verdict
exactly as printed. Exit 0 is ship, 2 is revise, restart or missing-independent,
1 is an invalid score file.
