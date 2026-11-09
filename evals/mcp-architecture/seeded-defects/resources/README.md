# tickets-mcp

An MCP server that lets the support team's agents read and act on the ticket database (Postgres) and
run saved reports. Deployed as a remote server over Streamable HTTP behind our gateway; clients
authenticate with OAuth and send `Authorization: Bearer <token>`. The downstream Helpdesk API accepts
the same bearer format. Source: `server.ts`.
