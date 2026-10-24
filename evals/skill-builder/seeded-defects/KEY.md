# Answer key: skill-builder seeded-defects

Never staged into a run (scripts/eval-skill.mjs NEVER_STAGED).

1. **name-format** (spec): the frontmatter `name: Deploy_Helper`, which is not lowercase-and-hyphens and does not match the folder name `deploy-helper` → fix: renaming it to `deploy-helper`
2. **first-person-description** (routing): the `description` written in the first person ('I am your friendly deployment companion ... I help you') → fix: rewriting it in the third person, stating what the skill does
3. **no-trigger-cue** (routing): the `description` lacking a clear statement of when to use the skill (specific trigger situations or keywords), so the agent cannot tell when to load it → fix: adding a concise 'Use when ...' clause with concrete triggers, near the start
4. **description-too-long** (spec): the `description` exceeding the 1,024-character limit → fix: cutting it to a short what-plus-when sentence or two under 1,024 characters
5. **missing-reference** (integrity): the body pointing to `references/rollback.md`, a file that does not exist in the skill folder → fix: adding the file or removing the reference
6. **hardcoded-token** (security): the hard-coded `VERCEL_TOKEN=vcp_...` value in the body → fix: removing it, reading the token from the environment or a secret store, and rotating the exposed token
7. **multiple-workflows** (design): the skill mixing three unrelated jobs (deploying, nightly database backups and Slack standup summaries) instead of one focused workflow → fix: splitting it into separate skills, each with one job
8. **windows-path-and-dated-claim** (portability): the Windows-style path `scripts\deploy.sh` (breaks on macOS and Linux) or the time-sensitive claim about a flag 'added last week' → fix: using forward-slash paths (`scripts/deploy.sh`) and removing or dating time-sensitive statements
