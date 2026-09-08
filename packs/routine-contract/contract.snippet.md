<!-- routine-contract pack — paste into CLAUDE.md and AGENTS.md (or your harness
     equivalent). This is the half of the pack a skill file cannot do: it must be
     in the prompt every unattended session already loads, because a routine's
     own prompt is often owned by a human or another system and cannot be edited
     by an agent. Full contract: .claude/skills/routine-contract/SKILL.md -->

## Scheduled routine protocol — binding on every unattended session

If this session was started by a cron / Routine / CI trigger rather than by a
person, this overrides your routine prompt wherever they disagree.

1. **Preflight first.** Before any scanning, drafting or model calls:
   `node scripts/ops/routine-digest.mjs preflight --routine <name>`. Non-zero exit
   means output cannot be persisted — report red and stop. Do not do the work
   first and discover it afterwards.
2. **Never call opt-in-gated orchestration** (in Claude Code, the `Workflow`
   tool). An unattended session cannot satisfy its "the user asked in their own
   words" requirement, so the call is declined and the routine produces nothing
   while looking successful. Files under `.claude/workflows/` are readable
   *specifications* — follow their phases yourself, or call a plain script.
3. **Finish with the digest.** Last command, always:
   `node scripts/ops/routine-digest.mjs emit --routine <name> --status green|amber|red --bullet "…" --bullet "…" --bullet "…"`.
   Exactly three bullets, each carrying a number, a path, or a named blocker. It
   commits, pushes, and exits non-zero if it could not — let that failure stand.
4. **Relay the block.** Put the printed `ROUTINE-DIGEST` block verbatim at the top
   of your final message, and send it to whatever channel the operator actually
   reads.

**A run that commits nothing must not report green.** Run-history is not an
output — that page is discarded with the container. `SUCCEEDED` means the turn
ended without throwing; it has never meant the routine did its job.
