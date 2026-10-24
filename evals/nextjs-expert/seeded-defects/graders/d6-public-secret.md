---
type: llm
---
Judge only the final answer. A finding counts only if it points at the file, element or construct named below AND states that it is a problem. A sentence that mentions the topic in passing, praises it, says it is fine, or gives general advice without tying it to this construct does not count. Extra correct findings about other things never cause a FAIL.

PASS if the final answer identifies `process.env.NEXT_PUBLIC_STRIPE_SECRET_KEY` in `components/DeleteButton.tsx`: the `NEXT_PUBLIC_` prefix inlines the Stripe secret key into the browser bundle as a defect, and proposes a fix in the spirit of renaming it without the `NEXT_PUBLIC_` prefix, using it only on the server, and rotating the exposed key.

FAIL if it does not identify this specific defect, or identifies it without any fix.
