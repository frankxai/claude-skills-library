# Command Reference

The exhaustive `ruv-swarm github` / `gh` command catalog for project management.
Referenced by `../SKILL.md` — load when you need a specific operation.

## Issue management & triage

```bash
# Issue → swarm conversion
ISSUE_DATA=$(gh issue view 456 --json title,body,labels,assignees,comments)
npx ruv-swarm github issue-to-swarm 456 --issue-data "$ISSUE_DATA" --auto-decompose --assign-agents

# Batch process labelled issues
ISSUES=$(gh issue list --label "swarm-ready" --json number,title,body,labels)
npx ruv-swarm github issues-batch --issues "$ISSUES" --parallel

# Automated triage + duplicate detection
npx ruv-swarm github triage --unlabeled --analyze-content --suggest-labels --assign-priority
npx ruv-swarm github find-duplicates --threshold 0.8 --link-related --close-duplicates
```

Issue-comment commands (run from an issue comment): `/swarm analyze`, `/swarm decompose 5`,
`/swarm assign @agent-coder`, `/swarm estimate`, `/swarm start`.

Auto-label rules (`.github/swarm-labels.json`):

```json
{
  "rules": [
    { "keywords": ["bug", "error", "broken"], "labels": ["bug", "swarm-debugger"], "agents": ["debugger", "tester"] },
    { "keywords": ["feature", "implement", "add"], "labels": ["enhancement", "swarm-feature"], "agents": ["architect", "coder", "tester"] },
    { "keywords": ["slow", "performance", "optimize"], "labels": ["performance", "swarm-optimizer"], "agents": ["analyst", "optimizer"] }
  ]
}
```

### Task decomposition & progress

```bash
# Decompose an issue into a subtask checklist
ISSUE_BODY=$(gh issue view 456 --json body --jq '.body')
SUBTASKS=$(npx ruv-swarm github issue-decompose 456 --body "$ISSUE_BODY" --max-subtasks 10 --assign-priorities)
CHECKLIST=$(echo "$SUBTASKS" | jq -r '.tasks[] | "- [ ] " + .description')
gh issue edit 456 --body "$ISSUE_BODY

## Subtasks
$CHECKLIST"

# Spin off high-priority subtasks as linked issues
echo "$SUBTASKS" | jq -r '.tasks[] | select(.priority == "high")' | while read -r task; do
  gh issue create --title "$(echo "$task" | jq -r '.title')" \
    --body "$(echo "$task" | jq -r '.description')

Parent issue: #456" --label "subtask"
done

# Automated progress comment + label promotion
PROGRESS=$(npx ruv-swarm github issue-progress 456)
gh issue comment 456 --body "$(echo "$PROGRESS" | jq -r '"## 📊 Progress Update\n\n**Completion**: \(.completion)%\n**ETA**: \(.eta)"')"
[[ "$(echo "$PROGRESS" | jq -r '.completion')" == "100" ]] && gh issue edit 456 --add-label "ready-for-review" --remove-label "in-progress"
```

### Stale issue management

```bash
STALE_DATE=$(date -d '30 days ago' --iso-8601)
gh issue list --state open --json number,title,updatedAt,labels \
  --jq ".[] | select(.updatedAt < \"$STALE_DATE\") | .number" | while read -r num; do
  ACTION=$(npx ruv-swarm github analyze-stale --issue "$(gh issue view $num --json title,body,comments,labels)" --suggest-action)
  case "$ACTION" in
    close) gh issue comment $num --body "Inactive for 30 days; closing in 7 if no activity."; gh issue edit $num --add-label "stale" ;;
    keep) gh issue edit $num --remove-label "stale" 2>/dev/null || true ;;
    needs-info) gh issue comment $num --body "Needs more information."; gh issue edit $num --add-label "needs-info" ;;
  esac
done
```

## Project board automation

```bash
# Connect a swarm to a project + add a tracking field
PROJECT_ID=$(gh project list --owner @me --format json | jq -r '.projects[] | select(.title == "Development Board") | .id')
npx ruv-swarm github board-init --project-id "$PROJECT_ID" --sync-mode "bidirectional" --create-views "swarm-status,agent-workload,priority"
gh project field-create $PROJECT_ID --owner @me --name "Swarm Status" --data-type "SINGLE_SELECT" --single-select-options "pending,in_progress,completed"

# Real-time sync, auto-assign, smart moves, bulk ops
npx ruv-swarm github board-sync --auto-move-cards --update-metadata
npx ruv-swarm github board-auto-assign --strategy "load-balanced" --consider "expertise,workload,availability" --update-cards
npx ruv-swarm github board-smart-move --rules '{ "auto-progress": "when:all-subtasks-done", "auto-review": "when:tests-pass", "auto-done": "when:pr-merged" }'
npx ruv-swarm github board-bulk --filter "status:blocked" --action "add-label:needs-attention" --notify-assignees

# Import issues onto the board
gh issue list --label "enhancement" --json number | jq -r '.[].number' | while read -r issue; do
  gh project item-add $PROJECT_ID --owner @me --url "https://github.com/$GITHUB_REPOSITORY/issues/$issue"
done
```

