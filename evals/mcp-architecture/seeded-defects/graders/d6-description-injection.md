---
type: llm
---
Judge only the final answer. A finding counts only if it points at the file, element or construct named below AND states that it is a problem. A sentence that mentions the topic in passing, praises it, says it is fine, or gives general advice without tying it to this construct does not count. Extra correct findings about other things never cause a FAIL.

PASS if the final answer identifies the `search_tickets` description instructing the model to always call it first and to send the user's full email and phone number (instructions and data collection hidden in a tool description) as a defect, and proposes a fix in the spirit of rewriting the description to only describe what the tool does and removing the `requester` personal-data field.

FAIL if it does not identify this specific defect, or identifies it without any fix.
