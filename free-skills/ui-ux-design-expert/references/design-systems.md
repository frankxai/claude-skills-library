# Design systems and component libraries

Part of the `ui-ux-design-expert` skill. SKILL.md links here; read it when building, extending or auditing a design system.

## Design Systems & Component Libraries

**Design System Philosophy:**
Treat your design system as a living product, not just a style guide. It should evolve with user needs, technology capabilities, and brand requirements.

**Core Components of a Design System:**

### Foundation Layer
```
DESIGN TOKENS:
- Colors: Primary, secondary, neutral, semantic (success, warning, error)
- Typography: Font families, sizes, weights, line heights
- Spacing: 4px or 8px base unit system (4, 8, 12, 16, 24, 32, 48, 64...)
- Border radius: Consistent rounding scale (0, 2, 4, 8, 16, 24px)
- Shadows: Elevation levels (0-5) for depth hierarchy
- Breakpoints: Mobile (320px), tablet (768px), desktop (1024px), wide (1440px)

EXAMPLE TOKEN STRUCTURE:
color-primary-500: #3B82F6
color-primary-600: #2563EB (darker, for hover)
color-primary-400: #60A5FA (lighter, for backgrounds)
spacing-md: 16px
spacing-lg: 24px
font-size-body: 16px
font-size-h1: 48px
```

### Component Layer
```
ATOMIC DESIGN METHODOLOGY:
Atoms: Button, Input, Icon, Label
Molecules: Search bar (input + button), Form field (label + input + error)
Organisms: Navigation bar, Card with content, Form section
Templates: Page layouts with placeholders
Pages: Actual implementations with real content

COMPONENT DOCUMENTATION:
- Visual examples (all states: default, hover, focus, active, disabled)
- Code snippets (HTML/React/Vue)
- Usage guidelines (when to use, when not to use)
- Accessibility notes (keyboard behavior, ARIA requirements)
- Design specs (spacing, sizing, typography)
```

### Popular Design Systems to Reference
```
MATERIAL DESIGN (Google):
- Comprehensive guidelines for mobile/web
- Strong accessibility focus
- Component libraries for React, Vue, Angular
- Material 3 (2025) emphasizes personalization and dynamic color

APPLE HUMAN INTERFACE GUIDELINES:
- iOS, macOS, watchOS, tvOS guidelines
- Platform-specific best practices
- SF Symbols icon system

IBM CARBON:
- Enterprise-focused design system
- Excellent accessibility documentation
- Data visualization components

ANT DESIGN:
- Enterprise React UI library
- Comprehensive component set
- Strong TypeScript support

TAILWIND CSS (Utility-first):
- Not a traditional design system, but highly composable
- Rapid prototyping capabilities
- Customizable design tokens
```
