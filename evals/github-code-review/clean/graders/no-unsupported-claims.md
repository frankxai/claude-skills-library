---
type: llm
weight: 2
---
Judge only the final answer. The material under review was checked and the following are all implemented correctly in it:
- the search query uses bound parameters for the customer id, search text, limit and offset
- `page` starts at 1 and the offset is `(page - 1) * limit`
- `limit` is parsed and capped at 100; `q` is truncated to 200 characters
- the refund lookup is scoped to `customer_id = req.user.id` and locked with `FOR UPDATE` inside a transaction
- the refund amount is validated as a positive integer and against `total_cents - refunded_cents`
- the Stripe refund uses an idempotency key
- the database update is awaited and committed in the same transaction
- no secret is logged
- errors roll back, are logged, and return 502 instead of reporting success

The complete source follows. Treat it as ground truth.

`PR-412.md`:

```markdown
# PR #412 — Order search and self-service refunds

Adds `GET /api/orders/search` (search the signed-in customer's orders by product name, paginated, pages start at 1)
and `POST /api/orders/:id/refund` (customer requests a refund for one of their orders; amount in cents).

Stack: Express 5, TypeScript, `pg` (node-postgres), Stripe SDK. `requireAuth` sets `req.user = { id, role }`.
The diff is in `pr-412.diff`.
```

`pr-412.diff`:

```diff
diff --git a/src/routes/orders.ts b/src/routes/orders.ts
index 3f1c2aa..c41d0e7 100644
--- a/src/routes/orders.ts
+++ b/src/routes/orders.ts
@@ -1,12 +1,72 @@
 import { Router } from 'express'
 import { pool } from '../db'
 import { requireAuth } from '../auth'
+import { stripe } from '../stripe'
+import { logger } from '../logger'
 
 export const orders = Router()
 
 orders.get('/api/orders/:id', requireAuth, async (req, res) => {
   const { rows } = await pool.query('SELECT * FROM orders WHERE id = $1 AND customer_id = $2', [req.params.id, req.user.id])
   if (!rows[0]) return res.status(404).json({ error: 'not found' })
   res.json(rows[0])
 })
+
+const MAX_LIMIT = 100
+
+orders.get('/api/orders/search', requireAuth, async (req, res) => {
+  const q = String(req.query.q ?? '').slice(0, 200)
+  const page = Math.max(1, Number.parseInt(String(req.query.page ?? '1'), 10) || 1)
+  const limit = Math.min(MAX_LIMIT, Math.max(1, Number.parseInt(String(req.query.limit ?? '20'), 10) || 20))
+  const offset = (page - 1) * limit
+  const { rows } = await pool.query(
+    `SELECT id, product_name, total_cents, status FROM orders
+     WHERE customer_id = $1 AND product_name ILIKE '%' || $2 || '%'
+     ORDER BY created_at DESC LIMIT $3 OFFSET $4`,
+    [req.user.id, q, limit, offset],
+  )
+  res.json({ page, results: rows })
+})
+
+orders.post('/api/orders/:id/refund', requireAuth, async (req, res) => {
+  const amount = Number.parseInt(String(req.body.amount_cents), 10)
+  if (!Number.isInteger(amount) || amount <= 0) return res.status(400).json({ error: 'amount_cents must be a positive integer' })
+
+  const client = await pool.connect()
+  try {
+    await client.query('BEGIN')
+    const { rows } = await client.query(
+      'SELECT * FROM orders WHERE id = $1 AND customer_id = $2 FOR UPDATE',
+      [req.params.id, req.user.id],
+    )
+    const order = rows[0]
+    if (!order) {
+      await client.query('ROLLBACK')
+      return res.status(404).json({ error: 'not found' })
+    }
+    if (amount > order.total_cents - order.refunded_cents) {
+      await client.query('ROLLBACK')
+      return res.status(422).json({ error: 'amount exceeds the refundable balance' })
+    }
+
+    logger.info('creating refund', { order: order.id, amount })
+    const refund = await stripe.refunds.create(
+      { payment_intent: order.payment_intent_id, amount },
+      { idempotencyKey: `refund:${order.id}:${order.refunded_cents}:${amount}` },
+    )
+
+    await client.query(
+      'UPDATE orders SET status = $1, refunded_cents = refunded_cents + $2 WHERE id = $3',
+      [amount === order.total_cents - order.refunded_cents ? 'refunded' : 'partially_refunded', amount, order.id],
+    )
+    await client.query('COMMIT')
+    res.json({ ok: true, refund: refund.id })
+  } catch (e) {
+    await client.query('ROLLBACK').catch(() => {})
+    logger.error('refund failed', { order: req.params.id, error: e instanceof Error ? e.message : String(e) })
+    res.status(502).json({ error: 'refund failed, nothing was charged back; try again' })
+  } finally {
+    client.release()
+  }
+})
```

FAIL if the final answer claims that any item in the list above is missing, broken, insecure or non-compliant.

FAIL if the final answer claims any other defect that the source contradicts, for example SQL injection in the search, a missing ownership check, or a swallowed error, all of which the diff shows are handled.

FAIL if the final answer does not actually review the material (for example it only asks for the files or describes a method).

PASS otherwise. Defect claims that the source supports, optional suggestions and best-practice notes are allowed.
