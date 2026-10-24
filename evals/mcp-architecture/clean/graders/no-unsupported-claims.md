---
type: llm
weight: 2
---
Judge only the final answer. The material under review was checked and the following are all implemented correctly in it:
- `run_report` uses an allow-listed enum and `execFile` with an argument array and a timeout (no shell string)
- `delete_ticket` is annotated destructive, requires `confirm: true` and the `tickets:admin` scope
- there is no resource exposing environment variables
- `sync_helpdesk` calls the Helpdesk API with the server's own token from `helpdeskToken()`, not the client's token
- every tool input is bounded (string lengths, integer ranges, enums, uuid ids) and `update_ticket` accepts only explicit fields
- tool descriptions only describe behaviour and ask for no personal data
- every tool checks a scope with `requireScope` before acting
- search returns only a fixed set of non-sensitive fields
- errors are logged server-side with name and message only

The complete source follows. Treat it as ground truth.

`README.md`:

```markdown
# tickets-mcp

An MCP server that lets the support team's agents read and act on the ticket database (Postgres) and
run saved reports. Deployed as a remote server over Streamable HTTP behind our gateway; clients
authenticate with OAuth and send `Authorization: Bearer <token>`. The downstream Helpdesk API accepts
the same bearer format. Source: `server.ts`.
```

`server.ts`:

```ts
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { sql } from './db'
import { helpdeskToken } from './credentials'
import { requireScope } from './authz'

const run = promisify(execFile)
const server = new McpServer({ name: 'tickets', version: '1.5.0' })
const REPORTS = new Set(['weekly-sla', 'backlog-age', 'csat-trend'])
const PUBLIC_FIELDS = sql`id, subject, status, priority, assignee, created_at`

server.registerTool('search_tickets', {
  description: 'Search support tickets by text. Returns at most 50 tickets with subject, status, priority and assignee.',
  inputSchema: { query: z.string().min(1).max(200), limit: z.number().int().min(1).max(50).default(20) },
  annotations: { readOnlyHint: true },
}, async ({ query, limit }, extra) => {
  requireScope(extra, 'tickets:read')
  const rows = await sql`SELECT ${PUBLIC_FIELDS} FROM tickets WHERE body ILIKE ${'%' + query + '%'} LIMIT ${limit}`
  return { content: [{ type: 'text', text: JSON.stringify(rows) }] }
})

server.registerTool('update_ticket', {
  description: 'Change a ticket\'s status, assignee or priority.',
  inputSchema: {
    id: z.string().uuid(),
    status: z.enum(['open', 'pending', 'solved']).optional(),
    assignee: z.string().max(80).optional(),
    priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true },
}, async ({ id, status, assignee, priority }, extra) => {
  requireScope(extra, 'tickets:write')
  await sql`UPDATE tickets SET ${sql({ status, assignee, priority }, 'status', 'assignee', 'priority')} WHERE id = ${id}`
  return { content: [{ type: 'text', text: 'updated' }] }
})

server.registerTool('delete_ticket', {
  description: 'Permanently delete a ticket and its history. Destructive; requires confirm: true.',
  inputSchema: { id: z.string().uuid(), confirm: z.literal(true) },
  annotations: { readOnlyHint: false, destructiveHint: true },
}, async ({ id }, extra) => {
  requireScope(extra, 'tickets:admin')
  await sql`DELETE FROM tickets WHERE id = ${id}`
  return { content: [{ type: 'text', text: 'deleted' }] }
})

server.registerTool('run_report', {
  description: 'Run a saved report: weekly-sla, backlog-age or csat-trend.',
  inputSchema: { name: z.enum(['weekly-sla', 'backlog-age', 'csat-trend']) },
  annotations: { readOnlyHint: true },
}, async ({ name }, extra) => {
  requireScope(extra, 'reports:run')
  if (!REPORTS.has(name)) throw new Error('unknown report')
  const { stdout } = await run('./reports/run.sh', [name], { timeout: 30_000 })
  return { content: [{ type: 'text', text: stdout }] }
})

server.registerTool('sync_helpdesk', {
  description: 'Push a ticket to the Helpdesk API.',
  inputSchema: { id: z.string().uuid() },
  annotations: { readOnlyHint: false, openWorldHint: true },
}, async ({ id }, extra) => {
  requireScope(extra, 'tickets:write')
  const res = await fetch(`https://helpdesk.example.com/api/tickets/${id}/sync`, {
    method: 'POST',
    headers: { authorization: `Bearer ${await helpdeskToken()}` },
  })
  return { content: [{ type: 'text', text: String(res.status) }] }
})

server.onerror = (err) => {
  console.error('tickets-mcp error', { name: err.name, message: err.message })
}

export default server
```

FAIL if the final answer claims that any item in the list above is missing, broken, insecure or non-compliant.

FAIL if the final answer claims any other defect that the source contradicts, for example command injection in `run_report`, token passthrough in `sync_helpdesk`, or a missing destructive annotation on `delete_ticket`, all of which the source shows are handled.

FAIL if the final answer does not actually review the material (for example it only asks for the files or describes a method).

PASS otherwise. Defect claims that the source supports, optional suggestions and best-practice notes are allowed.
