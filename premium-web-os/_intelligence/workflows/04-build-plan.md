# 04 — Build Plan

**Purpose:** Convert the scene briefs into a page spec the build executes against — components, data, every interaction state, and a verified dependency list.

## Inputs

- The scene briefs from [`03-scene-brief.md`](./03-scene-brief.md).
- [`../templates/page-spec.template.md`](../templates/page-spec.template.md) — the page spec shape.
- The repo's `package.json` + `node_modules`.
- [`../implementation-standards.md`](../implementation-standards.md) — component + state conventions.

## Steps

1. **Open the page spec** from [`../templates/page-spec.template.md`](../templates/page-spec.template.md) and map scenes → sections in scroll order.
2. **List components per section:** name, responsibility, props, which existing component it reuses or extends. Prefer extending existing conventions over new files.
3. **Define data + sources:** static/CMS/API, the shape, and where it loads. Flag anything not yet available.
4. **Specify every interaction state** for each interactive component: **loading / empty / error / success** (plus hover/focus/disabled). A component without its states is incomplete — this is a hard part of the spec, not an afterthought.
5. **Responsive plan:** behavior at 1920 / 1440 / 768 / **375**. Mobile is a first-class layout, never a squeezed desktop.
6. **Dependency check:** every library the plan needs must exist in `package.json`. **Flag anything missing.** If a new dependency is genuinely required, record the justification in [`../decision-log.md`](../decision-log.md) before adding it; verify its real API from `node_modules`/docs, never memory.
7. **Run the plan-time gate.** Submit the spec + briefs to the design-review discipline in [`../quality-gates.md`](../quality-gates.md) (Gate 1). Fix the plan until each dimension hits target before any code.

## Output / artifact

A committed **page spec** (from the template): section/component map, data, full state matrix, responsive plan, dependency list with any flags, and the decision-log entry for additions.

## Gate

Every interactive component has loading/empty/error/success defined; 375px behavior is specified; no undeclared dependency; plan-time design review passes.

## Next

[`05-implementation.md`](./05-implementation.md)
