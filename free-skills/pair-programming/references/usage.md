# Session control, modes, in-session commands & configuration

> Reference for the `pair-programming` skill. See [`../SKILL.md`](../SKILL.md).

### Session Control Commands

#### Starting Sessions
```bash
# Basic start
claude-flow pair --start

# Expert refactoring session
claude-flow pair --start \
  --agent senior-dev \
  --focus refactor \
  --verify \
  --threshold 0.98

# Debugging session
claude-flow pair --start \
  --agent debugger-expert \
  --focus debug \
  --review

# Learning session
claude-flow pair --start \
  --mode mentor \
  --pace slow \
  --examples
```

#### Session Management
```bash
# Check status
claude-flow pair --status

# View history
claude-flow pair --history

# Pause session
/pause [--reason <reason>]

# Resume session
/resume

# End session
claude-flow pair --end [--save] [--report]
```

### Available Modes

#### Driver Mode
You write code while AI provides guidance.

```bash
claude-flow pair --start --mode driver
```

**Your Responsibilities:**
- Write actual code
- Implement solutions
- Make immediate decisions
- Handle syntax and structure

**AI Navigator:**
- Strategic guidance
- Spot potential issues
- Suggest improvements
- Real-time review
- Track overall direction

**Best For:**
- Learning new patterns
- Implementing familiar features
- Quick iterations
- Hands-on debugging

**Commands:**
```
/suggest     - Get implementation suggestions
/review      - Request code review
/explain     - Ask for explanations
/optimize    - Request optimization ideas
/patterns    - Get pattern recommendations
```

#### Navigator Mode
AI writes code while you provide direction.

```bash
claude-flow pair --start --mode navigator
```

**Your Responsibilities:**
- Provide high-level direction
- Review generated code
- Make architectural decisions
- Ensure business requirements

**AI Driver:**
- Write implementation code
- Handle syntax details
- Implement your guidance
- Manage boilerplate
- Execute refactoring

**Best For:**
- Rapid prototyping
- Boilerplate generation
- Learning from AI patterns
- Exploring solutions

**Commands:**
```
/implement   - Direct implementation
/refactor    - Request refactoring
/test        - Generate tests
/document    - Add documentation
/alternate   - See alternative approaches
```

#### Switch Mode
Automatically alternates roles at intervals.

```bash
# Default 10-minute intervals
claude-flow pair --start --mode switch

# 5-minute intervals (rapid)
claude-flow pair --start --mode switch --interval 5m

# 15-minute intervals (deep focus)
claude-flow pair --start --mode switch --interval 15m
```

**Handoff Process:**
1. 30-second warning before switch
2. Current driver completes thought
3. Context summary generated
4. Roles swap smoothly
5. New driver continues

**Best For:**
- Balanced collaboration
- Knowledge sharing
- Complex features
- Extended sessions

#### Specialized Modes

**TDD Mode** - Test-Driven Development:
```bash
claude-flow pair --start \
  --mode tdd \
  --test-first \
  --coverage 100
```
Workflow: Write failing test → Implement → Refactor → Repeat

**Review Mode** - Continuous code review:
```bash
claude-flow pair --start \
  --mode review \
  --strict \
  --security
```
Features: Real-time feedback, security scanning, performance analysis

**Mentor Mode** - Learning-focused:
```bash
claude-flow pair --start \
  --mode mentor \
  --explain-all \
  --pace slow
```
Features: Detailed explanations, step-by-step guidance, pattern teaching

**Debug Mode** - Problem-solving:
```bash
claude-flow pair --start \
  --mode debug \
  --verbose \
  --trace
```
Features: Issue identification, root cause analysis, fix suggestions

### In-Session Commands

#### Code Commands
```
/explain [--level basic|detailed|expert]
  Explain the current code or selection

/suggest [--type refactor|optimize|security|style]
  Get improvement suggestions

/implement <description>
  Request implementation (navigator mode)

/refactor [--pattern <pattern>] [--scope function|file|module]
  Refactor selected code

/optimize [--target speed|memory|both]
  Optimize code for performance

/document [--format jsdoc|markdown|inline]
  Add documentation to code

/comment [--verbose]
  Add inline comments

/pattern <pattern-name> [--example]
  Apply a design pattern
```

#### Testing Commands
```
/test [--watch] [--coverage] [--only <pattern>]
  Run test suite

/test-gen [--type unit|integration|e2e]
  Generate tests for current code

/coverage [--report html|json|terminal]
  Check test coverage

/mock <target> [--realistic]
  Generate mock data or functions

/test-watch [--on-save]
  Enable test watching

/snapshot [--update]
  Create test snapshots
```

#### Review Commands
```
/review [--scope current|file|changes] [--strict]
  Perform code review

/security [--deep] [--fix]
  Security analysis

/perf [--profile] [--suggestions]
  Performance analysis

/quality [--detailed]
  Check code quality metrics

/lint [--fix] [--config <config>]
  Run linters

/complexity [--threshold <value>]
  Analyze code complexity
```

#### Navigation Commands
```
/goto <file>[:line[:column]]
  Navigate to file or location

/find <pattern> [--regex] [--case-sensitive]
  Search in project

/recent [--limit <n>]
  Show recent files

/bookmark [add|list|goto|remove] [<name>]
  Manage bookmarks

/history [--limit <n>] [--filter <pattern>]
  Show command history

/tree [--depth <n>] [--filter <pattern>]
  Show project structure
```

