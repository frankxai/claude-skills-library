# Content Strategy Skill

> Strategic content planning with pillar mapping, editorial calendars, and SEO optimization.

## Purpose

Transform chaotic content creation into a systematic, strategic operation. This skill helps you plan, organize, and execute content that serves both your audience and your business goals.

## Content Pillar Framework

### The Four Pillars

```
┌──────────────────────────────────────────────────────────────┐
│                     CONTENT STRATEGY                          │
├────────────────┬────────────────┬────────────────┬───────────┤
│   Educational  │   Thought      │    Product     │ Community │
│                │   Leadership   │                │           │
├────────────────┼────────────────┼────────────────┼───────────┤
│ Tutorials      │ Vision pieces  │ Announcements  │ Interviews│
│ How-tos        │ Industry takes │ Case studies   │ Showcases │
│ Guides         │ Predictions    │ Feature demos  │ Roundups  │
│ Walkthroughs   │ Analysis       │ Comparisons    │ Q&As      │
├────────────────┼────────────────┼────────────────┼───────────┤
│ 2x/week        │ 1x/week        │ 1x/week        │ 1x/week   │
└────────────────┴────────────────┴────────────────┴───────────┘
```

### Pillar Definitions

**Educational (40%)**
- Teach actionable skills
- Show step-by-step processes
- Build trust through value
- Target: People learning your craft

**Thought Leadership (25%)**
- Share unique perspectives
- Make predictions
- Challenge conventions
- Target: Peers and industry watchers

**Product (20%)**
- Showcase capabilities
- Demonstrate results
- Social proof
- Target: Potential customers

**Community (15%)**
- Highlight user success
- Build belonging
- Create conversation
- Target: Existing community

## Content Calendar System

### Weekly Planning Template

```markdown
## Week of [DATE]

### Monday - Educational
- [ ] Title: "How to [Skill]"
- [ ] Status: Draft | Review | Published
- [ ] Pillar: Educational
- [ ] Keywords: [primary], [secondary]

### Wednesday - Thought Leadership
- [ ] Title: "Why [Take]"
- [ ] Status: Draft | Review | Published
- [ ] Pillar: Thought Leadership

### Friday - Product/Community
- [ ] Title: "[Feature] or [Interview]"
- [ ] Status: Draft | Review | Published
- [ ] Pillar: Product | Community
```

### Status Workflow

```
Idea → Planned → In Progress → Review → Published → Archived
  │       │           │          │          │
  └───────┴───────────┴──────────┴──────────┴── Feedback Loop
```

## SEO Integration

### Keyword Research Framework

1. **Seed Keywords**: Core topics you own
2. **Long-tail Expansion**: Specific questions people ask
3. **Competitor Gap**: What others rank for that you don't
4. **Trending Topics**: Rising searches in your niche

### On-Page Optimization Checklist

```markdown
- [ ] Primary keyword in title (front-loaded)
- [ ] H1 matches title, includes keyword
- [ ] Keyword in first 100 words
- [ ] 3-5 H2s with related keywords
- [ ] Internal links to 3+ related posts
- [ ] External links to 1-2 authoritative sources
- [ ] Meta description (150-160 chars) with keyword
- [ ] Alt text on all images
- [ ] FAQ section with schema markup
```

## Content Audit Process

### Step 1: Inventory
```sql
-- Conceptual query for content inventory
SELECT
  title,
  publish_date,
  pillar,
  word_count,
  page_views,
  time_on_page,
  backlinks
FROM content
WHERE status = 'published'
ORDER BY page_views DESC;
```

### Step 2: Categorize
- **Update**: High potential, outdated content
- **Merge**: Similar topics, consolidate
- **Prune**: Low value, remove or redirect
- **Expand**: Thin content, add depth

### Step 3: Action Plan
```markdown
| Content | Action | Priority | New Target |
|---------|--------|----------|------------|
| Post A  | Update | High     | Keyword X  |
| Post B  | Merge  | Medium   | Post A     |
| Post C  | Prune  | Low      | Redirect   |
```

## Commands

| Command | Description |
|---------|-------------|
| `/content-strategy` | Run full strategy workflow |
| `/content-calendar` | Manage editorial calendar |
| `/content-audit` | Analyze existing content |

## Integration with Other Skills

- **publishing-factory**: Execute the publishing pipeline
- **daily-ops**: Include content in daily routines
- **frankx-brand**: Maintain voice consistency
- **creator-intelligence**: Track across projects

## Templates

### Blog Post Brief

```markdown
# [Title]

**Pillar**: Educational | Thought Leadership | Product | Community
**Target Keyword**: [keyword]
**Target Length**: [words]
**Publish Date**: [date]

## Outline
1. Hook - Why this matters
2. Problem - What readers face
3. Solution - Your approach
4. Implementation - Steps
5. Results - What to expect
6. CTA - Next action

## Research
- [Source 1]
- [Source 2]

## Internal Links
- Related Post A
- Related Post B
```

### Social Distribution

```markdown
## Distribution Plan

### LinkedIn
- Post excerpt with hook
- 3-5 relevant hashtags
- Ask a question to drive comments

### Twitter/X
- Thread with key points
- Quote notable insights
- Tag relevant people

### Newsletter
- Brief summary
- Why it matters to readers
- Direct link to full post
```

---

*Part of [Agentic Creator OS](https://github.com/frankxai/agentic-creator-os)*
