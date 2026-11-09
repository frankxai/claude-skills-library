---
name: web-steward
description: Keep a website's front-end dependencies and installed design skills current without breaking the page. Covers React, Next.js, three.js, React Three Fiber, drei, Paper Shaders, GSAP, Lenis, Framer Motion, Tailwind, and this pack's own skills. Use when asked to upgrade, update, or audit dependencies on a web repo; when a build or install warns about unmet peer dependencies; before adding any dependency that declares peers; or on a scheduled upkeep run. Produces a peer and drift report from the lockfile and the npm registry, then one upgrade branch per repo with gates and before/after proof. Never merges.
---

# Web steward

Upgrades break pages in two quiet ways: a peer dependency that no longer
matches (the build passes, the component fails at runtime), and a minor bump
that changes how something looks or moves. This skill catches the first
mechanically and the second with screenshots, and it stops at a draft PR.

## 1. Inventory — measure before touching anything

```bash
node .claude/skills/web-steward/peer-check.mjs --root .            # watch list
node .claude/skills/web-steward/peer-check.mjs --root apps/web     # a monorepo app
node .claude/skills/web-steward/peer-check.mjs --root . --all      # every direct dependency
```

It reads `package.json` plus `pnpm-lock.yaml`, `package-lock.json`, or
`node_modules`, and asks the npm registry for each package's peers at the
resolved version. No install is needed. Exit `1` means an unmet peer, and exit
`3` means the registry was unreachable, so nothing was checked. Report a `3` as
"not checked", never as clean.

Then check the pack itself:

- in a site repo, against a `claude-skills-library` clone:
  `diff -rq <clone>/packs/web-excellence/skills .claude/skills | grep -v "Only in .claude/skills"`
  lists every installed pack skill that differs from the pack, and every pack
  skill that is missing. (`install.sh --dry-run` prints "update" for every
  installed skill whether or not it changed, so it cannot answer this.) The fix
  is `install.sh <repo>`, and its diff is reviewed like any other change;
- in `claude-skills-library`: `packs/web-excellence/sync-upstream.sh --check`
  lists vendored skills that drifted from their upstream pins.

## 2. Triage — in this order

1. **Unmet peers.** These are broken now. Fix them by moving versions so the
   ranges hold, either by upgrading the host (React 18 → 19 for R3F 9) or by
   moving the dependent to the line that matches the host (R3F 8 for React 18).
   Pick the option that changes fewer surfaces and say why.
2. **Advisories.** Run `pnpm audit --prod` or `npm audit --omit=dev` if
   available, and record the result as it printed.
3. **Breaking drift.** A major bump, and in `0.x` any minor bump: `0.185 → 0.186`
   is a breaking change by semver. Read the release notes or changelog for every
   version crossed before editing, and list the breaking items you found.
4. **Minor and patch drift.** Batch it, one family per commit.

Leave a bump for later when its notes describe a change you cannot verify here.
Say which one and what would verify it.

## 3. Branch and change

- One branch per repo: `agent/<harness>/web-steward-<yyyy-mm-dd>`, cut from the
  default branch.
- One commit per package family (`react` + `react-dom` + `@types/react`;
  `three` + `@react-three/*` + `@types/three`; `gsap` + `@gsap/react`; and so on),
  so a revert removes one family and nothing else.
- Use the repo's package manager to change versions. Regenerate the lockfile
  with it and never edit a lockfile by hand. Pin `0.x` packages exactly (`-E`).
- Re-run `peer-check.mjs` after each family. Unmet peers must reach zero
  before the next family.

## 4. Gates and proof

- Run the repo's own gates, read from its `CLAUDE.md`/`AGENTS.md`: type-check,
  lint, build at minimum. Paste the result lines.
- Take the route's first-load JS from the build output before and after. A
  dependency upgrade that adds weight is a finding.
- Find the routes that import a changed package (`grep -rl "<package>" app components`).
  Run `visual-proof` on those routes before (default branch) and after
  (upgrade branch), at 375 / 768 / 1440 in light and dark, plus a
  `--reduced-motion` run where they animate. Open the shots and compare them.
- Animation libraries (GSAP, Lenis, Framer Motion) change timing without
  changing pixels. For those routes, also run `review-animations` on any code
  the upgrade forced you to edit.

## 5. Hand off — draft PR, never merge

Open a draft PR with this body, and keep the same block as the reply:

```
Repo:     <name> @ <base sha>
Peers:    before <N unmet> → after <N unmet>   (peer-check output attached)
Bumps:    <pkg> <from> → <to> (<drift class>) — breaking notes: <list or "none in notes">
Deferred: <pkg> — <why, and what would verify it>
Pack:     <skills that differ from the pack, or "in sync">
Gates:    <command → result>, one per line
Weight:   <route> first-load JS <before> → <after>
Visual:   <routes> before/after, 375 / 768 / 1440, light + dark (+ reduced motion)
Open:     <anything not verified>
```

On an unattended run with nothing to upgrade, still leave a durable record:
commit the report or comment on the standing upkeep issue. A run that leaves
nothing behind is indistinguishable from a run that never happened.

## Refusals

- **No `--force`, `--legacy-peer-deps`, or `overrides`/`resolutions` entries to
  silence a peer error.** They hide the mismatch and leave the runtime failure in place.
- **No React or Next.js major mixed into the same commit as other bumps.**
- **No hand edits to vendored skills.** Re-run `install.sh` from the pack.
- **No upgrade on a protected surface**, such as a homepage under a
  preservation contract, without that repo's own preservation steps.
- **Never merge, mark ready, or deploy.** The PR is the deliverable.
