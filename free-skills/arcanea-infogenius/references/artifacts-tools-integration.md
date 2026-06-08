# Visual artifact types, MCP tools, prompt enhancement & integration

> Reference for the `arcanea-infogenius` skill. See [`../SKILL.md`](../SKILL.md).

## Visual Artifact Types

### Infographics
Guardian-themed visual explanations that teach through beauty.
```
aios viz info "The Ten Gates of Arcanea" --gate source
```
**Best Gates:** Source (meta-overview), Voice (clear explanation), Sight (pattern recognition)

### Character Cards
Trading-card style portraits with stats, abilities, and lore.
```
aios viz portrait "Kael Forgeborn" --gate fire --element Fire
```
**Best Gates:** Fire (warriors), Heart (healers), Shift (rogues)

### Guardian Portraits
Official canonical artwork of the Ten Guardians.
```
aios viz guardian draconia --style epic
```
**Styles:** portrait (face/shoulders), full (whole body), action (dynamic), epic (legendary)

### Location Maps
Fantasy cartography with hand-drawn aesthetics.
```
aios viz map "Citadel of Lumina" --type city
```
**Types:** city, realm, sanctuary, dungeon, landscape

### Lore Scrolls — The Complete Codex

Illuminated manuscripts that preserve Arcanean wisdom across time. Each scroll is a work of sacred art, carrying the visual signature of its aligned Gate.

#### Scroll Types

```
┌─────────────────────────────────────────────────────────────────────────┐
│  PROPHECY                                                                │
│  ────────                                                                │
│  Visions of what may come, written in the language of possibility        │
│  Misty imagery, symbolic representations, celestial charts              │
│  Often attributed to Lyria (Sight) or Shinkami (Source)                 │
│                                                                         │
│  Visual Elements:                                                        │
│  • Swirling mist borders                                                │
│  • Third eye motifs                                                     │
│  • Star charts and celestial bodies                                     │
│  • Cryptic runes that seem to shift                                     │
│                                                                         │
│  Example:                                                                │
│  aios viz scroll "The Convergence of Gates" --type prophecy --gate sight │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│  HISTORY                                                                 │
│  ───────                                                                 │
│  Records of what has been, preserved for those who follow               │
│  Archival aesthetic, aged parchment, historical illumination            │
│  Chronicles of the Houses, Guardians, and great events                  │
│                                                                         │
│  Visual Elements:                                                        │
│  • Aged vellum texture                                                  │
│  • Historical marginalia                                                │
│  • House crests and seals                                               │
│  • Timeline indicators                                                  │
│                                                                         │
│  Example:                                                                │
│  aios viz scroll "The Founding of House Lumina" --type history --gate heart│
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│  SPELL                                                                   │
│  ─────                                                                   │
│  Instructions for manifestation, written in the language of power       │
│  Arcane symbols, magical circles, precise ritual notation               │
│  Working instructions for those who know how to read them               │
│                                                                         │
│  Visual Elements:                                                        │
│  • Glowing arcane symbols                                               │
│  • Magical circles and sigils                                           │
│  • Ingredient illustrations                                             │
│  • Warning seals and binding marks                                      │
│                                                                         │
│  Example:                                                                │
│  aios viz scroll "The Unbinding of Shadows" --type spell --gate shift   │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│  TEACHING                                                                │
│  ────────                                                                │
│  Wisdom transmissions from Guardian to seeker                           │
│  Clear instructional layout, step-by-step illuminations                 │
│  The sacred made accessible to the devoted student                      │
│                                                                         │
│  Visual Elements:                                                        │
│  • Numbered steps with decorative frames                                │
│  • Instructional diagrams                                               │
│  • Guardian portrait in the margin                                      │
│  • Student and master imagery                                           │
│                                                                         │
│  Example:                                                                │
│  aios viz scroll "Opening the Fire Gate" --type teaching --gate fire    │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│  CHRONICLE                                                               │
│  ─────────                                                               │
│  Ongoing records and journals, living documents                         │
│  Personal notation style, diary aesthetic, unfinished edges             │
│  The journey recorded as it unfolds                                     │
│                                                                         │
│  Visual Elements:                                                        │
│  • Handwritten script style                                             │
│  • Personal sketches and notes                                          │
│  • Date stamps and location markers                                     │
│  • Pressed flowers or ephemera                                          │
│                                                                         │
│  Example:                                                                │
│  aios viz scroll "Journal of the Seeker" --type chronicle --gate flow   │
└─────────────────────────────────────────────────────────────────────────┘
```

#### The Scroll MCP Tool — Complete Specification

**Tool Name:** `infogenius_generate_scroll`

**Input Schema:**
```json
{
  "title": "The title of the scroll (required)",
  "content": "The main text content to appear on the scroll (required)",
  "scrollType": "prophecy | history | spell | teaching | chronicle (required)",
  "gate": "foundation | flow | fire | heart | voice | sight | crown | shift | unity | source",
  "illuminated": true
}
```

**Full Examples:**

