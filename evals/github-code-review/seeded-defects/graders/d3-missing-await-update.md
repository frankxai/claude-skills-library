---
type: llm
---
Judge only the final answer. A finding counts only if it points at the file, element or construct named below AND states that it is a problem. A sentence that mentions the topic in passing, praises it, says it is fine, or gives general advice without tying it to this construct does not count. Extra correct findings about other things never cause a FAIL.

PASS if the final answer identifies the `UPDATE orders ... refunded_cents` query called without `await`, so the response is sent before the database records the refund and a failure there is unhandled as a defect, and proposes a fix in the spirit of awaiting the update (ideally in a transaction with the refund).

FAIL if it does not identify this specific defect, or identifies it without any fix.
