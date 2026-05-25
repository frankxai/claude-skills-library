---
name: book-publishing
description: ACOS book publishing intelligence for multi-book content, voice, and production workflows.
---

# ACOS Book Publishing Skill v1.0

## Purpose

Intelligence layer for FrankX's 6-book publishing platform. Provides AI agents with complete book DNA — voice, research context, visual identity, and writing style for each book line. Any agent loading this skill can produce content indistinguishable from Frank's authored work.

## Activation

Auto-activates when session involves: book writing, chapter drafting, book cover generation, PDF/EPUB creation, library reviews, or any `/books/` route work.

**Triggers**: `book`, `chapter`, `poetry`, `spartan`, `self-development`, `imagination`, `manifestation`, `golden-age`, `library`, `review`, `cover image`, `pdf generation`, `epub`

---

## Book Registry (6 Books)

### 1. Love & Poetry

- **Slug**: `love-and-poetry`
- **Subtitle**: Verses That Move the Soul
- **Status**: Published
- **Theme**: Rose/Gold on dark (#0a0a0f)
- **Fonts**: Serif headings + serif body (Playfair Display)
- **Voice**: Atmospheric, flowing, tender yet profound. Long sentences that breathe. Metaphor-heavy. No sentimentality — raw emotional truth.
- **Research Sources**: Rumi (13th century Sufi poetry), Rilke (Letters to a Young Poet, Duino Elegies), Goethe (West-Eastern Divan), Erich Fried (Es ist was es ist), Kahlil Gibran (The Prophet), Paulo Coelho, Saint-Exupery, Thich Nhat Hanh, Vietnamese folk poetry traditions
- **Languages**: English primary, German poems in original + translation, Vietnamese poems in original + translation
- **Visual Identity**: Rose-gold particles, glass petals, constellation hearts, quill pen motifs, cherry blossom elements
- **Cover**: `/images/books/love-and-poetry-cover.png`
- **Content Dir**: `content/books/love-and-poetry/`
- **Chapters**: 5 (Rumi Speaks, Dichter der Liebe, Nha Tho Tinh Yeu, Wisdom of Ages, A Poem for You)
- **Writing Rules**:
  - Poetry chapters use centered text with line breaks preserved
  - Prose sections use flowing paragraphs, not bullet points
  - Each poem gets attribution with poet name and era
  - Original poems in Chapter 5 must match quality bar of curated poets
  - NO emoji, NO hashtags, NO social media tone

### 2. Spartan Mindset

- **Slug**: `spartan-mindset`
- **Subtitle**: The Discipline of One More
- **Status**: In Progress
- **Theme**: Red/Stone on dark (#030712)
- **Fonts**: Sans headings + sans body (Inter bold)
- **Voice**: Direct, commanding, zero fluff. Short declarative sentences. Imperative mood. Every paragraph earns its place through actionable truth. Think Marcus Aurelius meets David Goggins.
- **Research Sources**: Plutarch (Spartan society, Lycurgus), Steven Pressfield (Gates of Fire, The War of Art), David Goggins (Can't Hurt Me), Jocko Willink (Extreme Ownership), Arnold Schwarzenegger (Total Recall), Marcus Aurelius (Meditations), Miyamoto Musashi (Book of Five Rings), modern exercise science (periodization, progressive overload, neuroplasticity)
- **Visual Identity**: Chrome Spartan helmet, blood-red accents, barbell silhouettes, gunmetal textures, geometric discipline patterns
- **Cover**: `/images/books/spartan-mindset-cover.png`
- **Content Dir**: `content/books/spartan-mindset/`
- **Chapters**: 5 (The Spartan Code, Iron Discipline, One More Rep, The Forge, Mind Over Matter)
- **Writing Rules**:
  - Paragraphs max 4 sentences
  - Use training metaphors (reps, sets, forge, iron)
  - Include concrete exercises/protocols (not vague advice)
  - Each chapter ends with a "The Standard" section — a non-negotiable takeaway
  - NO spiritual language, NO manifestation talk, NO "vibes"
  - Epigraphs from warriors, athletes, stoics

### 3. The Golden Age of Creators

- **Slug**: `golden-age`
- **Subtitle**: The Democratization of Creative Capability and Distribution
- **Status**: Published
- **Theme**: Amber/Indigo on dark (#0F172A)
- **Fonts**: Serif headings + sans body
- **Voice**: Visionary and warm. Long-form narrative journalism meets personal essay. Data-backed optimism. Specific creator economy statistics woven with philosophical reflection. Hopeful without being naive.
- **Research Sources**: Creator Economy reports (Goldman Sachs $250B valuation), SignalFire Creator Report, a16z Future of Creative Work, Li Jin (passion economy), Naval Ravikant (leverage), Kevin Kelly (1000 True Fans), historical creator movements (Renaissance patronage, printing press, radio, YouTube revolution)
- **Visual Identity**: Warm amber glow, indigo depths, sunrise/dawn metaphors, constellation patterns, golden ratio spirals
- **Cover**: `/images/golden-age/hero-golden-age.png`
- **Content Dir**: `content/golden-age-book/`
- **Chapters**: 3 published (When Creation Calls, The Orchestration Age, The First Gesture)
- **Writing Rules**:
  - Each chapter blends personal narrative + industry data + philosophical insight
  - Include real statistics with sources
  - Reference specific creators and platforms (not generic)
  - Chapter structure: opening anecdote → thesis → evidence → reflection → call to action
  - Maintain dual voice: technical authority + creative warmth

### 4. The Art of Self-Development

- **Slug**: `self-development`
- **Subtitle**: Seven Pillars of a Complete Life
- **Status**: In Progress
- **Theme**: Emerald/Cyan on dark (#030f0a)
- **Fonts**: Sans headings + sans body
- **Voice**: Grounded and systematic. Like a wise mentor who has done the work and now shares the framework. No self-help platitudes — specific routines, numbers, protocols. Confident authority without arrogance.
- **Research Sources**: James Clear (Atomic Habits), Cal Newport (Deep Work, So Good They Can't Ignore You), Ray Dalio (Principles), Naval Ravikant (Almanack), Seneca (Letters from a Stoic), Benjamin Franklin (Autobiography — 13 virtues), Nassim Taleb (Antifragile), Charlie Munger (mental models), Andrew Huberman (neuroscience protocols), modern sleep/nutrition science
- **Visual Identity**: Seven emerald pillars, cyan energy connections, crystal structures, obsidian reflective surfaces, geometric precision
- **Cover**: `/images/books/self-development-cover.png`
- **Content Dir**: `content/books/self-development/`
- **Chapters**: 7 (Energy, Mind, Soul, Craft, Capital, Circle, Legacy)
- **Writing Rules**:
  - Each chapter = one pillar, standalone but interconnected
  - Include specific protocols (e.g., "4-7-8 breathing", "2-minute rule")
  - Reference research with specificity (study names, percentages)
  - Structure: opening metaphor → framework → protocol → integration → closing reflection
  - Use numbered lists sparingly for actual step sequences
  - NO vague advice like "be present" without concrete how-to

### 5. Imagination

- **Slug**: `imagination`
- **Subtitle**: Unlocking the Power of the Mind
- **Status**: In Progress
- **Theme**: Violet/Cyan on dark (#0a0a12)
- **Fonts**: Serif headings + sans body
- **Voice**: Dreamy yet intellectual. Einstein's thought experiments meets Oliver Sacks' neuroscience storytelling. Expansive paragraphs that unfold like mental landscapes. Wonder as a thinking tool, not decoration.
- **Research Sources**: Albert Einstein (thought experiments, "Imagination is more important than knowledge"), Oliver Sacks (The Man Who Mistook His Wife for a Hat), Daniel Kahneman (Thinking Fast and Slow), Edward de Bono (lateral thinking), Charlie Munger (mental models), Mihaly Csikszentmihalyi (Flow), neuroscience of mental imagery (Kosslyn's work), Chicago basketball free-throw visualization study, Tesla's mental engineering
- **Visual Identity**: Glass/crystal brain, violet neural pathways, fractal thought waves, inner galaxies, bioluminescent accents
- **Cover**: `/images/books/imagination-cover.png`
- **Content Dir**: `content/books/imagination/`
- **Chapters**: 5 (The Inner Theater, Creative Visualization, Mental Models, The Architect's Eye, Beyond the Visible)
- **Writing Rules**:
  - Open each chapter with a vivid mental image or thought experiment
  - Alternate between scientific evidence and philosophical reflection
  - Include practical exercises labeled "Mental Workshop"
  - Metaphors from architecture, theater, and optics
  - Let paragraphs breathe — this is not an airport business book
  - NO self-help cliches, NO "unlock your potential"

### 6. Manifestation

- **Slug**: `manifestation`
- **Subtitle**: The Architecture of Reality
- **Status**: In Progress
- **Theme**: Gold/Purple on dark (#0f0a05)
- **Fonts**: Serif headings + sans body
- **Voice**: Magnetic and confident. Grounded psychology, not magical thinking. Reframes "law of attraction" through neuroscience (RAS, expectation effect), psychology (identity theory, cognitive behavioral patterns), and strategic action. Respects the reader's intelligence.
- **Research Sources**: Reticular Activating System (neuroscience), Dr. Alia Crum (expectation effect, Stanford), Carol Dweck (Mindset), Viktor Frankl (Man's Search for Meaning), Napoleon Hill (Think and Grow Rich — psychology analysis), cognitive behavioral therapy frameworks, James Clear (identity-based habits), Pareto Principle, modern goal-setting research
- **Visual Identity**: Golden key, liquid gold chrome, sacred geometry (Flower of Life), concentric golden rings, purple energy wisps, obsidian mirrors
- **Cover**: `/images/books/manifestation-cover.png`
- **Content Dir**: `content/books/manifestation/`
- **Chapters**: 5 (Architecture of Reality, Thought as Blueprint, The Frequency Principle, Aligned Action, The Evidence Journal)
- **Writing Rules**:
  - Always ground claims in psychology/neuroscience before philosophical expansion
  - Structure: myth-busting opener → scientific basis → framework → practice → integration
  - The Evidence Journal (Ch5) is an interactive exercise chapter
  - Reference "The Secret" only to improve upon it with scientific rigor
  - NO "the universe will provide" without "here's the mechanism"
  - NO spiritual bypassing — acknowledge that action is non-negotiable
  - Use "architect" and "blueprint" metaphors throughout (consistent with subtitle)

---

## Cross-Book Standards

### Typography

| Context        | Font                     | Weight |
| -------------- | ------------------------ | ------ |
| Serif headings | Playfair Display         | 700    |
| Sans headings  | Inter                    | 700    |
| Serif body     | Lora or Playfair Display | 400    |
| Sans body      | Inter                    | 400    |
| Code/data      | JetBrains Mono           | 400    |

### Color System

| Book             | Primary       | Accent       | Background |
| ---------------- | ------------- | ------------ | ---------- |
| Love & Poetry    | `rose-500`    | `amber-400`  | `#0a0a0f`  |
| Spartan Mindset  | `red-600`     | `stone-400`  | `#030712`  |
| Golden Age       | `amber-500`   | `indigo-400` | `#0F172A`  |
| Self-Development | `emerald-500` | `cyan-400`   | `#030f0a`  |
| Imagination      | `violet-500`  | `cyan-400`   | `#0a0a12`  |
| Manifestation    | `amber-400`   | `purple-500` | `#0f0a05`  |

### Writing Universal Rules

1. **No emoji** in any book content
2. **No hashtags** or social media formatting
3. **No AI-sounding phrases**: "delve into", "it's important to note", "in conclusion"
4. **Frank's voice markers**: Direct but warm. Lead with insight, not preamble. Specific over general. Results over theory.
5. **Epigraphs**: Every chapter can have an opening quote — must be real, attributed, verifiable
6. **Word count**: Chapters target 2,000-3,000 words (8-15 min read)
7. **Markdown format**: H1 for title, H2 for sections, H3 for subsections, blockquotes for quotes
8. **Image refs**: Use relative paths `/images/books/{slug}/` for chapter images

### Quality Gate

Before any book content is published:

- [ ] Voice matches book profile (re-read 2 paragraphs of existing chapters)
- [ ] No AI-pattern language detected
- [ ] Specific claims have cited sources or verifiable references
- [ ] Chapter structure follows the book's pattern
- [ ] Epigraph is real and attributed
- [ ] Reading time estimate is within 8-15 minutes
- [ ] Markdown renders correctly in BookReader component

---

## ACOS Integration

### Skill Auto-Activation Rules

```json
{
  "book-publishing": {
    "triggers": [
      "book",
      "chapter",
      "poetry",
      "spartan",
      "self-development",
      "imagination",
      "manifestation",
      "golden-age",
      "library",
      "review",
      "cover",
      "pdf",
      "epub"
    ],
    "priority": "high",
    "profile": "content-architect",
    "auto_load": true
  }
}
```

### Agent Profiles for Book Work

| Agent               | Book Work Scope                                      |
| ------------------- | ---------------------------------------------------- |
| `content-architect` | Chapter writing, book structure, voice consistency   |
| `seo-intelligence`  | Book/library SEO, JSON-LD schemas, meta optimization |
| `frontend-designer` | BookReader UI, cover display, theme components       |
| `devops-engineer`   | PDF pipeline, EPUB generation, Vercel Blob uploads   |

### Hook Integration

- **PreToolUse:Write** — When writing to `content/books/`, validate against book voice profile
- **PostToolUse:Write** — After chapter creation, update reading time estimate in registry
- **Stop** — Log book content changes to trajectory system for learning

### File Watchers

| Path Pattern                   | Action                                        |
| ------------------------------ | --------------------------------------------- |
| `content/books/*/chapter-*.md` | Validate voice, update registry               |
| `public/images/books/*`        | Verify image dimensions (848x1264 for covers) |
| `app/books/**/*.tsx`           | Run TypeScript check on book components       |
| `data/book-reviews.ts`         | Validate review schema completeness           |

---

## PDF/EPUB Pipeline

### PDF Generation

- **Tool**: Puppeteer (extends `scripts/generate-and-upload-pdfs.mjs`)
- **Format**: 6x9" trade paperback (432pt x 648pt)
- **Templates**: `public/pdf-templates/books/{slug}.html`
- **Per-book**: Each book gets themed template matching its colors
- **Output**: Vercel Blob storage via existing upload pipeline

### EPUB Generation

- **Tool**: `epub-gen-memory` npm package
- **Metadata**: ISBN placeholder, author, description, cover image
- **Chapters**: Ordered by chapter number from registry
- **Output**: Vercel Blob alongside PDF

### Generation Command

```bash
# Generate all book PDFs
node scripts/generate-book-pdfs.mjs

# Generate single book
node scripts/generate-book-pdfs.mjs --book spartan-mindset

# Generate EPUBs
node scripts/generate-book-epubs.mjs
```

---

## Library Integration

### Book Reviews (`/library/`)

- **Data**: `data/book-reviews.ts` — 8 reviews with cross-references to our books
- **Schema**: Title, author, rating (1-5), key insights, best-for tags, related book slug
- **Cross-sell**: Each review links to "Our book on this topic" via `relatedBook` field

### Review Voice

Reviews follow FrankX blog voice: concise, opinionated, actionable insights over summary. Each review answers "What changed after reading this?" not "What is this book about?"

---

## Content Generation Workflow

### Writing a New Chapter

1. Load this skill (auto or manual)
2. Read 2 existing chapters from the same book for voice calibration
3. Check the book's research sources for relevant material
4. Write the chapter following the book-specific structure pattern
5. Run through quality gate checklist
6. Save to `content/books/{slug}/chapter-{nn}-{title-slug}.md`
7. Update `books-registry.ts` with the new chapter entry

### Creating a Book Review

1. Load this skill
2. Read the actual book (or comprehensive summary + key passages)
3. Identify 5 key insights that changed thinking/behavior
4. Write review following FrankX voice (NOT summary, YES transformation)
5. Map to `relatedBook` from our 6-book catalog
6. Add to `data/book-reviews.ts`

### Generating Cover Images

1. Load this skill for the book's visual identity section
2. Use Nano Banana MCP with `pro` model, `2:3` aspect, `high` resolution
3. Negative prompt ALWAYS includes: `clay, claymorphic, pastel, cartoon, cute, childish`
4. Save to `public/images/books/{slug}-cover.png`
5. Verify dimensions: 848x1264 (2:3 at high resolution)
