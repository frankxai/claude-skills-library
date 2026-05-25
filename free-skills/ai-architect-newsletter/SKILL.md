---
name: "AI Architect Newsletter"
description: "Generate high-quality AI Architect newsletters with latest AI news, research integration, and visual design. Use when creating newsletters, researching AI developments, synthesizing AI news for architects, or distributing intelligence reports. Covers AI model releases, research papers, tool launches, architecture patterns, production systems, and enterprise AI trends. Integrates with FrankX research hub and supports both daily briefs and weekly deep-dives."
---

# AI Architect Newsletter

## Purpose

Automated intelligence newsletter generation for AI Architects, combining latest AI news, FrankX research hub insights, and visual storytelling into production-ready HTML/text newsletters.

## When to Use

- `/ai-architect-newsletter` - Generate weekly newsletter
- `/ai-architect-newsletter daily` - Quick daily brief
- `/ai-architect-newsletter [topic]` - Deep dive on specific topic
- `/ai-architect-newsletter status` - Review recent newsletters

## Quick Start

### Generate Weekly Newsletter

```bash
# Basic invocation (uses Opus 4.6 recommended)
/ai-architect-newsletter

# The system will:
# 1. Gather latest AI news (WebSearch)
# 2. Pull relevant research from /research hub
# 3. Generate visual newsletter (HTML + text)
# 4. Save to content/newsletters/YYYY-MM-DD-newsletter.html
# 5. Display summary with preview link
```

## Newsletter Structure

### 1. Header Section
- Custom header image (AI Architect theme)
- Issue number, date, edition type
- Editor's note with Frank's perspective

### 2. Top Stories (5 key developments)
Each story includes:
- Headline with impact level
- "Why This Matters for AI Architects" analysis
- Visual asset (embedded or linked)
- Technical details or code examples
- Read more link to source

### 3. Deep Dive Section
One technical deep-dive featuring:
- Architecture diagrams
- Code examples
- Implementation patterns
- Production considerations

### 4. Research Spotlight
Highlight from FrankX research hub:
- Recent /research findings
- Cross-referenced with news
- Actionable insights
- Links to full research files

### 5. Tools Worth Watching
3-4 new tools with:
- Quick take (1-2 sentences)
- Use case for AI Architects
- GitHub/product link
- Integration considerations

### 6. Footer
- Newsletter archive link
- Social links (X, LinkedIn, GitHub)
- Unsubscribe/preferences
- Copyright notice

## Intelligence Gathering

### AI News Sources

See [ai-news-sources.md](references/ai-news-sources.md) for complete source list including:

**Model Releases:**
- OpenAI, Anthropic, Google DeepMind, Meta AI
- Cohere, Mistral, Stability AI, Hugging Face

**Research:**
- arXiv (cs.AI, cs.CL, cs.LG)
- Major lab blogs (OpenAI Research, Anthropic Research)
- Conference proceedings (NeurIPS, ICML, ACL)

**Tools & Frameworks:**
- GitHub trending (AI/ML repositories)
- LangChain, LlamaIndex, CrewAI releases
- MCP server ecosystem
- Agent frameworks (AutoGPT, BabyAGI updates)

**Enterprise AI:**
- Gartner AI reports
- Production AI case studies
- MLOps platform updates
- AI infrastructure news

### Research Hub Integration

The skill automatically scans `/research/` directory for:
- Recent intelligence briefs (`/research` command output)
- Topic-specific deep dives
- Tool evaluations
- Pattern discoveries

Cross-references news with research to provide context and depth.

### Visual Asset Strategy

**AI Lab Logos:**
- Store in `assets/branding/labs/`
- OpenAI, Anthropic, Google, Meta, etc.
- Used for story attribution

**Generated Images:**
- Nano Banana MCP for custom header images
- Architecture diagrams via Nano Banana
- AI-themed newsletter headers
- Concept illustrations for complex topics

**Embedding vs Linking:**
- Embed: Logo badges, small icons (<50KB)
- Link: Header images, diagrams, screenshots
- Optimization: All images compressed for email clients

## Newsletter Modes

### Weekly Newsletter (Default)
**Trigger:** `/ai-architect-newsletter`

**Output:**
- 5-7 top stories
- 1 deep dive (1500-2000 words)
- Research spotlight
- Tools section
- ~15-20 min read time

**Recommended Model:** Opus 4.6 (deep synthesis)

### Daily Brief
**Trigger:** `/ai-architect-newsletter daily`

**Output:**
- Top 3 stories
- Quick takes (100-150 words each)
- Notable tools (1-2)
- ~5 min read time

**Recommended Model:** Sonnet 4.5 (faster)

### Topic Deep Dive
**Trigger:** `/ai-architect-newsletter [topic]`

**Examples:**
- `/ai-architect-newsletter agentic systems`
- `/ai-architect-newsletter vision models`
- `/ai-architect-newsletter production RAG`

**Output:**
- Focused on single topic
- Multi-source synthesis
- Code examples and patterns
- Architecture recommendations

**Recommended Model:** Opus 4.6 (depth)

### Status Check
**Trigger:** `/ai-architect-newsletter status`

**Output:**
- List recent newsletters
- Performance stats (if tracking enabled)
- Scheduled newsletters
- Archive links

## Scripts Reference

### gather-ai-news.ts
**Purpose:** Automated news gathering via WebSearch

**Usage:**
```typescript
// Called automatically during newsletter generation
// Or manually: npx tsx scripts/gather-ai-news.ts --mode weekly
```

**Output:** JSON file with structured news data
**Location:** `.claude/skills/ai-architect-newsletter/cache/news-YYYY-MM-DD.json`

