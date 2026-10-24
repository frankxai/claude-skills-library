# Support Copilot — architecture notes (pre-launch)

Support Copilot answers customer emails for a B2B SaaS with 1,400 customer accounts and drafts or takes
actions (refunds, plan changes). Launch to all accounts is planned next week.

## Request path

1. An inbound email hits `POST /api/inbound` (Vercel function). It validates the sender, stores the
   email and enqueues a durable workflow run (Vercel Workflows, one run per email, idempotency key =
   message id), then returns 202.
2. The workflow retrieves the 8 most similar help-center articles and the customer's last 20 emails
   from the vector index, filtered by `tenant_id` of the sender's account.
3. Retrieved text is passed as clearly delimited, untrusted user-side context, never in the system
   prompt. The system prompt is a versioned file (`prompts/support@v14.md`).

## Agent loop (`lib/agent.ts`)

```ts
const MAX_STEPS = 8
const budget = new SpendBudget({ usd: 0.5 })          // per email
for (let step = 0; step < MAX_STEPS; step++) {
  const res = await model.generate({ task: 'support-reply', messages, tools, timeoutMs: 30_000, budget })
  messages.push(res.message)
  if (res.finishReason === 'stop') break
  for (const call of res.toolCalls) messages.push(await runTool(call, { email, budget }))
}
if (!done) await escalateToHuman(email, 'step limit reached')
```

Tools: `lookup_account`, `draft_refund(amount)`, `draft_plan_change(plan)`, `draft_reply`.
Refunds and plan changes are drafts: a support agent approves each one in the helpdesk before it runs.
Drafts above 200 EUR require a team lead.

## Where the model is called

```
$ rg -l "from 'openai'|from '@anthropic-ai/sdk'" src
src/lib/model.ts
```

`lib/model.ts` is the only module that knows a provider. It routes by task, applies the timeout,
falls back to a second provider when the first returns errors or exceeds latency, and records cost
per call.

## Memory

Embeddings live in one index with a mandatory `tenant_id` filter enforced in the retrieval function;
a test asserts that a query for tenant A never returns tenant B's documents.

## Nightly re-index

A scheduled Vercel Workflow re-embeds changed help-center articles and new emails in batches of 200,
with checkpoints; a failed batch resumes from its checkpoint.

## Prompts and changes

Prompt changes go through a pull request. CI runs a 120-case regression eval (real anonymised emails
with expected actions) and blocks the merge if the pass rate drops more than 2 points.

## Operations

Per-email budget of 0.50 USD and 8 steps; exceeding either escalates to a human. Model calls time out
after 30 s and fall back to the second provider. Cost per email and per tenant is on the dashboard.
