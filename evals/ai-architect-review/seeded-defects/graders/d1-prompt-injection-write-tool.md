---
type: llm
---
Judge only the final answer. A finding counts only if it points at the file, element or construct named below AND states that it is a problem. A sentence that mentions the topic in passing, praises it, says it is fine, or gives general advice without tying it to this construct does not count. Extra correct findings about other things never cause a FAIL.

PASS if the final answer identifies untrusted retrieved content (customer emails and history, help-center text) being concatenated into the system prompt while the agent holds a `issue_refund` tool that executes immediately, so a crafted email can trigger refunds or plan changes (prompt injection reaching a write tool) as a defect, and proposes a fix in the spirit of treating retrieved text as untrusted data outside the system prompt and putting money-moving actions behind human approval or strict server-side limits.

FAIL if it does not identify this specific defect, or identifies it without any fix.
