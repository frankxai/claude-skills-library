# Support Copilot — architecture notes (pre-launch)

Support Copilot answers customer emails for a B2B SaaS with 1,400 customer accounts and drafts or takes
actions (refunds, plan changes). It worked well in the demo. Launch to all accounts is planned next week.

## Request path

1. An inbound email hits `POST /api/inbound` (Vercel function, 60 s max duration).
2. The handler retrieves the 8 most similar help-center articles and the customer's last 20 emails
   from the vector index, then builds the system prompt:

   ```
   SYSTEM = BASE_INSTRUCTIONS + "\n\nRelevant articles:\n" + articles + "\n\nCustomer history:\n" + history
   ```

3. It runs the agent loop below and sends the final reply by email.

## Agent loop (`lib/agent.ts`)

```ts
let messages = [{ role: 'system', content: SYSTEM }, { role: 'user', content: email.body }]
while (true) {
  const res = await openai.chat.completions.create({ model: 'gpt-5.6-sol', messages, tools })
  messages.push(res.choices[0].message)
  if (res.choices[0].message.content?.includes('DONE')) break
  for (const call of res.choices[0].message.tool_calls ?? []) messages.push(await runTool(call))
}
```

Tools available to the agent: `lookup_account`, `issue_refund(amount)`, `change_plan(plan)`, `send_email`.
`issue_refund` executes immediately up to the full invoice amount.

## Where the model is called

```
$ rg -l "from 'openai'" src
src/lib/agent.ts
src/lib/summarize-thread.ts
src/routes/admin/suggest-reply.ts
src/jobs/classify-intent.ts
```

## Memory

All customer emails and replies are embedded into one shared vector index (`support-memory`). Retrieval
filters by similarity only.

## Nightly re-index

`GET /api/cron/reindex` (same Vercel project, 60 s limit) re-embeds every help-center article and all
customer emails from the last 90 days in a single invocation.

## Prompts and changes

Support leads edit `BASE_INSTRUCTIONS` live in the admin panel; changes take effect immediately. We
check quality by reading a few replies each Friday.

## Operations

Model calls use the SDK defaults. There is no per-request spend limit; last week one thread ran 212
model calls overnight. If the provider is slow or down, the request fails and the email is retried by
the inbound webhook.
