# Loop-native skills — guidance for skill-creator and plugin-creator

How skills and loops compose, and what a skill author changes when the caller is a
loop instead of a human. Absorb this into any skill-creator / plugin-creator
workflow: the unit of agentic work is shifting from *prompt* to *loop*, and skills
are the subroutines loops call.

## The composition model

```
loop-designer  → compiles a goal into .loop/<name>/   (the program)
loop-runner    → executes one iteration                (the interpreter)
loop-orchestrator → schedules the fleet                (the kernel)
skills         → capabilities an iteration invokes     (the standard library)
```

A charter's Iteration contract and Verification sections routinely name skills
("polish via content-polisher, gate via integrity-guard"). That makes skill quality a
loop-convergence issue: a skill that returns vague results stalls every loop that
calls it.

## Authoring rules for loop-callable skills

1. **Machine-checkable outcomes.** A loop's Verify step needs pass/fail it can read.
   Skills should state their success predicate ("done when `validate.py` exits 0",
   "returns verdict: pass|warn|fail") — not "review the output for quality".
2. **Idempotent and resumable.** Iterations die mid-flight. A skill invoked twice on
   the same input must not corrupt state; partial completion must be detectable
   (files-first design: write artifacts, then a completion marker, in that order).
3. **Evidence-shaped returns.** Return actual command output, counts, paths — the
   runner journals evidence, not summaries. "214 tests passed, 0 failed" beats
   "tests look good".
4. **Declare side-effect class in the description.** Loops enforce promotion gates
   (propose-only → write). A skill that publishes/sends/deploys must say so in its
   frontmatter description so a propose-only iteration refuses it. For manual-only
   side effects, set `disable-model-invocation: true` where the harness supports it.
5. **Bounded per invocation.** One skill call must fit inside one iteration's
   wall-clock budget. Skills that fan out unboundedly ("audit every page") should
   take a scope argument so the loop can pass one unit at a time.
6. **Verbose, actionable failures.** "Field X missing; available: A, B, C" lets the
   next iteration self-correct; a bare stack trace burns an iteration on diagnosis.

## What skill-creator itself should add (the eval loop)

Skill authoring is itself an evaluate-optimize loop — run it as one:

1. **Evals before docs.** Before writing SKILL.md, write ≥3 realistic trigger
   prompts + objectively checkable assertions for each (what files exist after, what
   the output contains).
2. **Baseline first.** Run the evals *without* the skill; write only the minimal
   instructions that close the observed gap. If the bare model already passes, the
   skill section is dead weight — cut it.
3. **Author/tester split.** One fresh context authors; a different fresh context
   runs the evals (same maker/checker rule loops use — the author grading its own
   skill is too generous). Watch actual navigation: missed links, ignored reference
   files, over-read files → restructure.
4. **Optimize the description last.** It is the only routing signal; tune it against
   trigger accuracy (does the skill fire on the eval prompts and stay quiet
   otherwise?), not against elegance.
5. **Ratchet the iterations.** Keep eval scores per revision; a revision that scores
   lower gets reverted, not argued for.

## What plugin-creator should add

Plugins bundle skills + commands + hooks + agents. Loop-native additions:

- **Ship the loop, not just the skill.** If a plugin automates recurring work, include
  a `.loop/` charter template for it (a designed loop) rather than a bare "run me
  daily" note — cadence without discipline is how automations rot into unread logs.
- **Hooks are the deterministic tier.** Anything that must happen every time
  (format-on-write, commit-on-stop, evidence gates, protected-path blocks) belongs in
  a hook, not in skill prose. Skills advise; hooks guarantee.
- **Declare an operator surface.** Where do this plugin's automations report, and
  where does a human steer or stop them? A plugin that runs unattended without a
  report channel and a kill switch fails review.
