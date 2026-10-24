# Answer key: product-management-expert seeded-defects

Never staged into a run (scripts/eval-skill.mjs NEVER_STAGED).

1. **no-problem-evidence** (discovery): the Problem section stating 'Users want AI' and competitor pressure with no evidence of a real user problem (no data, research or pain measured) → fix: stating the user problem with evidence (research, analytics, support data) before the solution
2. **unmeasurable-metrics** (metrics): success metrics 'Users love it' and 'Increase engagement', which have no definition, baseline, target or timeframe → fix: defining measurable primary and guardrail metrics with baseline, target and time window
3. **no-target-user** (scope): the Users section saying 'Everyone who uses Team Inbox' instead of a specific target segment → fix: naming a specific first target segment (who, which plan, which use case)
4. **no-non-goals** (scope): the missing non-goals / out-of-scope section → fix: adding explicit non-goals that bound the first release
5. **contradictory-scope** (scope): the requirements that contradict each other: all 12 integrations at launch, shipped in 2 weeks by two engineers → fix: cutting scope (e.g. one or two integrations) or changing the timeline so the plan is feasible
6. **auto-send-no-human** (risk): the plan to auto-reply to every email with no human review, despite the risk of wrong or harmful replies going to customers → fix: starting with drafts or suggestions that a human approves (or another explicit safeguard)
7. **eu-data-unaddressed** (risk): requirement 4 sending EU customers' emails to the AI provider with no data-protection, DPA or legal review in the Risks section → fix: adding a data-protection/legal review (DPA, EU data residency) as a dependency or limiting scope until it is cleared
8. **big-bang-rollout** (rollout): the rollout of turning it on for all workspaces on day one, with no staged rollout, guardrails or rollback plan → fix: a staged rollout (beta percentage) with guardrail metrics and a kill switch / rollback
