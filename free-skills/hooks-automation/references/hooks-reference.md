# Hook Reference

> Reference for the `hooks-automation` skill. See [`../SKILL.md`](../SKILL.md).

### Available Hooks

#### Pre-Operation Hooks

Hooks that execute BEFORE operations to prepare and validate:

**pre-edit** - Validate and assign agents before file modifications
```bash
npx claude-flow hook pre-edit [options]

Options:
  --file, -f <path>         File path to be edited
  --auto-assign-agent       Automatically assign best agent (default: true)
  --validate-syntax         Pre-validate syntax before edit
  --check-conflicts         Check for merge conflicts
  --backup-file             Create backup before editing

Examples:
  npx claude-flow hook pre-edit --file "src/auth/login.js"
  npx claude-flow hook pre-edit -f "config/db.js" --validate-syntax
  npx claude-flow hook pre-edit -f "production.env" --backup-file --check-conflicts
```

**Features:**
- Auto agent assignment based on file type
- Syntax validation to prevent broken code
- Conflict detection for concurrent edits
- Automatic file backups for safety

**pre-bash** - Check command safety and resource requirements
```bash
npx claude-flow hook pre-bash --command <cmd>

Options:
  --command, -c <cmd>       Command to validate
  --check-safety            Verify command safety (default: true)
  --estimate-resources      Estimate resource usage
  --require-confirmation    Request user confirmation for risky commands

Examples:
  npx claude-flow hook pre-bash -c "rm -rf /tmp/cache"
  npx claude-flow hook pre-bash --command "docker build ." --estimate-resources
```

**Features:**
- Command safety validation
- Resource requirement estimation
- Destructive command confirmation
- Permission checks

**pre-task** - Auto-spawn agents and prepare for complex tasks
```bash
npx claude-flow hook pre-task [options]

Options:
  --description, -d <text>  Task description for context
  --auto-spawn-agents       Automatically spawn required agents (default: true)
  --load-memory             Load relevant memory from previous sessions
  --optimize-topology       Select optimal swarm topology
  --estimate-complexity     Analyze task complexity

Examples:
  npx claude-flow hook pre-task --description "Implement user authentication"
  npx claude-flow hook pre-task -d "Continue API dev" --load-memory
  npx claude-flow hook pre-task -d "Refactor codebase" --optimize-topology
```

**Features:**
- Automatic agent spawning based on task analysis
- Memory loading for context continuity
- Topology optimization for task structure
- Complexity estimation and time prediction

**pre-search** - Prepare and optimize search operations
```bash
npx claude-flow hook pre-search --query <query>

Options:
  --query, -q <text>        Search query
  --check-cache             Check cache first (default: true)
  --optimize-query          Optimize search pattern

Examples:
  npx claude-flow hook pre-search -q "authentication middleware"
```

**Features:**
- Cache checking for faster results
- Query optimization
- Search pattern improvement

#### Post-Operation Hooks

Hooks that execute AFTER operations to process and learn:

**post-edit** - Auto-format, validate, and update memory
```bash
npx claude-flow hook post-edit [options]

Options:
  --file, -f <path>         File path that was edited
  --auto-format             Automatically format code (default: true)
  --memory-key, -m <key>    Store edit context in memory
  --train-patterns          Train neural patterns from edit
  --validate-output         Validate edited file

Examples:
  npx claude-flow hook post-edit --file "src/components/Button.jsx"
  npx claude-flow hook post-edit -f "api/auth.js" --memory-key "auth/login"
  npx claude-flow hook post-edit -f "utils/helpers.ts" --train-patterns
```

**Features:**
- Language-specific auto-formatting (Prettier, Black, gofmt)
- Memory storage for edit context and decisions
- Neural pattern training for continuous improvement
- Output validation with linting

**post-bash** - Log execution and update metrics
```bash
npx claude-flow hook post-bash --command <cmd>

Options:
  --command, -c <cmd>       Command that was executed
  --log-output              Log command output (default: true)
  --update-metrics          Update performance metrics
  --store-result            Store result in memory

Examples:
  npx claude-flow hook post-bash -c "npm test" --update-metrics
```

**Features:**
- Command execution logging
- Performance metric tracking
- Result storage for analysis
- Error pattern detection

**post-task** - Performance analysis and decision storage
```bash
npx claude-flow hook post-task [options]

Options:
  --task-id, -t <id>        Task identifier for tracking
  --analyze-performance     Generate performance metrics (default: true)
  --store-decisions         Save task decisions to memory
  --export-learnings        Export neural pattern learnings
  --generate-report         Create task completion report

Examples:
  npx claude-flow hook post-task --task-id "auth-implementation"
  npx claude-flow hook post-task -t "api-refactor" --analyze-performance
  npx claude-flow hook post-task -t "bug-fix-123" --store-decisions
```

