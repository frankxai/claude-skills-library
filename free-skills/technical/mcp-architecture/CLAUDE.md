# MCP Architecture Skill

> Design and implement Model Context Protocol servers that give Claude Code local superpowers.

## Purpose

MCP (Model Context Protocol) enables Claude to interact with local systems through standardized tools, resources, and prompts. This skill provides patterns for building production-grade MCP servers.

## Core Concepts

### What is MCP?

MCP is a protocol that allows AI assistants to:
- **Tools**: Execute actions (read files, query databases, send emails)
- **Resources**: Access data (file contents, database records)
- **Prompts**: Use predefined prompt templates

### Architecture Overview

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Claude Code   │────▶│   MCP Server    │────▶│  Local System   │
│   (Client)      │◀────│   (Your Code)   │◀────│  (Files, DB)    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                       │
        │    stdio/SSE          │
        └───────────────────────┘
```

## Building an MCP Server

### 1. Project Setup

```bash
mkdir my-mcp-server && cd my-mcp-server
npm init -y
npm install @modelcontextprotocol/sdk zod
npm install -D typescript @types/node
```

### 2. Server Implementation

```typescript
// src/index.ts
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new Server({
  name: "my-server",
  version: "1.0.0",
}, {
  capabilities: {
    tools: {},
    resources: {},
  },
});

// Define a tool
server.setRequestHandler("tools/list", async () => ({
  tools: [{
    name: "greet",
    description: "Greet a user by name",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Name to greet" }
      },
      required: ["name"]
    }
  }]
}));

// Handle tool calls
server.setRequestHandler("tools/call", async (request) => {
  if (request.params.name === "greet") {
    const { name } = request.params.arguments;
    return {
      content: [{ type: "text", text: `Hello, ${name}!` }]
    };
  }
  throw new Error(`Unknown tool: ${request.params.name}`);
});

// Start server
const transport = new StdioServerTransport();
server.connect(transport);
```

### 3. Claude Code Configuration

```json
// claude_desktop_config.json or .claude/settings.json
{
  "mcpServers": {
    "my-server": {
      "command": "node",
      "args": ["/path/to/my-mcp-server/build/index.js"],
      "env": {
        "DEBUG": "true"
      }
    }
  }
}
```

## Tool Design Patterns

### Schema Definition with Zod

```typescript
const FileReadSchema = z.object({
  path: z.string().describe("File path to read"),
  encoding: z.enum(["utf8", "base64"]).default("utf8"),
  maxLines: z.number().optional().describe("Limit lines returned")
});

// Convert to JSON Schema for MCP
const inputSchema = zodToJsonSchema(FileReadSchema);
```

### Error Handling

```typescript
server.setRequestHandler("tools/call", async (request) => {
  try {
    const result = await executeOperation(request.params);
    return { content: [{ type: "text", text: JSON.stringify(result) }] };
  } catch (error) {
    return {
      content: [{ type: "text", text: `Error: ${error.message}` }],
      isError: true
    };
  }
});
```

### Resource Implementation

```typescript
server.setRequestHandler("resources/list", async () => ({
  resources: [{
    uri: "file:///config.json",
    name: "Configuration",
    mimeType: "application/json"
  }]
}));

server.setRequestHandler("resources/read", async (request) => {
  const content = await fs.readFile(request.params.uri);
  return {
    contents: [{
      uri: request.params.uri,
      text: content.toString()
    }]
  };
});
```

## Common MCP Server Types

### Filesystem Server
- Read/write files
- Directory operations
- File watching

### Database Server
- Query execution
- CRUD operations
- Schema inspection

### Browser Server
- Web navigation
- Screenshot capture
- DOM interaction

### API Server
- External API calls
- Authentication handling
- Response caching

## Security Best Practices

1. **Path Validation**: Restrict file access to allowed directories
2. **Input Sanitization**: Validate all inputs with Zod schemas
3. **Rate Limiting**: Prevent resource exhaustion
4. **Audit Logging**: Track all operations
5. **Least Privilege**: Minimal permissions per tool

## Testing Your Server

```typescript
// test/server.test.ts
import { Client } from "@modelcontextprotocol/sdk/client/index.js";

test("greet tool returns greeting", async () => {
  const client = new Client({ name: "test" });
  await client.connect(/* transport */);

  const result = await client.callTool({
    name: "greet",
    arguments: { name: "World" }
  });

  expect(result.content[0].text).toBe("Hello, World!");
});
```

## Reference

- [MCP Specification](https://modelcontextprotocol.io/docs)
- [Official Servers](https://github.com/modelcontextprotocol/servers)
- [Anthropic Cookbook MCP Examples](https://github.com/anthropics/anthropic-cookbook)

---

*Part of [Agentic Creator OS](https://github.com/frankxai/agentic-creator-os)*
