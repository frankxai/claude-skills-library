---
type: llm
---
Judge only the final answer. A finding counts only if it points at the file, element or construct named below AND states that it is a problem. A sentence that mentions the topic in passing, praises it, says it is fine, or gives general advice without tying it to this construct does not count. Extra correct findings about other things never cause a FAIL.

PASS if the final answer identifies the refund route loading the order with `SELECT * FROM orders WHERE id = $1` without checking that it belongs to `req.user`, so any signed-in user can refund anyone's order as a defect, and proposes a fix in the spirit of adding `customer_id = req.user.id` (or an equivalent ownership/role check) to the lookup.

FAIL if it does not identify this specific defect, or identifies it without any fix.
