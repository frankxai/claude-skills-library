# Cached-Belief Validation Contract

Designed 2026-04-15 (this session). Starlight-Architect reviewed; Lumina + 5 Guardians ratified. **Not yet shipped to disk** — Week-1 ship pending Frank approval.

## The problem

LLMs (me) cite cached beliefs (memory, prior-turn context, stale CLAUDE.md, drifted skill descriptions) as current fact. Concrete failure: 2026-04-15 status question on arcanea-claw/publishing-house — quoted v0.2.0 from memory, reality on disk was v0.3.0. Same class of bug as claiming a build passed without checking deploy.

## The contract (5 layers)

| L | Layer | Status | Week |
|---|---|---|---|
| L0 | Authority Registry (`.arcanea/AUTHORITY.md`) | designed | 2 |
| L1 | Memory frontmatter (`verified_on`, `authoritative_for` enum) | designed | 2 |
| L2 | CLAUDE.md "Cached-Belief Validation Protocol" section | designed | **1 (pending ship)** |
| L3 | `/verify-status` skill | designed | 3 |
| L4 | Stop-hook claim audit + telemetry | designed | 4 |

## Week-1 ship list (3 files, ~60 lines, Guardian-approved)

### 1. Root `CLAUDE.md` — new section (~15 lines)

```markdown
## Cached-Belief Validation Protocol

Any claim about CURRENT state — versions, ship status, file paths, architecture, deployment, quantities, dates of events older than this turn — requires same-turn verification (Read/Bash) OR explicit prefix: "unverified, from [memory|prior-turn|claude.md] (date X):".

Memory is authoritative ONLY for: intent, strategy, preferences, decision history, rationale.
Memory is NEVER authoritative for: current state of code, deploys, or systems.

Vague status claims ("X is mature", "Y is shipped") without provenance are violations. Either verify or disclaim.

Latency permission: 3-5 seconds of disk reads beats instant stale answers. Frank prefers correct-slow over confident-wrong.
```

### 2. `memory/MEMORY.md` header (~3 lines, prepended)

```markdown
> ⚠ Memory is historical. NEVER authoritative for current state (versions, ship status, paths, deploys).
> Authoritative for: intent, strategy, preferences, decision history.
> Read disk before citing project state.
```

### 3. `memory/feedback_cached_belief_validation.md` (new)

```markdown
---
name: cached-belief validation
description: Disk-first rule for any current-state claim — memory is history, not truth
type: feedback
---

Rule: any claim about current state (versions, ship status, file paths, architecture, deploys, quantities) requires same-turn tool-call verification OR explicit "unverified, from memory:" prefix.

Why: 2026-04-15 — quoted 11-day-old memory as current fact for arcanea-claw/publishing-house status. Real disk state differed materially. Same failure class as claiming build-passed without deploy check.

How to apply: when Frank asks "status of X" or "where is Y" or "what's the version of Z" — read disk first. Memory is history. Never claim current state from cache without verification.

Memory IS authoritative for: intent, strategy, preferences, decision history, rationale. Don't disclaim those — that's memory's job.
```

## Deferred (Weeks 2-4)

### Week 2 — Authority + frontmatter

- `.arcanea/AUTHORITY.md` — fact-type → source-of-truth map. Table format:
  ```
  | Fact type | Authority | How to query |
  |---|---|---|
  | Version | package.json or repo tag | cat package.json | jq .version |
  | Ship status | git log + deploy state | git log + vercel/deploy API |
  | Architecture | actual code | Read + Glob on source files |
  | Intent/strategy | memory | grep memory/ |
  | File location | disk | ls / Glob |
  ```

- Memory frontmatter migration: add `verified_on: <date>` + `authoritative_for: intent | strategy | preference | decision_history | NONE` to top 20 memory files.

- Frontmatter linter: rejects entries claiming `authoritative_for: strategy` while containing version numbers (contract violation).

### Week 3 — `/verify-status` skill

`~/.claude/skills/verify-status/SKILL.md` — forceable verification routine. Checklist per project: git log, package.json read, deploy API check, memory diff. Produces "verified status report" Frank can trust.

### Week 4 — Stop hook + telemetry

`~/Arcanea/.claude/hooks/claim-audit.sh` (Stop event):
- Inspect last assistant response transcript
- Regex-scan for: version numbers (`v?\d+\.\d+\.\d+`), shipped/deployed/live claims, "in production"
- Cross-reference against tool calls in same turn
- Log violations to `~/Arcanea/.claude/audit/stale-claims.log`
- Append weekly summary to `/arcanea-status` dashboard

**Important per Ismael review:** Stop hook is TELEMETRY not GATE. Cannot block already-sent response. The L2 protocol IS the prevention; hooks audit after.

## Telemetry

Three metrics, weekly:
1. **Violation rate** — entries in stale-claims.log per week. Target: declining.
2. **Verification latency** — time-to-first-tool-call on status questions. Target: <5s.
3. **Memory write discipline** — % of new memory entries with `verified_on` matching in-session tool call. Target: 100%.

If violation rate doesn't drop 60%+ after 2 weeks of L2 alone, escalate timeline (L4 hook earlier).

## Open questions (Guardian review didn't fully close)

- Does `authoritative_for: NONE` create dead-weight memory? (Or is it the right honesty?)
- Should the contract apply to skill descriptions (currently no enforcement)?
- Forkability: if extracted as `@arcanea/validation-contract`, what's the install path for non-Arcanea users?

## Meta-failure guard

The contract itself can lie. Mitigations:
- Frontmatter linter (Week 2)
- Measure violations weekly before expanding
- Accept hooks are audit not gate
- This document was written from disk-verified facts only (Move 2 of 2026-04-15 build)
