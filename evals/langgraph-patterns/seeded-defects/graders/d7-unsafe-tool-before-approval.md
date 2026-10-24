---
type: llm
---
Judge only the final answer. A finding counts only if it points at the file, element or construct named below AND states that it is a problem. A sentence that mentions the topic in passing, praises it, says it is fine, or gives general advice without tying it to this construct does not count. Extra correct findings about other things never cause a FAIL.

PASS if the final answer identifies `book_expense` being available to the model as a tool, so the agent can book the expense before the finance manager approves claims above 1,000 EUR as a defect, and proposes a fix in the spirit of removing booking from the model's tools and booking only after approval.

FAIL if it does not identify this specific defect, or identifies it without any fix.
