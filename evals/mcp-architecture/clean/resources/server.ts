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
  // Write only the fields the caller set: an omitted field must not become NULL or reach postgres.js as undefined.
  const changes = Object.fromEntries(Object.entries({ status, assignee, priority }).filter(([, v]) => v !== undefined))
  if (Object.keys(changes).length === 0) throw new Error('nothing to update: pass status, assignee or priority')
  const rows = await sql`UPDATE tickets SET ${sql(changes)} WHERE id = ${id} RETURNING id`
  if (rows.length === 0) throw new Error('ticket not found')
  return { content: [{ type: 'text', text: `updated ${Object.keys(changes).join(', ')}` }] }
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
