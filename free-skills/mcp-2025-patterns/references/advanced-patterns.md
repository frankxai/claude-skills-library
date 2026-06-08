# Security, multi-server orchestration, performance, error handling & testing patterns

> Reference for the `mcp-2025-patterns` skill. See [`../SKILL.md`](../SKILL.md).

## Security Patterns

### Pattern 1: Credential Isolation
```typescript
// Store credentials in environment, not code
const server = new MCPServer({
  name: "secure-server"
});

// Validate env vars at startup
const requiredEnv = ["API_KEY", "API_SECRET"];
for (const key of requiredEnv) {
  if (!process.env[key]) {
    throw new Error(`Missing required env var: ${key}`);
  }
}

// Never log or expose credentials
server.addTool("secure_action", async (params) => {
  // Use env vars directly, never pass as params
  const client = new APIClient({
    key: process.env.API_KEY // Not from params
  });
});
```

### Pattern 2: Input Validation
```typescript
import { z } from "zod";

const CreateIssueSchema = z.object({
  owner: z.string().regex(/^[a-zA-Z0-9-]+$/),
  repo: z.string().regex(/^[a-zA-Z0-9._-]+$/),
  title: z.string().min(1).max(256),
  body: z.string().max(65536).optional()
});

server.addTool("create_issue", async (params) => {
  // Validate before processing
  const validated = CreateIssueSchema.parse(params);

  // Safe to use validated data
  return await github.issues.create(validated);
});
```

### Pattern 3: Rate Limiting
```typescript
import { RateLimiter } from "rate-limiter";

const limiter = new RateLimiter({
  tokensPerInterval: 100,
  interval: "minute"
});

server.addTool("api_call", async (params) => {
  // Check rate limit before proceeding
  if (!await limiter.tryRemoveTokens(1)) {
    return {
      success: false,
      error: "Rate limit exceeded. Try again in a minute.",
      retry_after: 60
    };
  }

  return await performAPICall(params);
});
```

### Pattern 4: Audit Logging
```typescript
server.addTool("sensitive_action", async (params, context) => {
  // Log all sensitive operations
  await auditLog({
    action: "sensitive_action",
    params: sanitize(params), // Remove secrets
    user: context.user,
    timestamp: new Date().toISOString(),
    result: "pending"
  });

  try {
    const result = await performAction(params);
    await auditLog.update({ result: "success" });
    return result;
  } catch (error) {
    await auditLog.update({ result: "error", error: error.message });
    throw error;
  }
});
```

---

## Multi-Server Orchestration

### Pattern 1: Server Composition
```typescript
// In Claude Code settings, compose servers:
{
  "mcpServers": {
    "github": {
      "command": "mcp-github",
      "env": { "GITHUB_TOKEN": "..." }
    },
    "linear": {
      "command": "mcp-linear",
      "env": { "LINEAR_API_KEY": "..." }
    },
    "notion": {
      "command": "mcp-notion",
      "env": { "NOTION_TOKEN": "..." }
    }
  }
}
```

### Pattern 2: Cross-Server Workflows
```markdown
When handling complex tasks, coordinate across servers:

1. Get issue from GitHub (github-mcp)
2. Create linked Linear ticket (linear-mcp)
3. Update project doc in Notion (notion-mcp)
4. Comment back on GitHub with links (github-mcp)

Claude orchestrates automatically based on task.
```

### Pattern 3: Server Health Monitoring
```typescript
// Each server should expose health endpoint
server.addTool("health_check", async () => {
  const checks = await Promise.all([
    checkAPIConnection(),
    checkDatabaseConnection(),
    checkCacheConnection()
  ]);

  return {
    status: checks.every(c => c.ok) ? "healthy" : "degraded",
    checks: checks,
    timestamp: new Date().toISOString()
  };
});
```

---

## Performance Patterns

### Pattern 1: Connection Pooling
```typescript
// Reuse connections across requests
const pool = new ConnectionPool({
  max: 10,
  idleTimeout: 30000
});

server.addTool("db_query", async (params) => {
  const conn = await pool.acquire();
  try {
    return await conn.query(params.sql);
  } finally {
    pool.release(conn);
  }
});
```

### Pattern 2: Caching
```typescript
import { LRUCache } from "lru-cache";

const cache = new LRUCache({
  max: 1000,
  ttl: 1000 * 60 * 5 // 5 minutes
});

server.addTool("get_user", async (params) => {
  const cacheKey = `user:${params.id}`;

  // Check cache first
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  // Fetch and cache
  const user = await fetchUser(params.id);
  cache.set(cacheKey, user);
  return user;
});
```

### Pattern 3: Batch Operations
```typescript
// Support batch operations to reduce round trips
server.addTool("batch_create_issues", async (params) => {
  const { issues } = params;

  // Process in parallel with concurrency limit
  const results = await pMap(
    issues,
    issue => createIssue(issue),
    { concurrency: 5 }
  );

  return {
    created: results.filter(r => r.success).length,
    failed: results.filter(r => !r.success).length,
    results
  };
});
```

---

## Error Handling

### Structured Error Responses
```typescript
class MCPError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.code = code;
    this.details = details;
  }

  toResponse() {
    return {
      success: false,
      error: {
        code: this.code,
        message: this.message,
        details: this.details,
        recoverable: this.isRecoverable(),
        suggested_action: this.getSuggestedAction()
      }
    };
  }
}

// Usage
throw new MCPError(
  "RATE_LIMITED",
  "GitHub API rate limit exceeded",
  {
    limit: 5000,
    remaining: 0,
    reset_at: "2025-12-19T12:00:00Z"
  }
);
```

### Graceful Degradation
```typescript
server.addTool("enriched_search", async (params) => {
  const results = await primarySearch(params);

  // Try to enrich, but don't fail if enrichment fails
  try {
    return await enrichResults(results);
  } catch (enrichError) {
    console.warn("Enrichment failed, returning basic results", enrichError);
    return {
      ...results,
      enrichment_status: "failed",
      enrichment_error: enrichError.message
    };
  }
});
```

---

## Testing Patterns

### Unit Testing Tools
```typescript
import { describe, it, expect, vi } from "vitest";

describe("create_issue tool", () => {
  it("creates issue with valid params", async () => {
    const mockGithub = vi.fn().mockResolvedValue({
      number: 123,
      html_url: "https://github.com/..."
    });

    const result = await createIssueTool({
      owner: "test",
      repo: "test-repo",
      title: "Test issue"
    }, { github: mockGithub });

    expect(result.success).toBe(true);
    expect(result.issue.number).toBe(123);
  });

  it("validates required params", async () => {
    await expect(createIssueTool({ owner: "test" }))
      .rejects.toThrow("Missing required: repo, title");
  });
});
```

### Integration Testing
```typescript
describe("MCP Server Integration", () => {
  let server;
  let client;

  beforeAll(async () => {
    server = await startMCPServer();
    client = await connectMCPClient(server.url);
  });

  it("lists available tools", async () => {
    const tools = await client.listTools();
    expect(tools).toContain("create_issue");
    expect(tools).toContain("list_repositories");
  });

  it("executes tool and returns result", async () => {
    const result = await client.callTool("health_check", {});
    expect(result.status).toBe("healthy");
  });
});
```

---
