# Visual design and interaction patterns

Part of the `ui-ux-design-expert` skill. SKILL.md links here; read it when designing or critiquing how a screen looks or behaves.

## UI Design Best Practices (2025)

**Visual Hierarchy:**

```
TYPOGRAPHY SCALE:
H1: 48px (3rem) - Page title
H2: 36px (2.25rem) - Section headers
H3: 28px (1.75rem) - Subsection headers
H4: 20px (1.25rem) - Component headers
Body: 16px (1rem) - Default text
Small: 14px (0.875rem) - Captions, labels

LINE HEIGHT:
Headings: 1.2-1.3× font size (tighter)
Body text: 1.5-1.7× font size (comfortable reading)
Small text: 1.4-1.5× font size

FONT PAIRING:
- Serif heading + Sans-serif body (classic contrast)
- Two weights of same typeface (simplest, cohesive)
- Geometric sans + Humanist sans (subtle contrast)
- Limit to 2-3 typefaces maximum
```

**Color Strategy:**

```
COLOR PALETTE STRUCTURE:
Primary: Brand color, call-to-action buttons (1 color, 5-7 shades)
Secondary: Supporting brand color (1 color, 5-7 shades)
Neutral: Gray scale for text, backgrounds, borders (7-9 shades)
Semantic: Success (green), Warning (yellow), Error (red), Info (blue)

60-30-10 RULE:
60% Neutral/background
30% Secondary/supporting
10% Primary/accent

ACCESSIBILITY-FIRST COLOR:
- Start with WCAG-compliant combinations
- Test all color combinations for contrast
- Provide alternative indicators beyond color
- Consider color blindness (8% of men, 0.5% of women)
```

**Spacing & Layout:**

```
8-POINT GRID SYSTEM:
- Base unit: 8px
- Scale: 8, 16, 24, 32, 40, 48, 56, 64, 72, 80px
- Benefits: Consistency, easier handoff to developers, scales well

WHITE SPACE PRINCIPLES:
- Macro white space: Between major sections (48-64px)
- Micro white space: Between related elements (8-16px)
- Line spacing: 1.5× for body text
- Padding inside components: 16-24px typically

RESPONSIVE GRID:
Mobile: 4-column grid
Tablet: 8-column grid
Desktop: 12-column grid
Gutter: 16-24px
Margin: 16px (mobile) to 64px (desktop)
```

**Visual Design Trends (2025):**

```
THOUGHTFUL AI INTEGRATION:
- AI tools for automation, not replacement
- Human oversight on AI-generated designs
- Use AI for: ideation, accessibility testing, design system generation
- Critical approach: does AI add genuine value?

INCLUSIVE DESIGN:
- Accessibility baked in from start
- Diverse user testing participants
- Multiple input methods (touch, keyboard, voice)
- Cultural sensitivity and localization considerations

NEUMORPHISM EVOLUTION:
- Soft, subtle shadows (not extreme)
- Accessibility-compliant contrast
- Use sparingly for premium feel
- Ensure affordance is clear

GLASSMORPHISM:
- Frosted glass effect (backdrop-filter: blur)
- Light transparency with subtle borders
- Works well for overlays and modals
- Ensure text contrast remains WCAG-compliant

MICRO-INTERACTIONS:
- Button hover states and click feedback
- Loading animations that reduce perceived wait
- Form validation with smooth transitions
- Skeleton screens during content load
- Haptic feedback on mobile (when appropriate)
```

## Interaction Design Patterns

**Navigation Patterns:**

```
PRIMARY NAVIGATION:
Top Navigation Bar: Best for 5-7 main sections, desktop-first
Hamburger Menu: Mobile standard, controversial on desktop
Side Navigation: Enterprise apps, many menu items
Tab Navigation: 3-5 sections, mobile apps, persistent context

BEST PRACTICES:
- Current location always indicated
- Breadcrumbs for deep hierarchies
- Search for 50+ pages
- Max 7 items in primary nav (Miller's Law)
- Persistent access to key functions
```

**Form Patterns:**

```
BEST PRACTICES:
- Single column layout (faster completion)
- Group related fields
- Inline validation (on blur, not keystroke)
- Clear, specific error messages
- Show password option
- Autofill/autocomplete support
- Progress indicator for multi-step forms
- Save partial progress (if long form)

FIELD TYPES:
- Text input: Short answers, names, emails
- Textarea: Long-form content
- Dropdown: 5-15 options, mutually exclusive
- Radio buttons: 2-5 options, visible, mutually exclusive
- Checkboxes: Multiple selection, independent options
- Date picker: Dates (consider manual entry option)
- Search: Autocomplete suggestions
```

**Feedback Patterns:**

```
LOADING STATES:
- Spinner: Unknown duration (< 3 seconds)
- Progress bar: Known duration or percentage
- Skeleton screen: Maintain layout, reduce perceived wait
- Optimistic UI: Show action completed, sync in background

EMPTY STATES:
- Explain why it's empty
- Provide clear next action
- Use friendly illustration or icon
- First-time user guidance

ERROR STATES:
- Explain what went wrong (non-technical language)
- Suggest how to fix it
- Provide contact/support option if unresolvable
- Don't blame the user
```
