# Content Patterns & Style Guide

## Newsletter Voice (Frank's Voice)

### Core Principles

1. **Lead with Impact**: Start with "Why this matters for AI Architects"
2. **No Hype**: Precise technical language, factual analysis
3. **Actionable**: Every story includes "What you can do" section
4. **Code over Prose**: Show implementations, not just concepts
5. **Humble Expertise**: Confident analysis without guru language

### Tone Characteristics

- **Studio energy at 2am** - Focused, building, in the zone
- **Builder-to-builder** - Peer communication, not lecturing
- **Results over philosophy** - Practical outcomes first
- **Specific numbers** - "35% faster" not "significantly faster"

### Language Rules

**DO:**
- Use precise technical terms
- Include code examples
- Reference specific versions/releases
- Cite actual performance numbers
- Link to official documentation

**DON'T:**
- Spiritual/guru language
- Grandiose claims ("revolutionary", "game-changing")
- Marketing copy tone
- Over-explain fundamentals
- Use emojis (except in code/data context)

## Newsletter Templates

### Weekly Newsletter Structure

```markdown
# AI Architect Weekly - Issue #N
**Date**: YYYY-MM-DD | **Reading Time**: ~15-20 min

---

## Editor's Note

[Frank's perspective - 2-3 sentences on the week's theme]

---

## Top Stories

### 1. [Headline - Lead with impact]

**Why This Matters**: [1-2 sentences on architectural implications]

[Main content - 150-200 words]
- Technical details
- Code examples if applicable
- Performance/scale implications

**What You Can Do**:
- [Actionable step 1]
- [Actionable step 2]

**Read More**: [Official link]

---

[Repeat for stories 2-5]

---

## Deep Dive: [Technical Topic]

[1500-2000 word technical article]

### Problem Statement
[What challenge are we solving?]

### Architecture Overview
[High-level design]

### Implementation
```code
[Working code examples]
```

### Production Considerations
- [Scale]
- [Performance]
- [Cost]
- [Monitoring]

### Key Takeaways
- [Takeaway 1]
- [Takeaway 2]
- [Takeaway 3]

---

## Research Spotlight

**From FrankX Research Hub**: [Recent finding]

[100-150 words connecting research to this week's news]

**Full Research**: [Link to /research output]

---

## Tools Worth Watching

### [Tool 1]
**Quick Take**: [1-2 sentences]
**Use Case**: [Specific architectural application]
**Link**: [GitHub/Product]

[Repeat for 3-4 tools]

---

## Archive & Connect

- **Previous Issues**: [Link]
- **X / Twitter**: @frankxai
- **LinkedIn**: [Link]
- **GitHub**: frankxai

---

**About**: AI Architect Newsletter delivers weekly intelligence for builders who architect AI systems. No hype. Just actionable insights.

[Unsubscribe] | [Update Preferences]
```

### Daily Brief Structure

```markdown
# AI Architect Daily Brief
**Date**: YYYY-MM-DD | **Reading Time**: ~5 min

## Top 3 Today

### 1. [Headline]
[100-150 words with key details]
**Link**: [Source]

### 2. [Headline]
[100-150 words]
**Link**: [Source]

### 3. [Headline]
[100-150 words]
**Link**: [Source]

## Tools to Watch
- **[Tool]**: [One sentence] - [Link]

---
**Tomorrow**: [Preview of next brief]
```

## Story Types & Patterns

### Model Release Story

**Template**:
```
**[Lab] Releases [Model Name]**

**Why This Matters**: [Architecture implications - benchmarks vs GPT-4/Claude/etc]

**Key Features**:
- [Feature 1 with numbers]
- [Feature 2 with API changes]
- [Feature 3 with cost/performance]

**Production Implications**:
- [Migration path if applicable]
- [Cost comparison]
- [When to use vs alternatives]

**What You Can Do**:
- Try it: [Playground/API link]
- Compare: [Benchmark link]
- Migrate: [Migration guide if applicable]

**Official Announcement**: [Link]
```

### Research Paper Story

**Template**:
```
**New Research: [Paper Title]**

**Why This Matters**: [Practical application for production systems]

**Core Innovation**: [Main contribution in 1-2 sentences]

**Key Results**:
- [Metric 1 with baseline comparison]
- [Metric 2 with significance]

**Code Available**: [Yes/No - GitHub link if yes]

**Production Ready**: [Assessment: Research/PoC/Production]

**What You Can Do**:
- Read: [arXiv link]
- Try: [Code/demo if available]
- Apply: [Specific use case]
```

### Tool Launch Story

**Template**:
```
**[Tool Name]: [One-line description]**

**Why This Matters**: [Specific problem it solves]

**How It Works**: [Technical overview - 2-3 sentences]

**Quick Start**:
```code
[Installation + basic usage]
```

**vs Alternatives**:
- [Comparison point 1]
- [Comparison point 2]

**When to Use**:
- [Use case 1]
- [Use case 2]

**Links**:
- GitHub: [Link]
- Docs: [Link]
- Examples: [Link]
```

## Section-Specific Guidelines

### Editor's Note
- 2-3 sentences max
- Week's theme or meta-observation
- Frank's personal take, not generic intro
- Connect disparate stories if possible

### "Why This Matters" Sections
- Lead with architectural impact
- Compare to current state of art
- Explain implications for production systems
- Avoid hype, focus on trade-offs

### "What You Can Do" Sections
- Specific, actionable steps
- Include links to try/test/implement
- Prioritize quick wins
- Mention prerequisites if any

### Code Examples
- Must be runnable
- Include version requirements
- Show output/results
- Explain non-obvious parts

### Deep Dive Articles
- Start with problem statement
- Show architecture before code
- Include production considerations
- End with concrete takeaways

## Visual Content Guidelines

### Images
- Dark theme preferred
- High contrast for readability
- Annotated diagrams
- No stock photos/clipart

### Code Blocks
- Syntax highlighting
- Line numbers for reference
- Comments for complex logic
- Link to full code if truncated

### Architecture Diagrams
- Follow C4 model if applicable
- Label components clearly
- Show data flow
- Include scale indicators

## Quality Standards

### Before Publishing
- [ ] All links functional
- [ ] Code examples tested
- [ ] Claims sourced
- [ ] Numbers verified
- [ ] Spell check passed
- [ ] Reading time accurate
- [ ] Mobile-friendly
- [ ] Email client tested

### Story Selection Criteria
**Include if:**
- Architecturally significant
- Production-ready or near-term
- Code/benchmark available
- Solves real problems

**Exclude if:**
- Vaporware announcement
- Incremental minor update
- No practical application
- Hype without substance

---

**Last Updated**: 2026-02-16
**Maintained By**: AI Architect Newsletter System