**Features:**
- Execution time and token usage measurement
- Decision and implementation choice recording
- Neural learning pattern export
- Completion report generation

**post-search** - Cache results and improve patterns
```bash
npx claude-flow hook post-search --query <query> --results <path>

Options:
  --query, -q <text>        Original search query
  --results, -r <path>      Results file path
  --cache-results           Cache for future use (default: true)
  --train-patterns          Improve search patterns

Examples:
  npx claude-flow hook post-search -q "auth" -r "results.json" --train-patterns
```

**Features:**
- Result caching for faster subsequent searches
- Search pattern improvement
- Relevance scoring

#### MCP Integration Hooks

Hooks that coordinate with MCP swarm tools:

**mcp-initialized** - Persist swarm configuration
```bash
npx claude-flow hook mcp-initialized --swarm-id <id>

Features:
- Save swarm topology and configuration
- Store agent roster in memory
- Initialize coordination namespace
```

**agent-spawned** - Update agent roster and memory
```bash
npx claude-flow hook agent-spawned --agent-id <id> --type <type>

Features:
- Register agent in coordination memory
- Update agent roster
- Initialize agent-specific memory namespace
```

**task-orchestrated** - Monitor task progress
```bash
npx claude-flow hook task-orchestrated --task-id <id>

Features:
- Track task progress through memory
- Monitor agent assignments
- Update coordination state
```

**neural-trained** - Save pattern improvements
```bash
npx claude-flow hook neural-trained --pattern <name>

Features:
- Export trained neural patterns
- Update coordination models
- Share learning across agents
```

#### Memory Coordination Hooks

**memory-write** - Triggered when agents write to coordination memory
```bash
Features:
- Validate memory key format
- Update cross-agent indexes
- Trigger dependent hooks
- Notify subscribed agents
```

**memory-read** - Triggered when agents read from coordination memory
```bash
Features:
- Log access patterns
- Update popularity metrics
- Preload related data
- Track usage statistics
```

**memory-sync** - Synchronize memory across swarm agents
```bash
npx claude-flow hook memory-sync --namespace <ns>

Features:
- Sync memory state across agents
- Resolve conflicts
- Propagate updates
- Maintain consistency
```

#### Session Hooks

**session-start** - Initialize new session
```bash
npx claude-flow hook session-start --session-id <id>

Options:
  --session-id, -s <id>     Session identifier
  --load-context            Load context from previous session
  --init-agents             Initialize required agents

Features:
- Create session directory
- Initialize metrics tracking
- Load previous context
- Set up coordination namespace
```

**session-restore** - Load previous session state
```bash
npx claude-flow hook session-restore --session-id <id>

Options:
  --session-id, -s <id>     Session to restore
  --restore-memory          Restore memory state (default: true)
  --restore-agents          Restore agent configurations

Examples:
  npx claude-flow hook session-restore --session-id "swarm-20241019"
  npx claude-flow hook session-restore -s "feature-auth" --restore-memory
```

**Features:**
- Load previous session context
- Restore memory state and decisions
- Reconfigure agents to previous state
- Resume in-progress tasks

**session-end** - Cleanup and persist session state
```bash
npx claude-flow hook session-end [options]

Options:
  --session-id, -s <id>     Session identifier to end
  --save-state              Save current session state (default: true)
  --export-metrics          Export session metrics
  --generate-summary        Create session summary
  --cleanup-temp            Remove temporary files

Examples:
  npx claude-flow hook session-end --session-id "dev-session-2024"
  npx claude-flow hook session-end -s "feature-auth" --export-metrics --generate-summary
  npx claude-flow hook session-end -s "quick-fix" --cleanup-temp
```

**Features:**
- Save current context and progress
- Export session metrics (duration, commands, tokens, files)
- Generate work summary with decisions and next steps
- Cleanup temporary files and optimize storage

**notify** - Custom notifications with swarm status
```bash
npx claude-flow hook notify --message <msg>

Options:
  --message, -m <text>      Notification message
  --level <level>           Notification level (info|warning|error)
  --swarm-status            Include swarm status (default: true)
  --broadcast               Send to all agents

Examples:
  npx claude-flow hook notify -m "Task completed" --level info
  npx claude-flow hook notify -m "Critical error" --level error --broadcast
```

**Features:**
- Send notifications to coordination system
- Include swarm status and metrics
- Broadcast to all agents
- Log important events
