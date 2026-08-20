---
name: github-release-management
version: 2.0.0
description: GitHub release orchestration — automated versioning, testing, deployment, and rollback. Use when cutting a release, tagging a version, drafting release notes, or coordinating a deploy/rollback workflow.
category: github
tags: [release, deployment, versioning, automation, ci-cd, swarm, orchestration]
author: Claude Flow Team
requires:
  - gh (GitHub CLI)
  - claude-flow
  - ruv-swarm (optional for enhanced coordination)
  - mcp-github (optional for MCP integration)
dependencies:
  - git
  - npm or yarn
  - node >= 20.0.0
related_skills:
  - github-pr-management
  - github-issue-tracking
  - github-workflow-automation
  - multi-repo-coordination
---

# GitHub Release Management Skill

Intelligent release automation and orchestration using AI swarms for comprehensive software releases - from changelog generation to multi-platform deployment with rollback capabilities.

## Quick Start

### Simple Release Flow
```bash
# Plan and create a release
gh release create v2.0.0 \
  --draft \
  --generate-notes \
  --title "Release v2.0.0"

# Orchestrate with swarm
npx claude-flow github release-create \
  --version "2.0.0" \
  --build-artifacts \
  --deploy-targets "npm,docker,github"
```

### Full Automated Release
```bash
# Initialize release swarm
npx claude-flow swarm init --topology hierarchical

# Execute complete release pipeline
npx claude-flow sparc pipeline "Release v2.0.0 with full validation"
```

---

## Core Capabilities

### 1. Release Planning & Version Management
- Semantic version analysis and suggestion
- Breaking change detection from commits
- Release timeline generation
- Multi-package version coordination

### 2. Automated Testing & Validation
- Multi-stage test orchestration
- Cross-platform compatibility testing
- Performance regression detection
- Security vulnerability scanning

### 3. Build & Deployment Orchestration
- Multi-platform build coordination
- Parallel artifact generation
- Progressive deployment strategies
- Automated rollback mechanisms

### 4. Documentation & Communication
- Automated changelog generation
- Release notes with categorization
- Migration guide creation
- Stakeholder notification

---

## Progressive Disclosure: Level 1 - Basic Usage

### Essential Release Commands

#### Create Release Draft
```bash
# Get last release tag
LAST_TAG=$(gh release list --limit 1 --json tagName -q '.[0].tagName')

# Generate changelog from commits
CHANGELOG=$(gh api repos/:owner/:repo/compare/${LAST_TAG}...HEAD \
  --jq '.commits[].commit.message')

# Create draft release
gh release create v2.0.0 \
  --draft \
  --title "Release v2.0.0" \
  --notes "$CHANGELOG" \
  --target main
```

#### Basic Version Bump
```bash
# Update package.json version
npm version patch  # or minor, major

# Push version tag
git push --follow-tags
```

#### Simple Deployment
```bash
# Build and publish npm package
npm run build
npm publish

# Create GitHub release
gh release create $(npm pkg get version) \
  --generate-notes
```

### Quick Integration Example
```javascript
// Simple release preparation in Claude Code
[Single Message]:
  // Update version files
  Edit("package.json", { old: '"version": "1.0.0"', new: '"version": "2.0.0"' })

  // Generate changelog
  Bash("gh api repos/:owner/:repo/compare/v1.0.0...HEAD --jq '.commits[].commit.message' > CHANGELOG.md")

  // Create release branch
  Bash("git checkout -b release/v2.0.0")
  Bash("git add -A && git commit -m 'release: Prepare v2.0.0'")

  // Create PR
  Bash("gh pr create --title 'Release v2.0.0' --body 'Automated release preparation'")
```

---


## Reference


The full detail lives in `references/` and loads only when needed:

- [`references/workflows.md`](references/workflows.md) — swarm coordination, advanced & enterprise workflows, and github actions integration.

---

## Best Practices & Patterns

### Release Planning Guidelines

#### 1. Regular Release Cadence
- **Weekly**: Patch releases with bug fixes
- **Bi-weekly**: Minor releases with features
- **Quarterly**: Major releases with breaking changes
- **On-demand**: Hotfixes for critical issues

#### 2. Feature Freeze Strategy
- Code freeze 3 days before release
- Only critical bug fixes allowed
- Beta testing period for major releases
- Stakeholder communication plan

#### 3. Version Management Rules
- Strict semantic versioning compliance
- Breaking changes only in major versions
- Deprecation warnings one minor version ahead
- Cross-package version synchronization

### Automation Recommendations

#### 1. Comprehensive CI/CD Pipeline
- Automated testing at every stage
- Security scanning before release
- Performance benchmarking
- Documentation generation

#### 2. Progressive Deployment
- Canary releases for early detection
- Staged rollouts with monitoring
- Automated health checks
- Quick rollback mechanisms