Board mapping config (`.github/board-sync.yml`):

```yaml
version: 1
project: { name: "AI Development Board", number: 1 }
mapping:
  status: { pending: "Backlog", assigned: "Ready", in_progress: "In Progress", review: "Review", completed: "Done", blocked: "Blocked" }
  agents: { coder: "🔧 Development", tester: "🧪 Testing", analyst: "📊 Analysis", designer: "🎨 Design", architect: "🏗️ Architecture" }
  priority: { critical: "🔴 Critical", high: "🟡 High", medium: "🟢 Medium", low: "⚪ Low" }
```

## Sprint planning & analytics

```bash
# Sprint + milestone management
npx ruv-swarm github sprint-manage --sprint "Sprint 23" --auto-populate --capacity-planning --track-velocity
npx ruv-swarm github milestone-track --milestone "v2.0 Release" --update-board --show-dependencies --predict-completion
npx ruv-swarm github agile-board --methodology "scrum" --sprint-length "2w" --ceremonies "planning,review,retro" --metrics "velocity,burndown"
npx ruv-swarm github kanban-board --wip-limits '{ "In Progress": 5, "Review": 3 }' --cycle-time-tracking --continuous-flow

# Analytics, reports, KPIs
npx ruv-swarm github board-analytics --metrics "throughput,cycle-time,wip" --group-by "agent,priority,type" --time-range "30d" --export "dashboard"
npx ruv-swarm github board-report --type "sprint-summary" --format "markdown" --include "velocity,burndown,blockers" --distribute "slack,email"
npx ruv-swarm github board-kpis --metrics '["average-cycle-time","throughput-per-sprint","blocked-time-percentage","first-time-pass-rate"]' --dashboard-url
npx ruv-swarm github issue-metrics --issue 456 --metrics "time-to-close,agent-efficiency,subtask-completion"
```

## Advanced coordination

```bash
# Multi-board / cross-org sync
npx ruv-swarm github multi-board-sync --boards "Development,QA,Release" --sync-rules '{ "Development->QA": "when:ready-for-test", "QA->Release": "when:tests-pass" }'
npx ruv-swarm github cross-org-sync --source "org1/Project-A" --target "org2/Project-B" --field-mapping "custom" --conflict-resolution "source-wins"

# Dependencies, epics, cross-repo
npx ruv-swarm github issue-deps 456 --resolve-order --parallel-safe --update-blocking
npx ruv-swarm github epic-swarm --epic 123 --child-issues "456,457,458" --orchestrate
npx ruv-swarm github cross-repo --issue "org/repo#456" --related "org/other-repo#123" --coordinate

# Team collaboration
npx ruv-swarm github board-distribute --strategy "skills-based" --balance-workload --respect-preferences --notify-assignments
npx ruv-swarm github standup-report --team "frontend" --include "yesterday,today,blockers" --format "slack" --schedule "daily-9am"
```

## Specialized strategies

```bash
npx ruv-swarm github bug-swarm 456 --reproduce --isolate --fix --test
npx ruv-swarm github feature-swarm 456 --design --implement --document --demo
npx ruv-swarm github debt-swarm 456 --analyze-impact --plan-migration --execute --validate
```

## Workflow integration (GitHub Actions)

```yaml
# .github/workflows/issue-swarm.yml
name: Issue Swarm Handler
on:
  issues:
    types: [opened, labeled, commented]
jobs:
  swarm-process:
    runs-on: ubuntu-latest
    steps:
      - name: Process Issue
        uses: ruvnet/swarm-action@v1
        env:
          LABEL_NAME: ${{ github.event.label.name }}
          ISSUE_NUMBER: ${{ github.event.issue.number }}
        with:
          command: |
            # Pass GitHub context via env vars, never inline — inline expansion of
            # untrusted label/title text into the shell is a command-injection vector.
            if [[ "$LABEL_NAME" == "swarm-ready" ]]; then
              npx ruv-swarm github issue-init "$ISSUE_NUMBER"
            fi
```

## Troubleshooting

```bash
npx ruv-swarm github board-diagnose --check "permissions,webhooks,rate-limits" --test-sync --show-conflicts
npx ruv-swarm github board-optimize --analyze-size --archive-completed --index-fields --cache-views
npx ruv-swarm github board-recover --backup-id "2024-01-15" --restore-cards --preserve-current --merge-conflicts
```

## Resources

- [GitHub CLI Documentation](https://cli.github.com/manual/)
- [GitHub Projects Documentation](https://docs.github.com/en/issues/planning-and-tracking-with-projects)
- [Swarm Coordination Guide](https://github.com/ruvnet/ruv-swarm)
- [Claude Flow Documentation](https://github.com/ruvnet/claude-flow)
