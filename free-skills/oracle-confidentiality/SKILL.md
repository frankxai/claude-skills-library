# Oracle Confidentiality Guardian

> **Purpose:** Enforce confidentiality protocol across all Oracle AI Architect deliverables.
> **Scope:** Pre-delivery audit, codename enforcement, content sanitization.
> **Authority:** This skill has VETO power. If it fails, delivery is blocked.

## When to Use This Skill

Invoke:
- Before delivering ANY document to a customer
- Before committing client-folder content to git
- When generating content that references customer context
- As the final step of /oracle-solution-design Phase 5

**Trigger:** `/oracle-confidentiality` or automatically at end of solution design workflow

---

## The Codename Protocol

### Rules (Non-Negotiable)

1. **Codenames are OPAQUE** -- A, B, E, K, O, P, R, V have no inherent meaning
2. **Never persist context** -- Industry, scope, employee count, revenue NEVER in committed files
3. **Conversation-only context** -- Tell Claude what the codename means at session start, it stays in memory only
4. **README.md is the only committable file** per client -- contains ONLY: status, role, codename
5. **clients/.gitignore blocks:** deliverables/, notes/, docs/, SOLUTION-DESIGN.md, auto-CLAUDE.md
6. **Research goes to research/topics/** -- NEVER to research/projects/[CODE]/ (would link codename to topic)

### What CAN Be in Committed Files
- Codename letter only (A, B, K, etc.)
- Status (Active, Prospect, Completed)
- Role (AI/Cloud Architecture)
- Generic dates and milestones

### What MUST NEVER Be in Committed Files
- Real customer name
- Industry vertical
- Geographic region or country
- Employee count or revenue
- Contract value or pricing
- Specific technology stack of the customer
- Names of customer employees
- Internal Oracle pricing or discounts

---

## Pre-Delivery Audit Checklist

Run this checklist before any deliverable leaves the workspace:

### Step 1: Content Scan
```
Search all output files for:
- Real customer names (from conversation context)
- Industry-specific terms that could identify the client
- Geographic identifiers tied to the client
- Internal Oracle pricing not on public price list
- Competitor names used in attack mode (not just comparison)
```

### Step 2: File Location Check
```
Verify:
- Deliverables are in clients/[CODE]/deliverables/ (gitignored)
- SOLUTION-DESIGN.md is in clients/[CODE]/ (gitignored)
- No deliverables leaked to research/ or projects/ folders
- No codename appears in research/topics/ filenames
```

### Step 3: Git Safety Check
```
Before any commit:
- Run: git diff --cached -- check no client content staged
- Run: git status -- verify clients/ content is untracked
- Verify clients/.gitignore is intact and blocking deliverables
```

### Step 4: Image Compliance
```
For every generated image:
- No Oracle logos (text labels only)
- No customer logos
- No identifiable customer branding or colors
- Service names match official Oracle branding
```

### Step 5: Document Sanitization
```
In every document:
- Customer referred to as "the organization" or "the customer"
- Solution name is generic or codename-based
- All data examples use synthetic/mock data
- No internal meeting notes or email quotes
```

---

## Automated Checks (for Agent Execution)

When invoked, the agent should execute these checks:

1. **Grep for known risks:**
   - Grep output files for any real names mentioned in conversation
   - Grep for currency amounts (could indicate contract values)
   - Grep for specific addresses or locations

2. **Verify .gitignore integrity:**
   - Read clients/.gitignore
   - Confirm it blocks: deliverables/, notes/, docs/, SOLUTION-DESIGN.md

3. **Check git status:**
   - Ensure no client deliverables are staged or tracked
   - Warn if any new files in clients/ are untracked but not gitignored

4. **Report:**
   - PASS: All checks passed, safe to deliver
   - FAIL: List specific violations with line numbers and file paths
   - WARN: Potential issues that need human review

---

## Emergency Protocol

If confidential data is accidentally committed:

1. DO NOT push
2. Soft reset: git reset HEAD~1 (undo last commit, keep files)
3. Remove sensitive content from files
4. Re-commit with clean content
5. If already pushed: Contact user immediately, may need force push (with user approval)

---

## Integration

This skill is called by:
- /oracle-solution-design (Phase 5: DELIVER)
- Any manual invocation before delivery
- Should be invoked proactively by Claude when generating client-facing content

---

*Version: 1.0 | Created: 2026-02-09*
