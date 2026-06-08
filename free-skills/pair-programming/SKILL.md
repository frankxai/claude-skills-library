---
name: pair-programming
description: AI-assisted pair programming with multiple modes (driver/navigator/switch), real-time verification, quality monitoring, and comprehensive testing. Supports TDD, debugging, refactoring, and learning sessions. Features automatic role switching, continuous code review, security scanning, and performance optimization with truth-score verification. Use when pairing on code with driver/navigator roles, doing TDD, or wanting real-time review while building.
---

# Pair Programming

Collaborative AI pair programming with intelligent role management, real-time quality monitoring, and comprehensive development workflows.

## What This Skill Does

This skill provides professional pair programming capabilities with AI assistance, supporting multiple collaboration modes, continuous verification, and integrated testing. It manages driver/navigator roles, performs real-time code review, tracks quality metrics, and ensures high standards through truth-score verification.

**Key Capabilities:**
- **Multiple Modes**: Driver, Navigator, Switch, TDD, Review, Mentor, Debug
- **Real-Time Verification**: Automatic quality scoring with rollback on failures
- **Role Management**: Seamless switching between driver/navigator roles
- **Testing Integration**: Auto-generate tests, track coverage, continuous testing
- **Code Review**: Security scanning, performance analysis, best practice enforcement
- **Session Persistence**: Auto-save, recovery, export, and sharing

## Prerequisites

**Required:**
- Claude Flow CLI installed (`npm install -g claude-flow@alpha`)
- Git repository (optional but recommended)

**Recommended:**
- Testing framework (Jest, pytest, etc.)
- Linter configured (ESLint, pylint, etc.)
- Code formatter (Prettier, Black, etc.)

## Quick Start

### Basic Session
```bash
# Start simple pair programming
claude-flow pair --start
```

### TDD Session
```bash
# Test-driven development
claude-flow pair --start \
  --mode tdd \
  --test-first \
  --coverage 90
```

---


## Reference


The full detail lives in `references/` and loads only when needed:

- [`references/usage.md`](references/usage.md) — session control, modes, in-session commands & configuration.
- [`references/examples.md`](references/examples.md) — real-world examples, templates, session management & advanced features.

---

## Operations reference

### Best Practices

#### Session Practices
1. **Clear Goals** - Define session objectives upfront
2. **Appropriate Mode** - Choose based on task type
3. **Enable Verification** - For critical code paths
4. **Regular Testing** - Maintain quality continuously
5. **Session Notes** - Document important decisions
6. **Regular Breaks** - Take breaks every 45-60 minutes

#### Code Practices
1. **Test Early** - Run tests after each change
2. **Verify Before Commit** - Check truth scores
3. **Review Security** - Always for sensitive code
4. **Profile Performance** - Use `/perf` for optimization
5. **Save Sessions** - For complex work
6. **Learn from AI** - Ask questions frequently

#### Mode Selection
- **Driver Mode**: When learning, controlling implementation
- **Navigator Mode**: For rapid prototyping, generation
- **Switch Mode**: Long sessions, balanced collaboration
- **TDD Mode**: Building with tests
- **Review Mode**: Quality focus
- **Mentor Mode**: Learning priority
- **Debug Mode**: Fixing issues

### Troubleshooting

#### Session Won't Start
- Check agent availability
- Verify configuration file syntax
- Ensure clean workspace
- Review log files

#### Session Disconnected
- Use `--recover` to restore
- Check network connection
- Verify background processes
- Review auto-save files

#### Poor Performance
- Reduce verification threshold
- Disable continuous testing
- Check system resources
- Use lighter AI model

#### Configuration Issues
- Validate JSON syntax
- Check file permissions
- Review priority order (CLI > env > project > user > global)
- Run `claude-flow pair config validate`

### Quality Metrics

#### Truth Score Thresholds
```
Error:   < 0.90 ❌
Warning: 0.90 - 0.95 ⚠️
Good:    0.95 - 0.98 ✅
Excellent: > 0.98 🌟
```

#### Coverage Thresholds
```
Error:   < 70% ❌
Warning: 70% - 80% ⚠️
Good:    80% - 90% ✅
Excellent: > 90% 🌟
```

#### Complexity Thresholds
```
Error:   > 15 ❌
Warning: 10 - 15 ⚠️
Good:    5 - 10 ✅
Excellent: < 5 🌟
```

### Environment Variables

Override configuration via environment:

```bash
export CLAUDE_PAIR_MODE=driver
export CLAUDE_PAIR_VERIFY=true
export CLAUDE_PAIR_THRESHOLD=0.98
export CLAUDE_PAIR_AGENT=senior-dev
export CLAUDE_PAIR_AUTO_TEST=true
```

### Command History

Navigate history:
- `↑/↓` - Navigate through command history
- `Ctrl+R` - Search command history
- `!!` - Repeat last command
- `!<n>` - Run command n from history

### Keyboard Shortcuts (Configurable)

Default shortcuts:
```json
{
  "shortcuts": {
    "switch": "ctrl+shift+s",
    "suggest": "ctrl+space",
    "review": "ctrl+r",
    "test": "ctrl+t"
  }
}
```

### Related Commands

- `claude-flow pair --help` - Show help
- `claude-flow pair config` - Manage configuration
- `claude-flow pair profile` - Manage profiles
- `claude-flow pair templates` - List templates
- `claude-flow pair agents` - List available agents
