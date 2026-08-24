---
name: excellence-review
description: Mandatory excellence gates for Grok+ACOS. verification-loop, santa-method, gstack-qa, plan-reviews, repo-mastery, cso, rules-distill. Never ship without evidence (gstack screenshots, metrics). Use on any build/suggest/lead task.
---

# Excellence Review Skill — Grok Harness

## God 99 Mandate
1. repo-mastery (read all rules files first, map cross-repo)
2. CEO/Eng/Design plan reviews (subagent or delegate to claude)
3. Adversarial: verification-loop + santa-method (2 independent pass required)
4. gstack: qa (tiers quick/standard/exhaustive), browse, design-review, benchmark, canary
5. Security: cso / security-auditor + supply chain
6. Polish: rules-distill, skill-comply, document-release

Output format: report + before/after + artifacts. Iterate atomically.

Tools: gstack (headless browser ~100ms), terminal (tests), subagents.
