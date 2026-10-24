---
type: llm
---
Judge only the final answer. A finding counts only if it points at the file, element or construct named below AND states that it is a problem. A sentence that mentions the topic in passing, praises it, says it is fine, or gives general advice without tying it to this construct does not count. Extra correct findings about other things never cause a FAIL.

PASS if the final answer identifies the tool input schemas without bounds, such as `limit: z.number()` in `search_tickets` and the free-form `patch: z.record(z.string(), z.any())` in `update_ticket` as a defect, and proposes a fix in the spirit of bounding numbers and strings and replacing the free-form patch with explicit allowed fields.

FAIL if it does not identify this specific defect, or identifies it without any fix.
