# Cross-model skill eval

The question this answers: does each skill make each model produce the right thing? It tests ten skills across six models.

Each case in `cases.json` works like this:

1. The skill's `SKILL.md` becomes the system prompt.
2. A realistic task becomes the user turn.
3. The answer must match every `must` pattern.
4. A model from a **different family** grades the rubric. GPT-6 Luna grades everyone except OpenAI; Claude Haiku 4.5 grades OpenAI.
5. A case passes when every pattern matches and at least 60% of the rubric is met.

**Per model** the scorecard reports:

| Pass rate | Verdict |
|---|---|
| 80% or more | PROCEED |
| 50% or more | REVISE |
| Below 50% | STOP |
| Nothing graded (no credentials) | UNAVAILABLE |

The format is the `starlight-evals` scorecard contract.

| Maker | How it runs | Cost |
|---|---|---|
| Claude Opus 5.5 | Unmodified Claude Code on the owner's login (`CLAUDE_CODE_OAUTH_TOKEN` from `claude setup-token`) | Subscription window; API-equivalent recorded as notional |
| GPT-6 Luna, Gemini 3.8 Flash, Kimi K3 | Vercel AI Gateway (`AI_GATEWAY_API_KEY`) | Metered at gateway list price |
| GLM-5.3, DeepSeek V4.1 Flash | Vercel AI Gateway pinned to US-headquartered hosts | Metered at gateway list price |

## Run

**Locally, with no keys:** every lane reports UNAVAILABLE and nothing is spent.

```
cd evals/skill-eval && pnpm install && node run.mjs
```

**In CI:** run the `skill-eval` workflow by hand, with `max_usd` capping the run (default $2). At list prices a full run is expected to cost about $1; the scorecard records what it actually spent.

**Monthly schedule:** set the repository variable `SKILL_EVAL_SCHEDULE_ENABLED=true` to switch it on.

## Limits

- **One task per skill** is a signal, not a benchmark.
- **The skill is tested as a system prompt.** Whether a harness triggers it on its own is not measured.
- **A single grader** can be wrong. Scorecards keep every per-criterion score, so disagreements can be inspected.
