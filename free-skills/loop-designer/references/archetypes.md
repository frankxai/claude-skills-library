# Loop archetypes — taxonomy, mechanics, failure modes

Seven load-bearing shapes. Pick the primary one at design time; hybrids inherit the
discipline of the primary. Each entry: mechanic, when to use, termination, the way it
characteristically fails, and the design countermeasure.

## 1. backlog-drain (the Ralph shape)

**Mechanic.** A prioritized `backlog.md` of sized units. Each iteration: pick the top
eligible item → complete it → verify → strike it through → journal. The classic
"dumb loop around a smart agent": `while :; do agent "do one item"; done` converges
because state lives in files and each pass starts fresh.

**Use for.** Migrations, audits-with-fixes, content batches, refactor sweeps — any
goal decomposable into independent-ish units up front.

**Terminates** when backlog.md has no unchecked items and done-when passes.

**Fails by** units that were secretly dependent (item 12 undoes item 4) or oversized
items that die mid-iteration. **Counter:** order the backlog by dependency at design
time; doctor check D5 on sizing; iteration contract forbids starting a second unit.

## 2. ratchet-climb

**Mechanic.** One scalar metric (failing tests, lint errors, bundle KB, audit score,
coverage %). Each iteration must move it the right direction or revert. `best` is a
high-water mark; regressions are reverted, not debugged forward.

**Use for.** Optimization and hardening goals where the units aren't enumerable up
front but the score is always readable.

**Terminates** at the target value in done-when.

**Fails by** Goodharting — the agent games the metric (deletes tests to make tests
pass, suppresses lint rules). **Counter:** pair the ratchet with invariant checks in
Verification that the metric must not be improved *by weakening* (e.g. test count may
not decrease; lint config is a protected path in Guardrails).

## 3. red-green

**Mechanic.** TDD as a loop: iteration N writes one failing test from the spec;
iteration N+1 makes it pass without breaking others; refactor entries are their own
iterations. The test suite is both the backlog and the ratchet.

**Use for.** Building new functionality against a spec; porting behavior.

**Terminates** when the spec checklist is covered and the suite is green.

**Fails by** tests that assert implementation, not behavior — later iterations fight
them. **Counter:** charter rule: tests may only touch public interfaces; a
maker/checker pair where the checker reviews each test before it's committed.

## 4. watch-and-report (read-only sentinel)

**Mechanic.** No writes. Each iteration: read the watched surface (deploys, CI, costs,
inbox, competitors) → diff against `state.json`'s last snapshot → report only the
delta to the escalation channel → snapshot.

**Use for.** The first loop on any new surface — it earns trust before any write loop
exists. Also permanent monitors (cost watch, drift detection).

**Terminates** never; runs on cadence until retired.

**Fails by** reporting everything every time (alarm fatigue → human stops reading) or
silently failing (nobody notices a dead monitor). **Counter:** delta-only reporting
with an explicit "no change" suppression rule, plus a heartbeat entry in the journal
so deadness is detectable.

## 5. evaluate-optimize (generator + judge)

**Mechanic.** Two roles per iteration: generate a candidate → judge scores it against
a written rubric → keep-if-better (the artifact ratchet) → journal the score. The
judge should be a fresh context — ideally a different model — than the generator.

**Use for.** Creative/quality targets: copy, designs, prompts, docs — where "better"
is a rubric, not a test.

**Terminates** when the rubric threshold in done-when is met or budget exhausted
(keep the best candidate).

**Fails by** judge drift (scores inflate to end the loop) and rubric vagueness.
**Counter:** rubric lives in the charter with anchored examples of 3/5/7/10-quality;
judge sees prior best side-by-side and must justify any score delta.

## 6. babysitter

**Mechanic.** Poll an external state machine (PR checks, deploy pipeline, ticket)
→ diagnose the current blocker → apply the smallest unblocking action (rebase,
re-run, targeted fix, comment) → wait for the next transition. Event-driven where the
harness supports subscriptions; polling cadence otherwise.

**Use for.** "Kick it until it's green/merged/deployed" goals with a terminal state.

**Terminates** at the terminal state (merged, closed, deployed, resolved).

**Fails by** looping on the same failed fix, or fixing out-of-scope breakage it
should escalate. **Counter:** journal each attempted fix; same-fix-twice → mandatory
new approach or escalate; charter scopes which failures are the loop's to fix.

## 7. pipeline

**Mechanic.** Stages with gates: stage N's verified output is stage N+1's input
(research → draft → integrity-gate → human-gate → publish). One iteration advances
one artifact one stage. State tracks each artifact's stage.

**Use for.** Production lines: content factories, release trains, data flows.

**Terminates** per-artifact at the final gate; the pipeline itself runs on cadence.

**Fails by** gate-skipping under time pressure and half-staged artifacts piling up
between stages. **Counter:** gates are Verification commands, not judgment calls;
WIP limit in the charter (max artifacts mid-pipeline).

## Choosing under ambiguity

- Enumerable units? → backlog-drain. Only a score? → ratchet-climb.
- Output is code with a spec? → red-green. Output is judged, not tested? →
  evaluate-optimize.
- Goal is *someone else's* state machine? → babysitter. Goal is awareness, not
  change? → watch-and-report. Multi-stage with handoffs? → pipeline.
- Genuinely mixed: primary = the shape of the *termination condition*.
