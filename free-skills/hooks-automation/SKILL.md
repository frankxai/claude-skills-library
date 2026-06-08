---
name: hooks-automation
description: Automated coordination, formatting, and learning from Claude Code operations using intelligent hooks with MCP integration. Includes pre/post task hooks, session management, Git integration, memory coordination, and neural pattern training for enhanced development workflows. Use when configuring Claude Code hooks, automating pre/post-task coordination, or wiring Git and memory hooks.
---

# Hooks Automation

Intelligent automation system that coordinates, validates, and learns from Claude Code operations through hooks integrated with MCP tools and neural pattern training.

## What This Skill Does

This skill provides a comprehensive hook system that automatically manages development operations, coordinates swarm agents, maintains session state, and continuously learns from coding patterns. It enables automated agent assignment, code formatting, performance tracking, and cross-session memory persistence.

**Key Capabilities:**
- **Pre-Operation Hooks**: Validate, prepare, and auto-assign agents before operations
- **Post-Operation Hooks**: Format, analyze, and train patterns after operations
- **Session Management**: Persist state, restore context, generate summaries
- **Memory Coordination**: Synchronize knowledge across swarm agents
- **Git Integration**: Automated commit hooks with quality verification
- **Neural Training**: Continuous learning from successful patterns
- **MCP Integration**: Seamless coordination with swarm tools

## Prerequisites

**Required:**
- Claude Flow CLI installed (`npm install -g claude-flow@alpha`)
- Claude Code with hooks enabled
- `.claude/settings.json` with hook configurations

**Optional:**
- MCP servers configured (claude-flow, ruv-swarm, flow-nexus)
- Git repository for version control
- Testing framework for quality verification

## Quick Start

### Initialize Hooks System

```bash
# Initialize with default hooks configuration
npx claude-flow init --hooks
```

This creates:
- `.claude/settings.json` with pre-configured hooks
- Hook command documentation in `.claude/commands/hooks/`
- Default hook handlers for common operations

### Basic Hook Usage

```bash
# Pre-task hook (auto-spawns agents)
npx claude-flow hook pre-task --description "Implement authentication"

# Post-edit hook (auto-formats and stores in memory)
npx claude-flow hook post-edit --file "src/auth.js" --memory-key "auth/login"

# Session end hook (saves state and metrics)
npx claude-flow hook session-end --session-id "dev-session" --export-metrics
```

---

## Reference

The full hook catalog and deep guides live in `references/` and load only when needed:

- [`references/hooks-reference.md`](references/hooks-reference.md) — every pre/post/MCP/session hook with options, examples, and features.
- [`references/configuration.md`](references/configuration.md) — `.claude/settings.json` hook configuration.
- [`references/coordination.md`](references/coordination.md) — MCP tool integration, the memory coordination protocol, and hook response formats.
- [`references/git-and-agents.md`](references/git-and-agents.md) — Git hook integration and the multi-agent coordination workflow.
- [`references/custom-and-examples.md`](references/custom-and-examples.md) — writing custom hooks and real-world end-to-end examples.

---

## Operations, tips & troubleshooting

### Performance Tips

1. **Keep Hooks Lightweight** - Target < 100ms execution time
2. **Use Async for Heavy Operations** - Don't block the main flow
3. **Cache Aggressively** - Store frequently accessed data
4. **Batch Related Operations** - Combine multiple actions
5. **Use Memory Wisely** - Set appropriate TTLs
6. **Monitor Hook Performance** - Track execution times
7. **Parallelize When Possible** - Run independent hooks concurrently

### Debugging Hooks

Enable debug mode for troubleshooting:

```bash
# Enable debug output
export CLAUDE_FLOW_DEBUG=true

# Test specific hook with verbose output
npx claude-flow hook pre-edit --file "test.js" --debug

# Check hook execution logs
cat .claude-flow/logs/hooks-$(date +%Y-%m-%d).log

# Validate configuration
npx claude-flow hook validate-config
```

### Benefits

- **Automatic Agent Assignment**: Right agent for every file type
- **Consistent Code Formatting**: Language-specific formatters
- **Continuous Learning**: Neural patterns improve over time
- **Cross-Session Memory**: Context persists between sessions
- **Performance Tracking**: Comprehensive metrics and analytics
- **Automatic Coordination**: Agents sync via memory
- **Smart Agent Spawning**: Task-based agent selection
- **Quality Gates**: Pre-commit validation and verification
- **Error Prevention**: Syntax validation before edits
- **Knowledge Sharing**: Decisions stored and shared
- **Reduced Manual Work**: Automation of repetitive tasks
- **Better Collaboration**: Seamless multi-agent coordination

### Best Practices

1. **Configure Hooks Early** - Set up during project initialization
2. **Use Memory Keys Strategically** - Organize with clear namespaces
3. **Enable Auto-Formatting** - Maintain code consistency
4. **Train Patterns Continuously** - Learn from successful operations
5. **Monitor Performance** - Track hook execution times
6. **Validate Configuration** - Test hooks before production use
7. **Document Custom Hooks** - Maintain hook documentation
8. **Set Appropriate Timeouts** - Prevent hanging operations
9. **Handle Errors Gracefully** - Use continueOnError when appropriate
10. **Review Metrics Regularly** - Optimize based on usage patterns

### Troubleshooting

#### Hooks Not Executing
- Verify `.claude/settings.json` syntax
- Check hook matcher patterns
- Enable debug mode
- Review permission settings
- Ensure claude-flow CLI is in PATH

#### Hook Timeouts
- Increase timeout values in configuration
- Make hooks asynchronous for heavy operations
- Optimize hook logic
- Check network connectivity for MCP tools

#### Memory Issues
- Set appropriate TTLs for memory keys
- Clean up old memory entries
- Use memory namespaces effectively
- Monitor memory usage

#### Performance Problems
- Profile hook execution times
- Use caching for repeated operations
- Batch operations when possible
- Reduce hook complexity

### Related Commands

- `npx claude-flow init --hooks` - Initialize hooks system
- `npx claude-flow hook --list` - List available hooks
- `npx claude-flow hook --test <hook>` - Test specific hook
- `npx claude-flow memory usage` - Manage memory
- `npx claude-flow agent spawn` - Spawn agents
- `npx claude-flow swarm init` - Initialize swarm

### Integration with Other Skills

This skill works seamlessly with:
- **SPARC Methodology** - Hooks enhance SPARC workflows
- **Pair Programming** - Automated quality in pairing sessions
- **Verification Quality** - Truth-score validation in hooks
- **GitHub Workflows** - Git integration for commits/PRs
- **Performance Analysis** - Metrics collection in hooks
- **Swarm Advanced** - Multi-agent coordination via hooks
