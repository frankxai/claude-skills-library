# Decision Log

Durable record of architectural decisions, dependency additions, deliberate trade-offs, and open TODOs. TODOs live **here**, never in code. Append entries; never rewrite history.

## Format

```
### YYYY-MM-DD — <short title>
- Decision: <what was decided>
- Why: <rationale>
- Owner: <who> · Status: <open | done | deferred>
- Impact: <files / deps / reversibility>
```

---

### 2026-06-28 — Premium Intelligence Web OS established
- Decision: Build the OS as a meta-layer in `claude-skills-library/premium-web-os/`; unify existing brand canons rather than author a third.
- Why: FrankX (`design.md`/`taste.md`) and Arcanea (`TASTE.md`/`DESIGN.md` + `@arcanea/design-system`) already encode world-class taste; duplication would create drift.
- Owner: Frank (via Claude) · Status: done
- Impact: new `premium-web-os/` tree + `free-skills/premium-web-os/SKILL.md`; first flagship in `arcanea-ai-app`.

### 2026-06-28 — Command naming
- Decision: primary `/web-os`; aliases `/wos`, `/wde`; skill id `premium-web-os`.
- Why: matches the system identity; avoids collision with existing `/design-gods` / `/design-review`; avoids misleading web3/web5 framing.
- Owner: Frank · Status: done

### 2026-06-28 — Optional deps (lenis, postprocessing)
- Decision: not added by default; add per-scene only when smooth-scroll choreography or bloom is required, always lazy-loaded.
- Why: the OS must not force dependencies; arcanea-ai-app currently ships neither.
- Owner: Frank · Status: open (revisit when the Arcanea flagship scene is finalized)

### 2026-06-28 — Skill made self-contained
- Decision: Move the entire OS (CLAUDE/AGENTS/README/.cursor + `_intelligence/`) inside `free-skills/premium-web-os/` and leave a pointer README at the old top-level `premium-web-os/`.
- Why: a registry skill must be installable as one folder — the canon has to travel with `SKILL.md` so `/web-os` can read it after `cp -r … ~/.claude/skills/`. Single source of truth, no drift.
- Owner: Frank · Status: done
- Impact: install path is now `free-skills/premium-web-os/`; arcanea refs + the flagship CTA link updated to `tree/main/free-skills/premium-web-os`.
