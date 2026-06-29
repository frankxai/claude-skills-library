# AGENTS.md — Premium Intelligence Web OS (cross-agent)

This is the cross-agent equivalent of [`CLAUDE.md`](./CLAUDE.md) for Codex, Cursor, Gemini CLI, and any other coding agent. The rules are identical; only the runtime wiring differs.

## The contract

`_intelligence/` is the source of truth. Read before building. Never build from a vague adjective — produce a scene brief first. Follow the build sequence:

> read docs → page spec → scene brief → static composition → motion → 3D → polish → QA → decision log.

## The hard rules (same as CLAUDE.md)

- Inspect before editing; preserve existing architecture; surgical changes only.
- No dependency that isn't in `package.json` without a justified, logged addition; verify real APIs from source, never memory.
- Don't animate everything — one cinematic moment per page. Motion serves hierarchy.
- No random colors/gradients, stock SaaS layouts, emoji/Unicode-glyph icons, generic equal-card grids.
- Everything responsive; mobile (375px) is first-class.
- No 3D without static poster fallback + mobile simplification + reduced-motion state.
- No raw hex in app code — bind to the brand token source in `brand-worlds.md`.
- No invented awards/metrics/claims. No copying a specific site — deconstruct the principle, build original.
- TODOs go in `decision-log.md`, never in code.

## Runtime wiring (per agent)

- **Codex**: this `AGENTS.md` is auto-read. The slash command lives at `.codex/` or is invoked by name; behavior maps to `_intelligence/agent-manual.md`.
- **Cursor**: `.cursor/rules/premium-web-os.mdc` points here.
- **Gemini CLI**: `.gemini/` adapter points here.
- **Claude Code**: `CLAUDE.md` + `free-skills/premium-web-os/SKILL.md` (slash command `/web-os`).

Multi-agent design flow (when the host repo has the agents): compose `design-architect` → `design-generator` → `design-motion` → `design-verifier`. If those agents are absent, run the same phases single-agent. See [`_intelligence/agent-manual.md`](./_intelligence/agent-manual.md).