See script for configuration options.

### process-research.ts
**Purpose:** Scan and index FrankX research hub

**Usage:**
```typescript
// Scans /research/ directory for relevant content
// Indexes by topic, date, relevance
```

**Output:** Research index JSON
**Cross-reference:** Matches news topics with research findings

### generate-newsletter.ts
**Purpose:** Template engine for HTML/text output

**Usage:**
```typescript
// Processes gathered data into newsletter format
// Applies templates, injects content, optimizes assets
```

**Templates Used:**
- `assets/templates/newsletter.html` - Main HTML template
- `assets/templates/newsletter.txt` - Plain text version
- `assets/templates/social-preview.html` - Social sharing card

### optimize-images.ts
**Purpose:** Image processing and embedding

**Usage:**
```typescript
// Compresses images for email clients
// Converts to base64 for embedding (small images)
// Uploads to CDN and generates links (large images)
```

**Optimization:**
- Resize for email clients (max 600px width)
- Compress JPEG (80% quality)
- PNG optimization via pngquant
- WebP fallbacks for modern clients

## Voice & Style Guidelines

### Frank's Newsletter Voice

See [content-patterns.md](references/content-patterns.md) for complete style guide.

**Key Principles:**
- **Lead with impact**: "Why this matters for AI Architects" first
- **No hype**: Precise technical language, factual analysis
- **Actionable**: Every story includes "What you can do" section
- **Code over prose**: Show implementations, not just concepts
- **Humble expertise**: Confident analysis without guru language

**Tone:**
- Studio energy at 2am (focused, building)
- Builder-to-builder communication
- Results over philosophy
- Specific numbers and examples

**Avoid:**
- Spiritual/guru language
- Grandiose claims ("revolutionary", "game-changing")
- Over-explaining fundamentals
- Marketing copy tone
- Emojis (unless data/code context)

## Output Locations

### FrankX Repository
```
/mnt/c/Users/Frank/FrankX/
├── content/newsletters/
│   ├── YYYY-MM-DD-weekly.html
│   ├── YYYY-MM-DD-weekly.txt
│   └── archive/
└── public/newsletters/
    └── images/
        └── YYYY-MM-DD/
```

### AI Architect Academy Repository
```
/mnt/c/Users/Frank/ai-architect-academy/
├── newsletters/
│   ├── YYYY-MM-DD.html
│   └── archive/
└── assets/newsletter-images/
```

## Multi-Repo Support

**Repo Detection:**
```typescript
// Automatically detects current repo
const isAcademy = process.cwd().includes('ai-architect-academy');
const outputPath = isAcademy
  ? 'newsletters/'
  : 'content/newsletters/';
```

**Cross-Repo Syncing:**
- Newsletter generated in FrankX can be copied to Academy
- Research hub remains in FrankX only
- Academy uses external research links

## Progressive Disclosure

This SKILL.md provides core workflow. For detailed information:

- **[ai-news-sources.md](references/ai-news-sources.md)** - Complete source list, search patterns, RSS feeds
- **[visual-standards.md](references/visual-standards.md)** - Design guidelines, brand colors, image specs
- **[content-patterns.md](references/content-patterns.md)** - Newsletter structures, voice guide, templates
- **[topic-clusters.md](references/topic-clusters.md)** - AI Architect topic taxonomy, tagging system

## Integration with Existing Commands

**Synergy with /research:**
```bash
# 1. Run research first
/research agentic systems

# 2. Generate newsletter with research integrated
/ai-architect-newsletter

# Research findings automatically included in newsletter
```

**Synergy with /generate-social:**
```bash
# After newsletter generation
/generate-social content/newsletters/YYYY-MM-DD-weekly.html

# Creates X thread + LinkedIn post from newsletter
```

## Quality Checklist

Before sending newsletter:

- [ ] All sources verified and linked
- [ ] Code examples tested
- [ ] Images optimized (<500KB total)
- [ ] HTML renders in major email clients
- [ ] Plain text version readable
- [ ] Links functional
- [ ] Unsubscribe link present
- [ ] Mobile responsive
- [ ] No broken images
- [ ] Spell check passed

## Model Recommendations

**Opus 4.6 (Recommended for quality):**
- Weekly newsletter generation
- Deep dive topics
- Multi-source synthesis
- Complex architecture diagrams

**Sonnet 4.5 (Faster):**
- Daily briefs
- Status checks
- Quick updates
- Research indexing

**When to use each:**
- First newsletter run: Opus 4.6 (establish quality baseline)
- Daily operations: Sonnet 4.5 (speed)
- Important editions: Opus 4.6 (quality)
- Routine updates: Sonnet 4.5 (efficiency)

## Troubleshooting

**Newsletter not generating:**
- Check WebSearch tool availability
- Verify /research directory accessible
- Ensure write permissions to output directory

**Missing images:**
- Verify Nano Banana MCP connection
- Check image optimization script
- Ensure sufficient disk space

**Research not integrated:**
- Run `/research` command first to generate content
- Verify research files in /research/ directory
- Check file permissions

**Multi-repo issues:**
- Verify current working directory
- Check path configurations in scripts
- Ensure both repos accessible

## Future Enhancements

- [ ] Automated scheduling (weekly cron)
- [ ] Email distribution integration (Resend MCP)
- [ ] Analytics tracking (open rates, clicks)
- [ ] A/B testing for subject lines
- [ ] Subscriber segmentation
- [ ] RSS feed generation
- [ ] Archive website

---

**Created:** 2026-02-16
**Status:** Production Ready
**Model:** Works with Sonnet 4.5, Opus 4.6 recommended for quality
**Line Count:** 458 (under 500-line rule ✅)
