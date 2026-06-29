# Agent Check

> Agent hygiene gate. Verifies the build was made with discipline, not confident guessing — per [`../../CLAUDE.md`](../../CLAUDE.md) hard rules and the Karpathy-distilled hygiene. Run before declaring work done.

## Assumptions surfaced

- [ ] Assumptions about intent, file paths, schemas, and types were stated — not silently guessed.
- [ ] Where multiple readings existed, they were surfaced rather than picked silently.
- [ ] The vague adjective (premium/cinematic/etc.) was translated into constraints before building, not acted on as a vibe.

## APIs verified from source

- [ ] Every library API used was verified from `node_modules`/installed-version docs — not from memory.
- [ ] Versions confirmed in `package.json` (`three`, R3F, drei, motion, and any others).

## No undeclared dependencies

- [ ] No dependency used that is absent from `package.json`.
- [ ] Any added dependency is justified and recorded in [`../decision-log.md`](../decision-log.md).
- [ ] No second package manager / lockfile introduced.

## Surgical changes

- [ ] Only files the task required were touched.
- [ ] Surrounding style matched; adjacent code not "improved" or reformatted.
- [ ] Pre-existing dead code was flagged, not deleted.
- [ ] Existing architecture preserved unless clearly broken.

## No TODOs in code

- [ ] No `TODO`/`FIXME` left in shipped code — open items moved to [`../decision-log.md`](../decision-log.md) with owner + reason.
- [ ] No placeholder/lorem content left in the shipped output.

## Decision log updated

- [ ] [`../decision-log.md`](../decision-log.md) updated with dependency additions, deliberate trade-offs, and deferred items.

## Spec matches output

- [ ] The committed page spec actually describes what shipped.
- [ ] The scene brief's dominant idea and rubric targets match the built scene.
- [ ] No fabricated claims (awards, certifications, client outcomes, metrics) unless the user supplied them.
