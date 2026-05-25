---
name: arcanea-book-cover
description: Design and generate premium book covers using NB2 (Nano Banana 2 / Gemini 3.1 Flash Image) with deep thinking about book tension, emotion, and genre. Pulls from top book cover design principles (Chip Kidd, Peter Mendelsund, Coralie Bickford-Smith). Auto-activates when user requests book cover, cover art, cover design, or mentions generating a cover for a book project.
triggers: book cover, cover art, cover design, book jacket, cover generation, generate cover, book cover art
model: claude-opus-4-6
---

# Arcanea Book Cover Design Skill

Generate premium book covers by thinking deeply about the book first, then translating that thinking into a precision image prompt. NB2 is default. NB Pro only when user specifies "premium" or "hero".

## The 5-Phase Method

Do NOT skip phases. The thinking is the skill. The generation is the reward.

### Phase 1: READ THE BOOK (or its architecture)

Before writing any prompt, you must understand:

1. **Central tension** — What does the protagonist fight against? What internal conflict mirrors the external?
2. **Emotional register** — Is this grief-heavy? Wonder-heavy? Dread-heavy? A dark comedy? Bittersweet? Name it precisely.
3. **Iconic image** — What ONE visual moment defines the book? The image a reader would tattoo on themselves.
4. **Genre expectations vs subversion** — What do readers of this genre expect? What should you give them, and what should you withhold?
5. **Color emotional key** — What color (singular) carries the book's feeling?

If the book has a `book.yaml` or outline, read them. If the book has existing chapters, read at least one opening and one pivotal scene.

### Phase 2: PULL BEST PRACTICES

Top book cover designers operate on these principles. Keep them active during prompt design:

**Chip Kidd's Rules:**
- One idea, one image, one emotion
- The cover is a question, not an answer — it should make readers curious, not satisfied
- Text and image are one unit — typography is 50% of the cover
- Don't illustrate the plot. Illustrate the *feeling*.

**Peter Mendelsund's Rules:**
- Covers are "visual metaphors, not visual illustrations"
- Abstraction > literalism when the book is literary
- The reader should finish the book and look at the cover and think "of course"
- White space is content

**Coralie Bickford-Smith's Rules (Penguin Classics):**
- Pattern + symbol > scene (for literary)
- Limited palette (2-4 colors max)
- Typography must be the hero on pattern-based covers
- Consistency within a series, uniqueness between series

**Genre-specific heuristics:**
| Genre | What sells | What kills |
|-------|-----------|-------------|
| **Dark fantasy / grimdark** | Single figure, cold color + ember accent, imposing silhouette, minimal text | Cluttered action, bright colors, generic fantasy tropes |
| **Literary fantasy** | Symbolic object, atmospheric landscape, negative space, serif typography | Characters' faces, action poses, over-illustration |
| **Epic fantasy mashup** | Dynamic composition, heroic pose, dramatic sky, bold title | Muddy color, too many elements, small title |
| **Sci-fi** | Clean geometry, singular focal point, future-tech subtlety | Cliché ships, robots, generic space |
| **Romance** | Character connection, warm palette, emotion over action | Text overload, generic stock |
| **Thriller** | High contrast, negative space, one menacing element | Too much happening, bright |
| **Literary fiction** | Photograph crop, object as metaphor, serif title | Fantasy tropes, illustration |

**Universal principles:**
- **Title first**: Typography must be readable at thumbnail size (Amazon grid)
- **Composition rule of thirds**: Focal point on intersection, not dead center
- **Depth layering**: Foreground / mid-ground / background — create dimension
- **One hero color**: Everything else supports it
- **Resist clutter**: If it's not essential, delete it
- **Portrait ratio**: 2:3 is the book cover standard (1200x1800, 800x1200, etc.)

### Phase 3: COMPOSE THE PROMPT

The prompt has a specific structure. Follow it exactly:

```
Generate an image: [Genre descriptor] book cover for [TITLE]. Portrait orientation, 2:3 ratio.

SCENE: [One paragraph describing the single iconic image. Concrete. Specific. No abstractions.]

COMPOSITION: [Focal point location, depth layers, what's foreground/mid/background]

LIGHTING: [Source, direction, mood. Cinematic lighting terminology.]

PALETTE: [Hero color + 2-4 supporting colors as hex codes or named precisely]

TYPOGRAPHY: [Title at top/bottom, font style: serif/sans/display, weight: bold/thin]

STYLE REFERENCES: [2-3 specific references. Real designers, movies, or artists.]

MOOD: [One sentence on the emotional register the cover should evoke]

TECHNICAL: 4K resolution, portrait ratio, book cover composition, cinematic depth of field, readable typography.
```