#### Git Commands
```
/diff [--staged] [--file <file>]
  Show git diff

/commit [--message <msg>] [--amend]
  Commit with verification

/branch [create|switch|delete|list] [<name>]
  Branch operations

/stash [save|pop|list|apply] [<message>]
  Stash operations

/log [--oneline] [--limit <n>]
  View git log

/blame [<file>]
  Show git blame
```

#### AI Partner Commands
```
/agent [switch|info|config] [<agent-name>]
  Manage AI agent

/teach <preference>
  Teach the AI your preferences

/feedback [positive|negative] <message>
  Provide feedback to AI

/personality [professional|friendly|concise|verbose]
  Adjust AI personality

/expertise [add|remove|list] [<domain>]
  Set AI expertise focus
```

#### Metrics Commands
```
/metrics [--period today|session|week|all]
  Show session metrics

/score [--breakdown]
  Show quality scores

/productivity [--chart]
  Show productivity metrics

/leaderboard [--personal|team]
  Show improvement leaderboard
```

#### Role & Mode Commands
```
/switch [--immediate]
  Switch driver/navigator roles

/mode <type>
  Change mode (driver|navigator|switch|tdd|review|mentor|debug)

/role
  Show current role

/handoff
  Prepare role handoff
```

### Command Shortcuts

| Alias | Full Command |
|-------|-------------|
| `/s` | `/suggest` |
| `/e` | `/explain` |
| `/t` | `/test` |
| `/r` | `/review` |
| `/c` | `/commit` |
| `/g` | `/goto` |
| `/f` | `/find` |
| `/h` | `/help` |
| `/sw` | `/switch` |
| `/st` | `/status` |

### Configuration

#### Basic Configuration
Create `.claude-flow/pair-config.json`:

```json
{
  "pair": {
    "enabled": true,
    "defaultMode": "switch",
    "defaultAgent": "auto",
    "autoStart": false,
    "theme": "professional"
  }
}
```

#### Complete Configuration

```json
{
  "pair": {
    "general": {
      "enabled": true,
      "defaultMode": "switch",
      "defaultAgent": "senior-dev",
      "language": "javascript",
      "timezone": "UTC"
    },

    "modes": {
      "driver": {
        "enabled": true,
        "suggestions": true,
        "realTimeReview": true,
        "autoComplete": false
      },
      "navigator": {
        "enabled": true,
        "codeGeneration": true,
        "explanations": true,
        "alternatives": true
      },
      "switch": {
        "enabled": true,
        "interval": "10m",
        "warning": "30s",
        "autoSwitch": true,
        "pauseOnIdle": true
      }
    },

    "verification": {
      "enabled": true,
      "threshold": 0.95,
      "autoRollback": true,
      "preCommitCheck": true,
      "continuousMonitoring": true,
      "blockOnFailure": true
    },

    "testing": {
      "enabled": true,
      "autoRun": true,
      "framework": "jest",
      "onSave": true,
      "coverage": {
        "enabled": true,
        "minimum": 80,
        "enforce": true,
        "reportFormat": "html"
      }
    },

    "review": {
      "enabled": true,
      "continuous": true,
      "preCommit": true,
      "security": true,
      "performance": true,
      "style": true,
      "complexity": {
        "maxComplexity": 10,
        "maxDepth": 4,
        "maxLines": 100
      }
    },

    "git": {
      "enabled": true,
      "autoCommit": false,
      "commitTemplate": "feat: {message}",
      "signCommits": false,
      "pushOnEnd": false,
      "branchProtection": true
    },

    "session": {
      "autoSave": true,
      "saveInterval": "5m",
      "maxDuration": "4h",
      "idleTimeout": "15m",
      "breakReminder": "45m",
      "metricsInterval": "1m"
    },

    "ai": {
      "model": "advanced",
      "temperature": 0.7,
      "maxTokens": 4000,
      "personality": "professional",
      "expertise": ["backend", "testing", "security"],
      "learningEnabled": true
    }
  }
}
```

#### Built-in Agents

```json
{
  "agents": {
    "senior-dev": {
      "expertise": ["architecture", "patterns", "optimization"],
      "style": "thorough",
      "reviewLevel": "strict"
    },
    "tdd-specialist": {
      "expertise": ["testing", "mocks", "coverage"],
      "style": "test-first",
      "reviewLevel": "comprehensive"
    },
    "debugger-expert": {
      "expertise": ["debugging", "profiling", "tracing"],
      "style": "analytical",
      "reviewLevel": "focused"
    },
    "junior-dev": {
      "expertise": ["learning", "basics", "documentation"],
      "style": "questioning",
      "reviewLevel": "educational"
    }
  }
}
```

#### CLI Configuration
```bash
# Set configuration
claude-flow pair config set defaultMode switch
claude-flow pair config set verification.threshold 0.98

# Get configuration
claude-flow pair config get
claude-flow pair config get defaultMode

# Export/Import
claude-flow pair config export > config.json
claude-flow pair config import config.json

# Reset
claude-flow pair config reset
```

#### Profile Management

Create reusable profiles:

```bash
# Create profile
claude-flow pair profile create refactoring \
  --mode driver \
  --verify true \
  --threshold 0.98 \
  --focus refactor

# Use profile
claude-flow pair --start --profile refactoring

# List profiles
claude-flow pair profile list
```

Profile configuration:
```json
{
  "profiles": {
    "refactoring": {
      "mode": "driver",
      "verification": {
        "enabled": true,
        "threshold": 0.98
      },
      "focus": "refactor"
    },
    "debugging": {
      "mode": "navigator",
      "agent": "debugger-expert",
      "trace": true,
      "verbose": true
    },
    "learning": {
      "mode": "mentor",
      "pace": "slow",
      "explanations": "detailed",
      "examples": true
    }
  }
}
```
