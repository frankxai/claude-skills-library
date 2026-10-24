# Answer key: github-code-review seeded-defects

Never staged into a run (scripts/eval-skill.mjs NEVER_STAGED).

1. **sql-injection** (security): the search query building SQL by interpolating `q` (from `req.query.q`) into the `ILIKE '%${q}%'` string (SQL injection) → fix: passing `q` as a bound parameter (`$n` placeholders)
2. **refund-no-ownership** (security): the refund route loading the order with `SELECT * FROM orders WHERE id = $1` without checking that it belongs to `req.user`, so any signed-in user can refund anyone's order → fix: adding `customer_id = req.user.id` (or an equivalent ownership/role check) to the lookup
3. **missing-await-update** (correctness): the `UPDATE orders ... refunded_cents` query called without `await`, so the response is sent before the database records the refund and a failure there is unhandled → fix: awaiting the update (ideally in a transaction with the refund)
4. **pagination-offset** (correctness): `const offset = page * limit` with pages starting at 1, which skips the first page of results → fix: using `(page - 1) * limit`
5. **secret-logged** (security): the `logger.info('creating refund', ...)` call writing `process.env.STRIPE_SECRET_KEY` into the logs → fix: removing the key from the log line (and rotating it)
6. **error-swallowed** (correctness): the `catch (e) { res.json({ ok: true }) }` block that hides failures and tells the client the refund succeeded → fix: logging the error and returning an error status (e.g. 5xx) instead of `ok: true`
7. **unbounded-limit** (security): `limit` taken from `req.query.limit` with no maximum (and no validation), letting a caller request huge result sets → fix: validating `limit` and capping it (for example at 100)
8. **refund-amount-unvalidated** (correctness): `amount` from `req.body.amount_cents` passed to Stripe without validating that it is a positive integer and not more than the order's remaining refundable amount → fix: validating the amount against `total_cents - refunded_cents` (and that it is a positive integer) before refunding
