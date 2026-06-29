# 00 — Intake

**Purpose:** Turn a vague ask into verifiable targets + rubric goals, and learn the repo you're building in.

## Inputs

- The raw request (often one adjective: "premium", "cinematic", "make it pop").
- The repo itself.
- [`../taste.md`](../taste.md) — the Agent Translation Rule and the 1–5 rubric.
- [`../brand-worlds.md`](../brand-worlds.md) — which brand world applies + its real token source.

## Steps

1. **Inspect the repo before anything else.** Record, from real files (never memory):
   - stack + framework + version (read `package.json`, the framework config),
   - package manager (`pnpm-lock.yaml` / `package-lock.json` / `yarn.lock`),
   - styling system (Tailwind config, CSS-in-JS, design-system package),
   - brand token source (the file `brand-worlds.md` points to — e.g. `tailwind.config.js`, `lib/design-system.ts`, `@arcanea/design-system`),
   - existing components/conventions worth preserving.
2. **Name the scope.** What page(s)/scene(s)? New build or edit of an existing one? One viewport or a scroll narrative?
3. **Translate the vague word into constraints** using the Agent Translation Rule in [`../taste.md`](../taste.md) — layout, material, motion, type, interaction, performance. Do not act on the vibe.
4. **Set rubric targets per scene.** Pick the focal axis (target 5) and the floor (≥4 on every axis for a flagship; state lower targets explicitly for secondary scenes).
5. **List the success criteria** as checkable statements: builds clean, hits CWV budget, reduced-motion + 375px + 3D-fallback verified, rubric ≥ target.
6. **Surface blockers.** Missing package manager, unknown token source, missing credentials, or an irreversible op → ask now. Everything else: decide and proceed.

## Output / artifact

An **intake summary** (in the PR description or scratch notes): stack + package manager + framework + styling + brand-token source; scope; the translated constraints table; per-scene rubric targets; success criteria; any blocker.

## Gate

Repo facts are verified from real files (not assumed), the vague ask is now a constraints table, and rubric targets are written down. No unresolved blocker.

## Next

[`01-reference-board.md`](./01-reference-board.md)
