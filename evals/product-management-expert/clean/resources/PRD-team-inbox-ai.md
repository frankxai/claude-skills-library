# PRD: Suggested replies for Team Inbox (beta)

**Status:** In review · **Owner:** Priya N. (PM) · **Target:** beta to 5% of workspaces in sprint 43

## Problem
Agents on teams with more than 200 emails a day spend a median of 4.2 minutes writing each first reply
(product analytics, Aug–Sep, n = 38,000 replies). In 11 of 14 customer interviews, agents said 60–70%
of their first replies answer the same 30 questions (order status, refund policy, password reset).
Slow first replies are the top reason in churn surveys for workspaces on the Growth plan (31% of
churned Growth workspaces, Q3).

## Target users
Support agents in workspaces on the Growth and Scale plans with more than 200 inbound emails per day,
using the Gmail or Outlook integration (78% of that segment).

## Proposal
Show one suggested first reply, drafted from the workspace's own help-center articles and saved
replies, that the agent can edit and send. Nothing is sent without an agent pressing Send.

## Non-goals
- Fully automatic sending.
- Integrations other than Gmail and Outlook in the beta.
- Follow-up replies after the first one.

## Requirements
1. Draft appears within 5 seconds of opening an email, for emails in supported languages (EN, DE, FR, ES).
2. Every draft cites the article or saved reply it used; drafts without a source are not shown.
3. Agents can rate a draft (useful / not useful) in one click.
4. Workspace admins can turn the feature off.

## Success metrics
- **Primary:** median time to first reply for beta agents drops from 4.2 to under 2.5 minutes within
  6 weeks of enablement, against a matched control group.
- **Guardrails:** CSAT on drafted replies stays within 2 points of non-drafted replies; reopen rate
  does not rise more than 1 point.
- **Adoption:** at least 40% of drafts sent with light or no edits by week 4.

## Rollout and rollback
5% of eligible workspaces (opt-out allowed), then 25% and 100% if the primary metric and guardrails
hold for two weeks at each step. A feature flag turns it off per workspace or globally within minutes.

## Risks and dependencies
- **Data protection:** emails from EU workspaces are processed by our model provider. Legal (owner:
  M. Duarte) must confirm the DPA and EU data-residency option before the beta includes EU workspaces;
  until then the beta is US-only.
- **Wrong answers:** mitigated by source citation, agent review before sending, and the guardrail metrics.
- **Cost:** estimated 0.6–0.9 cents per draft at current model prices; finance (owner: J. Lee) to confirm
  the margin impact before 25%.

## Open questions
| Question | Owner | Due |
|---|---|---|
| Is the feature included in Growth or a paid add-on? | Priya N. with finance | Sprint 42 review |
| Which model and fallback, based on the eval on 500 anonymised emails? | Eng lead (A. Okafor) | Sprint 42 |
