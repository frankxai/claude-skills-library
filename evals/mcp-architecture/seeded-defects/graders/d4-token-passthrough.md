---
type: llm
---
Judge only the final answer. A finding counts only if it points at the file, element or construct named below AND states that it is a problem. A sentence that mentions the topic in passing, praises it, says it is fine, or gives general advice without tying it to this construct does not count. Extra correct findings about other things never cause a FAIL.

PASS if the final answer identifies `sync_helpdesk` forwarding the client's own `Authorization` bearer token to the Helpdesk API (token passthrough / confused deputy) as a defect, and proposes a fix in the spirit of calling the downstream API with the server's own credential for that API and validating the incoming token's audience.

FAIL if it does not identify this specific defect, or identifies it without any fix.
