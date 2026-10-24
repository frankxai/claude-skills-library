---
type: llm
---
Judge only the final answer. A finding counts only if it points at the file, element or construct named below AND states that it is a problem. A sentence that mentions the topic in passing, praises it, says it is fine, or gives general advice without tying it to this construct does not count. Extra correct findings about other things never cause a FAIL.

PASS if the final answer identifies the hard-coded `VERCEL_TOKEN=vcp_...` value (a token written into the skill text) in the body as a defect, and proposes a fix in the spirit of removing it, reading the token from the environment or a secret store, and rotating the exposed token.

FAIL if it does not identify this specific defect, or identifies it without any fix.
