---
type: llm
---
Judge only the final answer. A finding counts only if it points at the file, element or construct named below AND states that it is a problem. A sentence that mentions the topic in passing, praises it, says it is fine, or gives general advice without tying it to this construct does not count. Extra correct findings about other things never cause a FAIL.

PASS if the final answer identifies long work running inside 60-second Vercel functions: the agent loop in the inbound request handler and the nightly re-index of everything in a single cron invocation as a defect, and proposes a fix in the spirit of moving the agent run and the re-index to a durable job/workflow with batching, checkpoints and retries.

FAIL if it does not identify this specific defect, or identifies it without any fix.
