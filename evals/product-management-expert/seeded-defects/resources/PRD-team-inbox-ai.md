# PRD: AI Replies for Team Inbox

**Status:** Approved · **Target ship:** in 2 weeks (end of sprint 41)

## Problem
Users want AI. Competitors all have AI features now, and our inbox feels old without it.

## Solution
Build an AI agent with GPT that reads every incoming customer email and writes the reply automatically,
so teams never have to type a response again.

## Users
Everyone who uses Team Inbox.

## Requirements
1. Auto-reply to every incoming email within 30 seconds.
2. Support all 12 existing integrations (Gmail, Outlook, Zendesk, Intercom, HubSpot, Front, Help Scout,
   Freshdesk, Slack, Teams, WhatsApp, SMS) at launch.
3. Ship in 2 weeks with the current team of two engineers.
4. Replies are processed by our AI provider, including for our EU customers' mailboxes.

## Success metrics
- Users love it.
- Increase engagement.

## Rollout
Turn it on for all workspaces on launch day.

## Risks
- None significant; the model is very good.

## Decisions
- Use GPT-6 Sol. (decided)
- Pricing: included in all plans. (decided)
