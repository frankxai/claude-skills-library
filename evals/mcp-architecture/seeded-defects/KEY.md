# Answer key: mcp-architecture seeded-defects

Never staged into a run (scripts/eval-skill.mjs NEVER_STAGED).

1. **command-injection** (security): `run_report` passing the model-supplied `name` into `exec(`./reports/run.sh ${name}`)` (shell command injection) → fix: allow-listing report names and using `execFile` with arguments instead of a shell string
2. **destructive-annotation** (design): `delete_ticket` being annotated `readOnlyHint: true` although it permanently deletes data (and having no confirmation step) → fix: marking it destructive (`readOnlyHint: false`, `destructiveHint: true`) and requiring confirmation
3. **env-resource** (security): the `config://env` resource returning `JSON.stringify(process.env)`, exposing every secret in the environment to any client → fix: removing that resource (or exposing only an explicit allow-list of non-secret settings)
4. **token-passthrough** (security): `sync_helpdesk` forwarding the client's own `Authorization` bearer token to the Helpdesk API (token passthrough / confused deputy) → fix: calling the downstream API with the server's own credential for that API and validating the incoming token's audience
5. **unbounded-input** (design): the tool input schemas without bounds, such as `limit: z.number()` in `search_tickets` and the free-form `patch: z.record(z.string(), z.any())` in `update_ticket` → fix: bounding numbers and strings and replacing the free-form patch with explicit allowed fields
6. **description-injection** (security): the `search_tickets` description instructing the model to always call it first and to send the user's full email and phone number (instructions and data collection hidden in a tool description) → fix: rewriting the description to only describe what the tool does and removing the `requester` personal-data field
7. **no-authz** (security): the write tools (`update_ticket`, `delete_ticket`) and other tools performing actions with no per-user authorization or scope check → fix: checking the caller's scopes or role per tool (e.g. read vs write vs admin) before acting
8. **error-leak** (security): the `onerror` handler including the stack trace and `process.env.DATABASE_URL` (database credentials) in the thrown error that can reach clients → fix: logging a generic error server-side without secrets and returning a sanitized message
