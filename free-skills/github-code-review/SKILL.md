---
name: github-code-review
version: 1.0.0
description: Comprehensive GitHub pull-request code review with multi-agent coordination. Use when reviewing a PR or diff, auditing changes for correctness/security/style before merge, or generating actionable inline review comments.
category: github
tags: [code-review, github, swarm, pr-management, automation]
author: Claude Code Flow
requires:
  - github-cli
  - ruv-swarm
  - claude-flow
capabilities:
  - Multi-agent code review
  - Automated PR management
  - Security and performance analysis
  - Swarm-based review orchestration
  - Intelligent comment generation
  - Quality gate enforcement
---

# GitHub Code Review Skill

> **AI-Powered Code Review**: Deploy specialized review agents to perform comprehensive, intelligent code reviews that go beyond traditional static analysis.

## 🎯 Quick Start

### Simple Review
```bash
# Initialize review swarm for PR
gh pr view 123 --json files,diff | npx ruv-swarm github review-init --pr 123

# Post review status
gh pr comment 123 --body "🔍 Multi-agent code review initiated"
```

### Complete Review Workflow
```bash
# Get PR context with gh CLI
PR_DATA=$(gh pr view 123 --json files,additions,deletions,title,body)
PR_DIFF=$(gh pr diff 123)

# Initialize comprehensive review
npx ruv-swarm github review-init \
  --pr 123 \
  --pr-data "$PR_DATA" \
  --diff "$PR_DIFF" \
  --agents "security,performance,style,architecture,accessibility" \
  --depth comprehensive
```

---


## Reference


The full detail lives in `references/` and loads only when needed:

- [`references/reference.md`](references/reference.md) — core features, specialized agents, pr-swarm management, configuration, workflows, ci/cd & monitoring.

---

## 📚 Best Practices

### 1. Review Configuration
- ✅ Define clear review criteria upfront
- ✅ Set appropriate severity thresholds
- ✅ Configure agent specializations for your stack
- ✅ Establish override procedures for emergencies

### 2. Comment Quality
- ✅ Provide actionable, specific feedback
- ✅ Include code examples with suggestions
- ✅ Reference documentation and best practices
- ✅ Maintain respectful, constructive tone

### 3. Performance Optimization
- ✅ Cache analysis results to avoid redundant work
- ✅ Use incremental reviews for large PRs
- ✅ Enable parallel agent execution
- ✅ Batch comment operations efficiently

### 4. PR Templates

```markdown
<!-- .github/pull_request_template.md -->
## Swarm Configuration
- Topology: [mesh/hierarchical/ring/star]
- Max Agents: [number]
- Auto-spawn: [yes/no]
- Priority: [high/medium/low]

## Tasks for Swarm
- [ ] Task 1 description
- [ ] Task 2 description
- [ ] Task 3 description

## Review Focus Areas
- [ ] Security review
- [ ] Performance analysis
- [ ] Architecture validation
- [ ] Accessibility check
```

### 5. Auto-Merge When Ready

```bash
# Auto-merge when swarm completes and passes checks
SWARM_STATUS=$(npx ruv-swarm github pr-status 123)

if [[ "$SWARM_STATUS" == "complete" ]]; then
  # Check review requirements
  REVIEWS=$(gh pr view 123 --json reviews --jq '.reviews | length')

  if [[ $REVIEWS -ge 2 ]]; then
    # Enable auto-merge
    gh pr merge 123 --auto --squash
  fi
fi
```

---

## 🔗 Integration with Claude Code

### Workflow Pattern

1. **Claude Code** reads PR diff and context
2. **Swarm** coordinates review approach based on PR type
3. **Agents** work in parallel on different review aspects
4. **Progress** updates posted to PR automatically
5. **Final review** performed before marking ready

### Example: Complete PR Management

```javascript
[Single Message - Parallel Execution]:
  // Initialize coordination
  mcp__claude-flow__swarm_init { topology: "hierarchical", maxAgents: 5 }
  mcp__claude-flow__agent_spawn { type: "reviewer", name: "Senior Reviewer" }
  mcp__claude-flow__agent_spawn { type: "tester", name: "QA Engineer" }
  mcp__claude-flow__agent_spawn { type: "coordinator", name: "Merge Coordinator" }

  // Create and manage PR using gh CLI
  Bash("gh pr create --title 'Feature: Add authentication' --base main")
  Bash("gh pr view 54 --json files,diff")
  Bash("gh pr review 54 --approve --body 'LGTM after automated review'")

  // Execute tests and validation
  Bash("npm test")
  Bash("npm run lint")
  Bash("npm run build")

  // Track progress
  TodoWrite { todos: [
    { content: "Complete code review", status: "completed", activeForm: "Completing code review" },
    { content: "Run test suite", status: "completed", activeForm: "Running test suite" },
    { content: "Validate security", status: "completed", activeForm: "Validating security" },
    { content: "Merge when ready", status: "pending", activeForm: "Merging when ready" }
  ]}
```

---

## 🆘 Troubleshooting

### Common Issues

<details>
<summary><strong>Issue: Review agents not spawning</strong></summary>

**Solution:**
```bash
# Check swarm status
npx ruv-swarm swarm-status

# Verify GitHub CLI authentication
gh auth status

# Re-initialize swarm
npx ruv-swarm github review-init --pr 123 --force
```

</details>

<details>
<summary><strong>Issue: Comments not posting to PR</strong></summary>

**Solution:**
```bash
# Verify GitHub token permissions
gh auth status

# Check API rate limits
gh api rate_limit

# Use batch comment posting
npx ruv-swarm github review-comments --pr 123 --batch
```

</details>

<details>
<summary><strong>Issue: Review taking too long</strong></summary>

**Solution:**
```bash
# Use incremental review for large PRs
npx ruv-swarm github review-init --pr 123 --incremental

# Reduce agent count
npx ruv-swarm github review-init --pr 123 --agents "security,style" --max-agents 3

# Enable parallel processing
npx ruv-swarm github review-init --pr 123 --parallel --cache-results
```

</details>

---

## 📖 Additional Resources

### Related Skills
- `github-pr-manager` - Comprehensive PR lifecycle management
- `github-workflow-automation` - Automate GitHub workflows
- `swarm-coordination` - Advanced swarm orchestration

### Documentation
- [GitHub CLI Documentation](https://cli.github.com/manual/)
- [RUV Swarm Guide](https://github.com/ruvnet/ruv-swarm)
- [Claude Flow Integration](https://github.com/ruvnet/claude-flow)

### Support
- GitHub Issues: Report bugs and request features
- Community: Join discussions and share experiences
- Examples: Browse example configurations and workflows

---

## 📄 License

This skill is part of the Claude Code Flow project and is licensed under the MIT License.

---

**Last Updated:** 2025-10-19
**Version:** 1.0.0
**Maintainer:** Claude Code Flow Team
