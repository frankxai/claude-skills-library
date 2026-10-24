---
type: llm
---
Judge only the final answer. A finding counts only if it points at the file, element or construct named below AND states that it is a problem. A sentence that mentions the topic in passing, praises it, says it is fine, or gives general advice without tying it to this construct does not count. Extra correct findings about other things never cause a FAIL.

PASS if the final answer identifies `limit` taken from `req.query.limit` with no maximum (and no validation), letting a caller request huge result sets as a defect, and proposes a fix in the spirit of validating `limit` and capping it (for example at 100).

FAIL if it does not identify this specific defect, or identifies it without any fix.
