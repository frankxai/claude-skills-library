---
type: llm
---
Judge only the final answer. A finding counts only if it points at the element or rule named below AND states that it is a problem. A sentence that mentions the topic in passing, praises it, says it is fine, or gives general advice without tying it to this element does not count. Extra correct findings about other things never cause a FAIL.

PASS if the final answer identifies the card number input whose error state is shown only by a red border, with no error text and no `aria-invalid` as a defect, and proposes a fix in the spirit of adding a visible text error message tied to the field and `aria-invalid="true"`.

FAIL if it does not identify this specific defect, or identifies it without any fix.
