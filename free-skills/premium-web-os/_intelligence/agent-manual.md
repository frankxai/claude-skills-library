# Agent Manual

How an agent runs the Premium Web OS end to end — single-agent or multi-agent.

## Posture

Work like a senior builder, not a chatbot. Make reasonable architectural decisions; don't ask exploratory questions. Ask only when blocked by missing credentials, an unknown package manager, or a destructive/irreversible operation.

## The run

1. **Inspect** the repo: stack, package manager, framework, styling, conventions, existing components, the brand's token source. Preserve what works.
2. **Intake** (`workflows/00-intake.md`): convert the ask into verifiable targets + rubric goals.
3. **Reference board** (`workflows/01`, `reference-deconstruction.md`): principles, not copies.
4. **Art direction + scene brief** (`workflows/02-03`, `templates/scene-brief.template.md`): lock the dominant idea, palette, type, motion intent, 3D metaphor per scene.
5. **Build plan** (`workflows/04`, `templates/page-spec.template.md`): component list, data, states, dependencies (flag any not in `package.json`).
6. **Static build** (`workflows/05`): layout/type/hierarchy/color from tokens. Premium frozen.
7. **Motion pass** (`workflows/06`, `motion.md`): one cinematic beat; reduced-motion fallback.
8. **3D pass** (`three-webgl.md`): only with metaphor/budget/fallback.
9. **Visual QA** (`workflows/07`, `templates/visual-audit.template.md`): score the rubric; fix.
10. **Performance pass** (`workflows/08`, `performance.md`).
11. **Release gate** (`checklists/release-check.md`) → **Handover** (`workflows/09`, `templates/handover.template.md`) → **decision log**.

## Multi-agent mode

When the host repo provides design subagents, compose them in dependency order:

```
design-architect   → brief + art direction (reads taste.md, brand-worlds.md)
design-generator   → static variants (reads design.md, tokens)
design-motion      → motion pass (reads motion.md, design-system/motion)
design-verifier    → QA gate (Playwright 3 widths + Lighthouse + anti-pattern grep)  ← abort-on-fail
```

Run sequentially with the verifier as a blocking gate. **Graceful degradation:** if any agent is absent, run that phase yourself with the same doc as the brief. Never block on a missing agent.

## After implementation

Run the available lint/typecheck/build/test commands. Fix failures your work introduced. Produce a concise handover: changed files, commands run, rubric scores, next moves, and any logged decisions/TODOs.

## Anti-hallucination discipline

- Verify package APIs from the package source in `node_modules` (or its official docs) before coding; never from memory.
- Don't add a dependency that isn't declared without logging the justification.
- State assumptions; if you'd have to guess a path/schema/type, stop and surface it.
- When tests/types/build disagree with your mental model, the model is wrong — re-read.