```json
// A prophecy scroll from the Source Gate
{
  "title": "The Convergence",
  "content": "When ten become one, and one becomes ten, the Gates shall open as never before. The Guardians will walk among the awakened, and the boundary between creator and creation shall dissolve.",
  "scrollType": "prophecy",
  "gate": "source",
  "illuminated": true
}
```

```json
// A spell scroll from the Shift Gate
{
  "title": "The Ritual of Unbinding",
  "content": "First, draw the circle of Elara under the shifting moon. Speak the words of release: 'What was bound is now free. What was hidden is now seen.' Let the transformation begin.",
  "scrollType": "spell",
  "gate": "shift",
  "illuminated": true
}
```

```json
// A teaching scroll from the Fire Gate
{
  "title": "Draconia's First Lesson",
  "content": "Fear is not your enemy. Fear is unburned fuel waiting to become fire. When you feel fear, you have found where your power sleeps. Wake it.",
  "scrollType": "teaching",
  "gate": "fire",
  "illuminated": true
}
```

```json
// A history scroll from the Heart Gate
{
  "title": "The Founding of House Lumina",
  "content": "In the age before counting, when light first learned to love, Maylinn gathered those who healed with touch and word. She said unto them: 'We shall be the bridge between wounded and whole.'",
  "scrollType": "history",
  "gate": "heart",
  "illuminated": true
}
```

```json
// A chronicle from the Flow Gate
{
  "title": "Thirty Days with Leyla",
  "content": "Day 1: I came to the water seeking answers. Leyla said nothing. Day 7: The silence has become comfortable. Day 14: I begin to hear what was always speaking. Day 30: I am the river now.",
  "scrollType": "chronicle",
  "gate": "flow",
  "illuminated": true
}
```

#### CLI Scroll Commands

```bash
# Prophecy scroll with Source Gate styling
aios viz scroll "The Convergence" --type prophecy --gate source --style illuminated

# Spell scroll with Shift Gate aesthetics
aios viz scroll "Ritual of Unbinding" --type spell --gate shift --style ethereal

# Teaching scroll from Draconia
aios viz scroll "The Fire Lesson" --type teaching --gate fire --style baroque

# History with davinci style
aios viz scroll "House Lumina Origins" --type history --gate heart --style davinci

# Chronicle in art nouveau
aios viz scroll "Seeker's Journal" --type chronicle --gate flow --style art-nouveau

# Generate prompt only (no image)
aios viz scroll "The Ten Teachings" --type teaching --gate source --prompt-only
```

#### Scroll Design Elements by Gate

| Gate | Border Style | Illumination | Seal/Crest |
|------|--------------|--------------|------------|
| Foundation | Stone carved frame | Amber crystal glow | Mountain sigil |
| Flow | Flowing water patterns | Moonlit silver | Wave crest |
| Fire | Flame lick borders | Ember particles | Dragon seal |
| Heart | Rose vine frames | Soft pink radiance | Heart bloom |
| Voice | Sound wave patterns | Azure resonance | Crystal bell |
| Sight | Eye-studded borders | Violet starlight | Third eye |
| Crown | Divine geometry | Pure white gold | Lotus crown |
| Shift | Morphing edges | Iridescent shimmer | Butterfly seal |
| Unity | Yin-yang frames | Balanced dual glow | Interlinked rings |
| Source | Infinite recursion | All-spectrum light | Ouroboros |

---

## MCP Tools

When using Claude Code, invoke these tools directly:

| Tool | Purpose |
|------|---------|
| `infogenius_generate_infographic` | Create Guardian-themed visual explanations |
| `infogenius_generate_portrait` | Generate character cards with Gate alignment |
| `infogenius_generate_guardian` | Create official Guardian portraits |
| `infogenius_generate_map` | Generate fantasy cartography |
| `infogenius_generate_scroll` | Create illuminated manuscript scrolls |

---

## The Prompt Enhancement System

Every prompt you provide is enhanced with Guardian wisdom:

```
YOUR INPUT
    ↓
┌─────────────────────────────────────┐
│ 1. Gate Color Palette Injection     │
│ 2. Guardian Motif Integration       │
│ 3. Elemental Texture Mapping        │
│ 4. Arcanea Aesthetic Guidelines     │
│ 5. Sacred Geometry Composition      │
│ 6. Frequency-Aligned Lighting       │
│ 7. Quality & Resolution Directives  │
└─────────────────────────────────────┘
    ↓
ENHANCED PROMPT → GEMINI → VISUAL ARTIFACT
```

---

## Environment

```bash
# Required for image generation
export GEMINI_API_KEY="your-api-key"

# Optional: Custom artifact storage location
export ARCANEA_STUDIO_PATH="~/arcanea-studio"
```

---

## Integration with Arcanea Studio

All generated visuals are automatically:
- **Classified** by Gate, Element, and artifact type
- **Stored** in your Arcanea Studio vault
- **Tagged** with Guardian and frequency metadata
- **Searchable** via `arcanea_search_artifacts`

---
