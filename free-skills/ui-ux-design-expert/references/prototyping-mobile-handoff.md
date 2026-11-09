# Prototyping, mobile and developer handoff

Part of the `ui-ux-design-expert` skill. SKILL.md links here; read it when prototyping, designing for small screens, or preparing a handoff.

## Prototyping & Design Tools

**Tool Selection by Use Case:**

```
WIREFRAMING (Low Fidelity):
- Balsamiq: Rapid sketching, low-fidelity
- Whimsical: Quick diagrams and flows
- Pen & paper: Fastest initial ideation

INTERFACE DESIGN (High Fidelity):
- Figma: Industry standard, collaborative, browser-based
- Sketch: Mac-only, strong plugin ecosystem
- Adobe XD: Adobe ecosystem integration

PROTOTYPING (Interactive):
- Figma: Built-in prototyping, handoff to dev
- ProtoPie: Advanced interactions, sensors
- Framer: Code-based, production-ready
- Principle: Mac-only, animation-focused

DESIGN SYSTEMS:
- Figma: Component variants, auto-layout, design tokens
- Storybook: Developer-side component documentation
- Zeroheight: Design system documentation

COLLABORATION:
- FigJam / Miro: Whiteboarding, workshops
- Notion: Documentation, research repositories
- Loom: Async video walkthroughs
```

**Figma Best Practices:**

```
FILE ORGANIZATION:
Pages: Organize by project phase (Research, Wireframes, High-fidelity, Handoff)
Frames: Use for screens and components
Auto-layout: Responsive components
Components: Create and organize in library
Variants: Multiple states of same component (default, hover, active, disabled)

NAMING CONVENTIONS:
Components: ComponentName/Variant
Screens: 01_ScreenName_Descriptor
Layers: Descriptive names (not "Rectangle 123")

DESIGN TOKENS:
Color styles: color/primary/500
Text styles: text/heading/h1
Effects: shadow/elevation-2

HANDOFF TO DEVELOPERS:
- Use consistent naming
- Document component behavior
- Specify breakpoints
- Annotate interactions and animations
- Provide design specs panel
```

## Mobile-Specific Design Considerations

**Mobile-First Approach:**

```
WHY MOBILE-FIRST:
- Forces prioritization (limited screen space)
- Easier to scale up than down
- Majority of web traffic is mobile
- Better performance (fewer assets initially)

MOBILE UI PATTERNS:
Thumb Zone: Bottom third of screen = easy reach
Primary actions: Bottom of screen (iOS) or floating action button (Android)
Navigation: Bottom tab bar (5 max) or hamburger menu
Gestures: Swipe, pinch-to-zoom, long-press, pull-to-refresh
Cards: Scannable content containers

PERFORMANCE:
- Optimize images (WebP, lazy loading)
- Minimize HTTP requests
- Critical CSS inline
- Defer non-critical JavaScript
- Target: <3 second load time on 3G
```

**Responsive Design Principles:**

```
BREAKPOINTS:
Mobile: 320px - 767px
Tablet: 768px - 1023px
Desktop: 1024px - 1439px
Wide: 1440px+

RESPONSIVE PATTERNS:
Mostly Fluid: Columns stack on mobile
Column Drop: Columns drop below each other as screen narrows
Layout Shifter: Layouts change significantly at breakpoints
Off Canvas: Navigation slides in from side

FLEXIBLE IMAGES:
max-width: 100%;
height: auto;
Srcset for different resolutions
Picture element for art direction
```

## Handoff to Development

**Design-Development Collaboration:**

```
DESIGN SPECS:
- Spacing and sizing (margins, padding, dimensions)
- Typography (font family, size, weight, line height, color)
- Colors (hex codes or design tokens)
- Shadows and effects
- Border radius
- Interactive states (hover, focus, active, disabled)
- Breakpoints and responsive behavior
- Animations and transitions

DESIGN TOKENS (CSS Variables):
--color-primary: #3B82F6;
--spacing-md: 16px;
--font-size-body: 16px;
--border-radius-md: 8px;

DOCUMENTATION:
- Component behavior notes
- Edge cases and error states
- Accessibility requirements (ARIA labels, focus order)
- Content guidelines (character limits, placeholder text)
- Dependencies and interactions

HANDOFF TOOLS:
- Figma Inspect panel (built-in)
- Zeplin (design specs and style guides)
- Avocode (design-to-code export)
```
