---
type: llm
---
Judge only the final answer. A finding counts only if it points at the file, element or construct named below AND states that it is a problem. A sentence that mentions the topic in passing, praises it, says it is fine, or gives general advice without tying it to this construct does not count. Extra correct findings about other things never cause a FAIL.

PASS if the final answer identifies `route` returning `"tools"` while the tool node is registered as `"tool"`, so the conditional edge points at a node that does not exist as a defect, and proposes a fix in the spirit of using the same node name (or giving `add_conditional_edges` an explicit path map).

FAIL if it does not identify this specific defect, or identifies it without any fix.
