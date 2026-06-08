---
name: mcp-2025-patterns
description: Current best practices for Model Context Protocol server design, implementation, and integration, including multi-server orchestration, security, and performance. Use when designing an MCP server, choosing transport/auth, or reviewing an MCP integration for 2025+ patterns.
version: 1.0.0
last_updated: 2025-12-19
external_version: "MCP Specification 2025"
changelog: |
  - 1.0.0: Initial skill with 2025 MCP patterns and best practices
---

# MCP 2025 Patterns

This skill covers current best practices for Model Context Protocol (MCP) server design, implementation, and integration as of late 2025.

---

## MCP Architecture Fundamentals

### Core Concepts
```
┌─────────────────────────────────────────────────────────────┐
│                    Claude Code (Host)                        │
├─────────────────────────────────────────────────────────────┤
│  MCP Client Layer                                           │
│  ├── Server Discovery & Connection                          │
│  ├── Tool Registration & Invocation                         │
│  ├── Resource Management                                    │
│  └── Prompt Templates                                       │
├─────────────────────────────────────────────────────────────┤
│  MCP Servers (Multiple)                                     │
│  ├── github-mcp (repositories, issues, PRs)                 │
│  ├── notion-mcp (pages, databases, blocks)                  │
│  ├── linear-mcp (issues, projects, cycles)                  │
│  ├── custom-mcp (your domain-specific tools)                │
│  └── ...                                                    │
└─────────────────────────────────────────────────────────────┘
```

### MCP Server Components

1. **Tools**: Functions the AI can invoke
2. **Resources**: Data the AI can read
3. **Prompts**: Template prompts for common tasks
4. **Notifications**: Server-to-client events

---

## Server Design Patterns

### Pattern 1: Single Responsibility Server
```typescript
// Good: Focused server for one domain
const server = new MCPServer({
  name: "github-mcp",
  version: "1.0.0"
});

// Tools all relate to GitHub
server.addTool("create_issue", createIssueHandler);
server.addTool("list_pulls", listPullsHandler);
server.addTool("merge_pr", mergePRHandler);
```

### Pattern 2: Resource-First Design
```typescript
// Define resources before tools
server.addResource({
  uri: "github://repos/{owner}/{repo}",
  name: "Repository",
  description: "GitHub repository data and metadata",
  mimeType: "application/json"
});

// Tools operate on resources
server.addTool({
  name: "get_repo",
  description: "Fetch repository details",
  inputSchema: {
    type: "object",
    properties: {
      owner: { type: "string" },
      repo: { type: "string" }
    },
    required: ["owner", "repo"]
  }
});
```

### Pattern 3: Hierarchical Tool Organization
```typescript
// Organize tools by domain/action
const tools = {
  // Issues domain
  "issues_create": createIssue,
  "issues_update": updateIssue,
  "issues_list": listIssues,
  "issues_close": closeIssue,

  // PRs domain
  "pulls_create": createPR,
  "pulls_merge": mergePR,
  "pulls_review": reviewPR,

  // Repos domain
  "repos_list": listRepos,
  "repos_create": createRepo
};
```

---

## Tool Design Best Practices

### Clear, Action-Oriented Names
```typescript
// Good: Clear action + noun
"create_issue"
"list_repositories"
"merge_pull_request"
"search_code"

// Bad: Vague or ambiguous
"do_github"
"handle_request"
"process_data"
```

### Comprehensive Input Schemas
```typescript
server.addTool({
  name: "create_issue",
  description: "Create a new GitHub issue with title, body, labels, and assignees",
  inputSchema: {
    type: "object",
    properties: {
      owner: {
        type: "string",
        description: "Repository owner (user or org)"
      },
      repo: {
        type: "string",
        description: "Repository name"
      },
      title: {
        type: "string",
        description: "Issue title",
        minLength: 1,
        maxLength: 256
      },
      body: {
        type: "string",
        description: "Issue body (Markdown supported)"
      },
      labels: {
        type: "array",
        items: { type: "string" },
        description: "Labels to apply"
      },
      assignees: {
        type: "array",
        items: { type: "string" },
        description: "GitHub usernames to assign"
      }
    },
    required: ["owner", "repo", "title"]
  }
});
```

### Structured Output Formats
```typescript
// Return structured, predictable data
async function createIssue(params) {
  const issue = await github.issues.create({...});

  return {
    success: true,
    issue: {
      number: issue.number,
      url: issue.html_url,
      title: issue.title,
      state: issue.state,
      created_at: issue.created_at
    },
    // Include actionable next steps
    suggested_actions: [
      `Add labels: /api/issues/${issue.number}/labels`,
      `Assign team: /api/issues/${issue.number}/assignees`
    ]
  };
}
```

---


## Reference


The full detail lives in `references/` and loads only when needed:

- [`references/advanced-patterns.md`](references/advanced-patterns.md) — security, multi-server orchestration, performance, error handling & testing patterns.

---

## FrankX System Integration

### Current MCP Servers in Use
- **github-mcp**: Repository management, issues, PRs
- **linear-mcp**: Project management, issues, cycles
- **notion-mcp**: Documentation, databases, pages
- **nano-banana-mcp**: Image generation
- **n8n-mcp**: Workflow automation
- **playwright-mcp**: Browser automation

### Best Practices for FrankX
1. **Server per domain**: Keep MCPs focused (GitHub for code, Linear for tasks)
2. **Consistent naming**: `mcp__<server>__<action>` format
3. **Graceful fallbacks**: If MCP unavailable, suggest alternative
4. **Context awareness**: Use right MCP for right task automatically

---

*MCP servers extend Claude's capabilities with real-world integrations. Design them with clear responsibility, robust error handling, and security in mind.*
