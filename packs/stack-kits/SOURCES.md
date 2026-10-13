# Sources & provenance

Every kit under `skills/` and every fragment under `rules/kits/` is a **verbatim
copy** of [blencorp/claude-code-kit](https://github.com/blencorp/claude-code-kit)
(MIT), pinned to the commit in [`rules/upstream.json`](rules/upstream.json).
Nothing is hand-edited after vendoring; `./sync-upstream.sh` overwrites it. Each
kit carries the upstream `LICENSE` as `UPSTREAM-LICENSE`.

| Kit | Upstream path | License | Pinned commit | Synced |
|---|---|---|---|---|
| `nextjs` | `cli/kits/nextjs/skills/nextjs` | MIT | `d1b17ed60a7f` | 2026-10-13 |
| `react` | `cli/kits/react/skills/react` | MIT | `d1b17ed60a7f` | 2026-10-13 |
| `tailwindcss` | `cli/kits/tailwindcss/skills/tailwindcss` | MIT | `d1b17ed60a7f` | 2026-10-13 |
| `shadcn` | `cli/kits/shadcn/skills/shadcn` | MIT | `d1b17ed60a7f` | 2026-10-13 |

Native to this pack (not vendored): `hooks/skill-activation-prompt.mjs`,
`lib/compose.mjs`, `rules/estate.json`, `install.sh`.

## What was taken, what was left, and why

| Upstream piece | What it really is | Verdict |
|---|---|---|
| **Framework kits** (nextjs, react, tailwindcss, shadcn) | Pattern references of about 400–600 lines each, plus `resources/`. Accurate and generic. The Tailwind kit is v4-first and keeps v3 config notes. | **Adopt as the framework layer, ranked below brand.** Every example uses placeholder palettes and fonts (`blue-600`, `Inter`). `Inter` is banned in the Arcanea properties, so the composed rules always end with a precedence line that names the repo's own design files. |
| **skill-rules.json + `skill-activation-prompt.ts`** | The real idea in the kit: prompt keywords and intent regexes decide which skills the model reads first, injected on `UserPromptSubmit`. | **Adopt the schema, rewrite the hook.** Upstream runs `npx tsx`, which needs `node_modules` in `.claude/hooks` and a network fetch on a cold cache. It also matches path globs against the session cwd, so `app/**` fires for any checkout under a path containing `app/`. It routes to skills that are not installed without noticing. `skill-activation-prompt.mjs` is zero-dependency, checks each target exists, and lists every match in priority order. |
| **`claude-setup` installer** | Framework detection plus a copy into `.claude/`. | **Rejected.** Its first step is `rm -rf .claude` when one exists. In the estate repos that directory holds the web-excellence and estate-guard gates. `install.sh` here only adds, sets replaced kits aside, and merges one hook. |
| **Core agents and commands** (code-architecture-reviewer, refactor-planner, `/dev-docs`, `/build-and-fix`, …) | Generic workflow prompts. | **Skipped.** The estate already carries sharper equivalents (`design-architect`, `design-verifier`, `/code-review`, the `planning-with-files` loop). Adding a second set splits routing. |
| **Optional Stop hooks** (`tsc-check`, `trigger-build-resolver`, `stop-build-check-enhanced`) | Shell scripts that run builds on Stop. | **Skipped.** They block on a slow monorepo build every turn. Repos already gate builds in CI and in `web-release-gate`. |
| **express, nodejs, prisma, mui, tanstack-\* kits** | Backend and alternative-UI kits. | **Not vendored yet.** No production site in the estate uses them. Add one to `KITS` in `sync-upstream.sh` when a repo needs it. |
