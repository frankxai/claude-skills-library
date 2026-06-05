---
name: web-design-expert
description: Web design and UX guidance for visual systems, accessibility, interaction patterns, and performance-aware interfaces. Use when designing a website's look and feel, improving UX/accessibility, or reviewing a UI for polish and performance.
version: 1.0.0
---

# Web Design Expert Skill

**Type**: Design System & UX/UI Workflow
**Version**: 1.0.0
**Last Updated**: 2025-11-07

## Description

High-end web design team capabilities for creating exceptional user experiences. Combines visual design, UX research, accessibility, performance optimization, and rigorous testing protocols.

---

## Core Competencies

### 1. Visual Design & Mockups
- Modern design systems (Tailwind, custom tokens)
- Typography hierarchy and readability
- Color theory and contrast ratios (WCAG 2.2 AA/AAA)
- Layout composition and white space
- Component design patterns
- Responsive design principles
- Animation and microinteraction design

### 2. User Experience (UX)
- User journey mapping
- Information architecture
- Conversion funnel optimization
- A/B test hypothesis and variant design
- Usability heuristics (Nielsen's 10)
- Mental models and user expectations
- Progressive disclosure patterns
- Cognitive load reduction

### 3. Accessibility (WCAG 2.2)
- Semantic HTML structure
- ARIA labels and roles
- Keyboard navigation
- Screen reader compatibility
- Focus management
- Color contrast (4.5:1 text, 3:1 UI)
- Touch target sizing (44x44px minimum)
- Alternative text and descriptions
- Motion reduction preferences

### 4. Performance Optimization
- Core Web Vitals (LCP, FID, CLS)
- Lighthouse score optimization
- Image optimization strategies
- Code splitting and lazy loading
- Bundle size management
- Caching strategies
- Critical rendering path
- Performance budgets

### 5. Testing & Quality Assurance
- Cross-browser testing (Chrome, Safari, Firefox, Edge)
- Device testing (iOS, Android, Desktop)
- Visual regression testing
- Screenshot comparison workflows
- Responsive design verification
- Touch interaction testing
- Load time testing (3G, 4G, WiFi)

---

## Required MCP Integrations

### Critical MCPs (Must Have)

#### 1. Playwright MCP
**Purpose**: Visual testing, screenshots, browser automation
**Usage**:
```typescript
// Capture baseline screenshots
await playwright.screenshot({
  url: 'https://frankx.ai',
  selector: '#hero',
  viewport: { width: 1920, height: 1080 }
})

// Test responsive design
await playwright.screenshot({
  url: 'https://frankx.ai',
  viewport: { width: 375, height: 812 } // iPhone 13
})

// Visual regression testing
await playwright.compareScreenshots({
  before: 'baseline.png',
  after: 'current.png'
})
```

#### 2. Vercel MCP (or equivalent hosting MCP)
**Purpose**: Deployment, analytics, performance monitoring
**Usage**:
```typescript
// Check current deployment
vercel.getDeployment({ project: 'frankx-ai' })

// Get analytics data
vercel.getAnalytics({
  project: 'frankx-ai',
  metrics: ['bounceRate', 'timeOnPage', 'conversionRate']
})

// Trigger preview deployment
vercel.deploy({
  branch: 'feature/hero-improvements',
  environment: 'preview'
})

// Run Lighthouse audit
vercel.runLighthouse({ url: 'preview-url' })
```

#### 3. GitHub MCP
**Purpose**: Proper PR workflow, code review, issue tracking
**Usage**:
```typescript
// Create feature branch
github.createBranch({
  name: 'feature/2025-11-07-hero-improvements',
  from: 'v3'
})

// Create PR with screenshots
github.createPR({
  title: '✨ Improve homepage hero clarity',
  body: markdown_with_screenshots,
  reviewers: ['frankxai'],
  labels: ['design', 'ux-improvement']
})

// Check existing issues
github.searchIssues({
  repo: 'frankxai/frankx.ai-vercel-website',
  labels: ['bug', 'ux']
})
```

### Recommended MCPs

#### 4. Notion MCP
**Purpose**: Design documentation, strategy tracking
**Usage**:
- Document design decisions
- Track A/B test results
- Maintain design system docs
- Update project roadmap

#### 5. Linear MCP
**Purpose**: Task management, sprint planning
**Usage**:
- Create design tasks
- Track implementation progress
- Link commits to tasks
- Sprint retrospectives

#### 6. Figma MCP (if available)
**Purpose**: Design file integration
**Usage**:
- Export design mockups
- Share component specs
- Version control for designs

#### 7. Nano Banana MCP
**Purpose**: AI image generation
**Usage**:
- Generate hero images
- Create placeholder graphics
- Mockup visual concepts
- Design variations

---

## Standard Web Design Workflow

### Phase 1: Research & Baseline (ALWAYS START HERE)

```markdown
1. ✅ Capture Current State
   - Use Playwright MCP to screenshot all key pages
   - Organize screenshots: `/screenshots/baseline/YYYY-MM-DD/`
   - Document viewport: Desktop (1920x1080), Tablet (768x1024), Mobile (375x812)

2. ✅ Establish Performance Baseline
   - Run Lighthouse via Vercel MCP or direct
   - Document scores:
     * Performance: __/100
     * Accessibility: __/100
     * Best Practices: __/100
     * SEO: __/100
   - Check Core Web Vitals:
     * LCP: __ seconds
     * FID: __ ms
     * CLS: __ score

3. ✅ Analyze Current Analytics
   - Use Vercel MCP to get actual metrics:
     * Bounce rate: __%
     * Average time on page: __ seconds
     * Conversion rate: __%
     * Top exit pages: __
   - Don't estimate - use real data!

4. ✅ Document User Flows
   - Map current user journeys
   - Identify friction points
   - Note confusing elements
   - List accessibility issues
```

### Phase 2: Design & Plan

```markdown
1. ✅ Define Success Metrics
   - Specific, measurable goals
   - Example: "Reduce bounce rate from 80% to 60%"
   - Example: "Increase assessment starts by 30%"

2. ✅ Create Design Mockups (if major changes)
   - Use Figma or describe detailed changes
   - Show before/after comparison
   - Get stakeholder approval

3. ✅ Accessibility Check
   - Color contrast: Use tool to verify 4.5:1 minimum
   - Touch targets: Ensure 44x44px minimum
   - Semantic HTML: Plan proper heading structure
   - ARIA labels: Document where needed

4. ✅ Performance Budget
   - Maximum bundle size increase: +50KB
   - LCP target: <2.5 seconds
   - CLS target: <0.1
   - Lighthouse target: 95+ all categories
```

### Phase 3: Develop & Iterate

```markdown
1. ✅ Create Feature Branch
   - Use GitHub MCP or git commands
   - Name: feature/YYYY-MM-DD-description
   - Branch from: main or v3

2. ✅ Make Changes
   - Edit components
   - Follow design system patterns
   - Use TypeScript strict mode
   - Comment complex logic

3. ✅ Local Testing
   - Test in development mode
   - Verify responsive behavior
   - Check console for errors
   - Test keyboard navigation
```

### Phase 4: Test & Validate

```markdown
1. ✅ Capture After Screenshots
   - Use Playwright MCP for same viewports
   - Save to: `/screenshots/after/YYYY-MM-DD/`
   - Create comparison images

2. ✅ Cross-Browser Testing
   - Chrome (latest)
   - Safari (latest)
   - Firefox (latest)
   - Edge (latest)
   - Document any browser-specific issues

3. ✅ Device Testing
   - iOS (iPhone 13 Pro, iPad Pro)
   - Android (Pixel 7, Galaxy S23)
   - Desktop (1920x1080, 2560x1440)

4. ✅ Accessibility Audit
   - Run axe DevTools or similar
   - Test with keyboard only
   - Test with screen reader (VoiceOver or NVDA)
   - Verify ARIA labels
   - Check color contrast

5. ✅ Performance Testing
   - Run Lighthouse after changes
   - Compare to baseline
   - Check bundle size impact
   - Test on throttled connection (3G)
```

### Phase 5: Deploy & Monitor

```markdown
1. ✅ Deploy to Preview
   - Use Vercel MCP to trigger deployment
   - Get preview URL
   - Test preview thoroughly

2. ✅ Create PR with Evidence
   - Use GitHub MCP to create PR
   - Include before/after screenshots
   - Include Lighthouse comparison
   - List changes and impact
   - Tag reviewers

3. ✅ Share for Review
   - Preview URL
   - Screenshot comparisons
   - Performance metrics
   - Expected impact on KPIs

4. ✅ Monitor After Deploy
   - Watch analytics for 24-48 hours
   - Compare actual vs expected metrics
   - Document learnings
   - Iterate if needed
```

---

## Design System Guidelines

### Typography Scale
```css
/* Heading Scale */
h1: 3.5rem (56px) - Hero headlines
h2: 3rem (48px) - Section headings
h3: 2rem (32px) - Subsection headings
h4: 1.5rem (24px) - Card titles
h5: 1.25rem (20px) - Small headings
h6: 1rem (16px) - Overlines

/* Body Scale */
body-large: 1.25rem (20px) - Subheadlines
body: 1rem (16px) - Default text
body-small: 0.875rem (14px) - Captions
body-xs: 0.75rem (12px) - Labels
```

### Spacing Scale (Tailwind-based)
```css
xs: 0.25rem (4px)
sm: 0.5rem (8px)
md: 1rem (16px)
lg: 1.5rem (24px)
xl: 2rem (32px)
2xl: 3rem (48px)
3xl: 4rem (64px)
4xl: 6rem (96px)
```

### Color System Principles
```typescript
// Primary Actions: Cyan/Blue gradient
primary: { 400: '#22d3ee', 500: '#06b6d4', 600: '#0891b2' }

// Creative/Music: Purple gradient
secondary: { 400: '#c084fc', 500: '#a855f7', 600: '#9333ea' }

// Content/Warm: Amber gradient
accent: { 400: '#fbbf24', 500: '#f59e0b', 600: '#d97706' }

// Backgrounds: Slate (dark mode first)
bg-primary: slate-950
bg-secondary: slate-900
bg-tertiary: slate-800

// Text: High contrast
text-primary: white (on dark)
text-secondary: slate-300
text-tertiary: slate-400
```

### Component Patterns

#### Button Hierarchy
```typescript
// Primary: Main action (cyan gradient)
<button className="bg-gradient-to-r from-cyan-500 to-blue-600
  hover:from-cyan-400 hover:to-blue-500
  text-white font-semibold px-8 py-4 rounded-2xl
  shadow-[0_0_40px_rgba(6,182,212,0.3)]
  transition-all hover:-translate-y-1">
  Primary Action
</button>

// Secondary: Alternative action (outline)
<button className="border-2 border-white/20 bg-white/5
  hover:bg-white/10 hover:border-white/30
  text-white font-semibold px-8 py-4 rounded-2xl
  transition-all hover:-translate-y-1">
  Secondary Action
</button>

// Tertiary: Low emphasis (text only)
<button className="text-slate-300 hover:text-white
  font-medium px-4 py-2 transition-colors">
  Tertiary Action
</button>
```

#### Card Patterns
```typescript
// Glass card with subtle border
<div className="rounded-3xl border border-white/10
  bg-white/5 backdrop-blur-sm p-8
  hover:bg-white/10 hover:border-white/20
  transition-all">
  Card Content
</div>

// Elevated card with shadow
<div className="rounded-3xl bg-white/5 p-8
  shadow-xl shadow-black/20
  hover:shadow-2xl hover:shadow-cyan-500/10
  transition-all">
  Card Content
</div>
```

---

## Accessibility Checklist

### Semantic HTML
- [ ] Proper heading hierarchy (h1 → h2 → h3, no skipping)
- [ ] Landmark regions (header, nav, main, aside, footer)
- [ ] Lists for grouped content (ul, ol)
- [ ] Buttons for actions, links for navigation
- [ ] Form labels associated with inputs

### Keyboard Navigation
- [ ] All interactive elements focusable (tabindex="0" or native)
- [ ] Focus visible with clear outline
- [ ] Tab order logical and predictable
- [ ] Escape closes modals/dropdowns
- [ ] Enter/Space activates buttons
- [ ] Arrow keys for custom components

### Screen Reader Support
- [ ] ARIA labels for icon-only buttons
- [ ] ARIA landmarks for page regions
- [ ] ARIA live regions for dynamic content
- [ ] Alt text for all images (descriptive, not decorative)
- [ ] Hidden decorative elements (aria-hidden="true")
- [ ] Skip to main content link

### Visual Accessibility
- [ ] Color contrast ≥4.5:1 for text
- [ ] Color contrast ≥3:1 for UI elements
- [ ] Text resizable to 200% without breaking
- [ ] No information conveyed by color alone
- [ ] Focus indicators visible and clear
- [ ] Touch targets ≥44x44px

### Motion & Animation
- [ ] Respect prefers-reduced-motion
- [ ] No auto-playing video with sound
- [ ] Parallax effects subtle
- [ ] Animations not essential to understanding
- [ ] Option to pause/stop animations

---

## Performance Budget

### Lighthouse Targets
```yaml
Performance: ≥95
Accessibility: 100
Best Practices: 100
SEO: ≥95
```

### Core Web Vitals
```yaml
LCP (Largest Contentful Paint): <2.5s
FID (First Input Delay): <100ms
CLS (Cumulative Layout Shift): <0.1
```

### Bundle Sizes
```yaml
Initial JS: <200KB (gzipped)
CSS: <50KB (gzipped)
Total Page Weight: <1MB
```

### Image Optimization
```yaml
Format: WebP with fallback
Lazy loading: Below the fold
Responsive: srcset for multiple sizes
CDN: Use Vercel Image Optimization
```

---

## Testing Protocol

### Cross-Browser Testing Matrix

| Browser | Desktop | Mobile | Notes |
|---------|---------|--------|-------|
| Chrome | ✅ Latest | ✅ Latest | Primary test browser |
| Safari | ✅ Latest | ✅ iOS 15+ | Test webkit-specific features |
| Firefox | ✅ Latest | ✅ Latest | Test gecko engine |
| Edge | ✅ Latest | - | Chromium-based |

### Device Testing Matrix

| Device | Viewport | Test Focus |
|--------|----------|------------|
| Desktop | 1920x1080 | Full feature set |
| Laptop | 1440x900 | Medium screens |
| iPad Pro | 1024x1366 | Tablet layout |
| iPhone 13 Pro | 390x844 | Mobile portrait |
| Galaxy S23 | 360x800 | Small mobile |

### Testing Checklist

#### Visual Testing
- [ ] Hero section renders correctly
- [ ] All images load and display properly
- [ ] Typography is readable at all sizes
- [ ] Colors meet contrast requirements
- [ ] Animations are smooth (60fps)
- [ ] No layout shift on page load

#### Interaction Testing
- [ ] All buttons clickable/tappable
- [ ] Forms submit correctly
- [ ] Dropdowns open and close
- [ ] Modals/overlays function
- [ ] Links navigate correctly
- [ ] Error states display properly

#### Responsive Testing
- [ ] Mobile menu works
- [ ] Touch targets are 44x44px minimum
- [ ] No horizontal scroll
- [ ] Content readable without zooming
- [ ] Images scale appropriately

#### Performance Testing
- [ ] Page loads in <3s on 4G
- [ ] No render-blocking resources
- [ ] Images are optimized
- [ ] Fonts load efficiently
- [ ] No JavaScript errors in console

---

## A/B Testing Framework

### Hypothesis Template
```markdown
**Hypothesis**: [Change] will [increase/decrease] [metric] because [reason]

**Example**:
Reducing CTAs from 3 to 1 will increase assessment starts by 30%
because it eliminates decision paralysis and creates a clear next action.

**Metric**: Assessment starts per 100 visitors
**Baseline**: 5 starts per 100 visitors
**Target**: 6.5 starts per 100 visitors (30% increase)
**Duration**: 2 weeks
**Traffic Split**: 50/50
```

### Variant Design Process
1. **Control**: Current design (A)
2. **Variant**: New design (B)
3. **Screenshot both**: For documentation
4. **Deploy both**: Using feature flags or Vercel edge config
5. **Track metrics**: Conversion rate, bounce rate, time on page
6. **Analyze**: After reaching statistical significance
7. **Implement winner**: Deploy to 100% traffic

---

## Documentation Standards

### Design Decision Log
```markdown
### [Feature Name] - YYYY-MM-DD

**Problem**:
[What user problem are we solving?]

**Solution**:
[What design change are we making?]

**Rationale**:
[Why this solution over alternatives?]

**Expected Impact**:
[Metrics we expect to improve]

**Actual Impact** (after deploy):
[Measured results]

**Learnings**:
[What we learned, what we'd do differently]
```

### Component Documentation
```markdown
## ComponentName

**Purpose**: [What it does]
**Used in**: [Which pages]
**Props**: [TypeScript interface]
**Variants**: [Different visual states]
**Accessibility**: [ARIA labels, keyboard support]
**Performance**: [Bundle impact, load time]

**Usage**:
\`\`\`tsx
<ComponentName prop1="value" prop2="value" />
\`\`\`
```

---

## When to Use This Skill

Invoke this skill when:
- Designing new pages or components
- Optimizing conversion funnels
- Improving accessibility
- Running performance audits
- Conducting A/B tests
- Troubleshooting UX issues
- Creating design systems
- Reviewing visual design quality

---

## Integration with FrankX Website Development

This skill enhances the `/frankx-website` command by ensuring:
- ✅ All design changes are data-driven
- ✅ Visual quality is maintained at highest level
- ✅ Accessibility is never compromised
- ✅ Performance budgets are respected
- ✅ Testing is comprehensive and rigorous
- ✅ Changes are deployed with confidence

---

**Skill Version**: 1.0.0
**Last Updated**: 2025-11-07
**Maintained By**: FrankX Website Development Team
**Review Frequency**: Monthly or after major changes
