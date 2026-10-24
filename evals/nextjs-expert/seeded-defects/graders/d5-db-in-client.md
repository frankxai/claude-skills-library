---
type: llm
---
Judge only the final answer. A finding counts only if it points at the file, element or construct named below AND states that it is a problem. A sentence that mentions the topic in passing, praises it, says it is fine, or gives general advice without tying it to this construct does not count. Extra correct findings about other things never cause a FAIL.

PASS if the final answer identifies the client component `components/DeleteButton.tsx` (`'use client'`) importing and querying `db` from `@/lib/db` (the Prisma client with the database credentials), which cannot run in the browser and pulls server code toward the client bundle as a defect, and proposes a fix in the spirit of keeping database access on the server (Server Action or server component) and marking `lib/db.ts` with `server-only`.

FAIL if it does not identify this specific defect, or identifies it without any fix.
