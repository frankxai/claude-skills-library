---
type: llm
---
Judge only the final answer. A finding counts only if it points at the file, element or construct named below AND states that it is a problem. A sentence that mentions the topic in passing, praises it, says it is fine, or gives general advice without tying it to this construct does not count. Extra correct findings about other things never cause a FAIL.

PASS if the final answer identifies the write tools (`update_ticket`, `delete_ticket`) and other tools performing actions with no per-user authorization or scope check as a defect, and proposes a fix in the spirit of checking the caller's scopes or role per tool (e.g. read vs write vs admin) before acting.

FAIL if it does not identify this specific defect, or identifies it without any fix.
