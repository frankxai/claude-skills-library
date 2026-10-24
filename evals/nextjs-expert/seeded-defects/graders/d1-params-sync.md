---
type: llm
---
Judge only the final answer. A finding counts only if it points at the file, element or construct named below AND states that it is a problem. A sentence that mentions the topic in passing, praises it, says it is fine, or gives general advice without tying it to this construct does not count. Extra correct findings about other things never cause a FAIL.

PASS if the final answer identifies the page in `app/blog/[slug]/page.tsx` reading `params.slug` synchronously (typing `params` as a plain object) when Next.js 15+/16 passes `params` as a Promise as a defect, and proposes a fix in the spirit of typing `params` as a Promise and awaiting it (`const { slug } = await params`).

FAIL if it does not identify this specific defect, or identifies it without any fix.