### Phase 4: GENERATE

**Model routing:**
- **DEFAULT: NB2** (`gemini-3.1-flash-image-preview`) — $0.02, portrait-native, best for covers
- **PREMIUM** (only when user says "premium", "hero", "final", or "launch"): NB Pro (`nano-banana-pro-preview`) — $0.04

**API call template:**

```bash
# Load key from MCP config or env
# export GEMINI_API_KEY="your-key-from-aistudio.google.com"

MODEL="gemini-3.1-flash-image-preview"  # NB2 default
# MODEL="nano-banana-pro-preview"        # NB Pro (premium only)

curl -s "https://generativelanguage.googleapis.com/v1beta/models/$MODEL:generateContent?key=$GEMINI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"contents":[{"parts":[{"text":"PROMPT_HERE"}]}],"generationConfig":{"responseModalities":["TEXT","IMAGE"]}}' \
  | python3 -c "
import json,base64,sys
data=json.load(sys.stdin)
for p in data.get('candidates',[{}])[0].get('content',{}).get('parts',[]):
    if 'inlineData' in p:
        d=base64.b64decode(p['inlineData']['data'])
        out='apps/web/public/images/books/SLUG-cover.png'
        open(out,'wb').write(d)
        print(f'OK: {len(d)} bytes -> {out}')
    elif 'text' in p:
        print('Text:',p['text'][:200])
"
```

Save path convention: `apps/web/public/images/books/[slug]-cover.png`
(Add `-nb2` or `-nbpro` suffix if generating multiple for comparison.)

### Phase 5: VALIDATE

Before declaring the cover done, check:

- [ ] **Title is readable** — Can you read it at 200px wide (thumbnail size)?
- [ ] **Genre signal is clear** — Would a reader in 1 second know the genre?
- [ ] **One hero color dominates** — Not competing palettes
- [ ] **Focal point is intentional** — Rule of thirds or centered deliberately
- [ ] **No AI artifacts** — Hands, text garbling, extra limbs, muddy areas
- [ ] **Portrait ratio** — Not square, not landscape
- [ ] **Matches book tension** — Would someone who read the book nod in recognition?
- [ ] **Mood is precise** — Not generic "epic" or "dark" — the SPECIFIC mood

If any fail, iterate. One re-generation is fine. Beyond that, revise the prompt.

## Quality Tiers

- **Draft cover** — NB2, one generation, basic validation. Good enough for book-in-progress.
- **Production cover** — NB2, 2-3 generations, full validation, pick best. Default for published works.
- **Premium cover** — NB Pro, multiple angles, hero-quality. For launches, featured tier, or when user specifies.

## Anti-Patterns (Never Do)

- Generic "fantasy book cover" prompts with no specificity
- Character faces unless specifically required (faces are the hardest AI generation)
- More than one human figure on the cover (crowd scenes fail)
- Trying to illustrate the entire plot in one image
- Using NB Pro by default (costs 2x with marginal benefit for most covers)
- Skipping Phase 1 (reading the book) to save time
- Bright neon palettes on literary books
- Embedded text longer than the title (taglines often fail in generation)

## Integration with Arcanea Ecosystem

- Save covers to `apps/web/public/images/books/[slug]-cover.png`
- Update `COVER_MAP` in `apps/web/app/books/drafts/[slug]/page.tsx`
- Update `COVER_MAP` in `apps/web/app/books/drafts/page.tsx`
- Log the cover generation in the book's `book.yaml` under `ai_transparency.models_used`
- For featured tier books: also register in the book reader's metadata

## Output Format

When using this skill, produce:

1. **The thinking** — A brief (150-250 word) analysis of the book's tension, emotion, iconic image, genre expectations
2. **The prompt** — The composed prompt with all 7 structural sections
3. **The generation** — Execute the curl command, save to correct path
4. **The validation** — Run the checklist, report pass/fail per item
5. **The result** — Read the generated image and confirm visually

---

*"A cover is a haiku. One image, one emotion, one question that makes you turn the book over to read the back." — The Arcanea Book Cover Method*
