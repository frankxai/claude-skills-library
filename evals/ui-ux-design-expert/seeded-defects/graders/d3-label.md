---
type: llm
---
Judge only the final answer. A finding counts only if it points at the element or rule named below AND states that it is a problem. A sentence that mentions the topic in passing, praises it, says it is fine, or gives general advice without tying it to this element does not count. Extra correct findings about other things never cause a FAIL.

PASS if the final answer identifies the email input that has only a placeholder and no visible or programmatic label as a defect, and proposes a fix in the spirit of adding a `<label for>` (or equivalent accessible name that stays visible).

FAIL if it does not identify this specific defect, or identifies it without any fix.