#### 3. Monitoring & Observability
- Real-time error tracking
- Performance metrics collection
- User adoption analytics
- Feedback collection automation

### Documentation Standards

#### 1. Changelog Requirements
- Categorized changes by type
- Breaking changes highlighted
- Migration guides for major versions
- Contributor attribution

#### 2. Release Notes Content
- High-level feature summaries
- Detailed technical changes
- Upgrade instructions
- Known issues and limitations

#### 3. API Documentation
- Automated API doc generation
- Example code updates
- Deprecation notices
- Version compatibility matrix

---

## Troubleshooting & Common Issues

### Issue: Failed Release Build
```bash
# Debug build failures
npx claude-flow@alpha diagnostic-run \
  --component build \
  --verbose

# Retry with isolated environment
docker run --rm -v $(pwd):/app node:20 \
  bash -c "cd /app && npm ci && npm run build"
```

### Issue: Test Failures in CI
```bash
# Run tests with detailed output
npm run test -- --verbose --coverage

# Check for environment-specific issues
npm run test:ci

# Compare local vs CI environment
npx claude-flow@alpha github compat-test \
  --environments "local,ci" \
  --compare
```

### Issue: Deployment Rollback Needed
```bash
# Immediate rollback to previous version
npx claude-flow@alpha github rollback \
  --to-version v1.9.9 \
  --reason "Critical bug in v2.0.0" \
  --preserve-data \
  --notify-users

# Investigate rollback cause
npx claude-flow@alpha github release-analytics \
  --version v2.0.0 \
  --identify-issues
```

### Issue: Version Conflicts
```bash
# Check and resolve version conflicts
npx claude-flow@alpha github release-validate \
  --checks version-conflicts \
  --auto-resolve

# Align multi-package versions
npx claude-flow@alpha github version-sync \
  --packages "package-a,package-b" \
  --strategy semantic
```

---

## Performance Metrics & Benchmarks

### Expected Performance
- **Release Planning**: < 2 minutes
- **Build Process**: 3-8 minutes (varies by project)
- **Test Execution**: 5-15 minutes
- **Deployment**: 2-5 minutes per target
- **Complete Pipeline**: 15-30 minutes

### Optimization Tips
1. **Parallel Execution**: Use swarm coordination for concurrent tasks
2. **Caching**: Enable build and dependency caching
3. **Incremental Builds**: Only rebuild changed components
4. **Test Optimization**: Run critical tests first, full suite in parallel

### Success Metrics
- **Release Frequency**: Target weekly minor releases
- **Lead Time**: < 2 hours from commit to production
- **Failure Rate**: < 2% of releases require rollback
- **MTTR**: < 30 minutes for critical hotfixes

---

## Related Resources

### Documentation
- [GitHub CLI Documentation](https://cli.github.com/manual/)
- [Semantic Versioning Spec](https://semver.org/)
- [SPARC methodology skill](../sparc-methodology/SKILL.md)
- [Swarm coordination patterns skill](../swarm-advanced/SKILL.md)

### Related Skills
- **github-pr-management**: PR review and merge automation
- **github-workflow-automation**: CI/CD workflow orchestration
- **multi-repo-coordination**: Cross-repository synchronization
- **deployment-orchestration**: Advanced deployment strategies

### Support & Community
- Issues: https://github.com/ruvnet/claude-flow/issues
- Discussions: https://github.com/ruvnet/claude-flow/discussions
- Documentation: https://claude-flow.dev/docs

---

## Appendix: Release Checklist Template

### Pre-Release Checklist
- [ ] Version numbers updated across all packages
- [ ] Changelog generated and reviewed
- [ ] Breaking changes documented with migration guide
- [ ] All tests passing (unit, integration, e2e)
- [ ] Security scan completed with no critical issues
- [ ] Performance benchmarks within acceptable range
- [ ] Documentation updated (API docs, README, examples)
- [ ] Release notes drafted and reviewed
- [ ] Stakeholders notified of upcoming release
- [ ] Deployment plan reviewed and approved

### Release Checklist
- [ ] Release branch created and validated
- [ ] CI/CD pipeline completed successfully
- [ ] Artifacts built and verified
- [ ] GitHub release created with proper notes
- [ ] Packages published to registries
- [ ] Docker images pushed to container registry
- [ ] Deployment to staging successful
- [ ] Smoke tests passing in staging
- [ ] Production deployment completed
- [ ] Health checks passing

### Post-Release Checklist
- [ ] Release announcement published
- [ ] Monitoring dashboards reviewed
- [ ] Error rates within normal range
- [ ] Performance metrics stable
- [ ] User feedback collected
- [ ] Documentation links verified
- [ ] Release retrospective scheduled
- [ ] Next release planning initiated

---

**Version**: 2.0.0
**Last Updated**: 2025-10-19
**Maintained By**: Claude Flow Team
