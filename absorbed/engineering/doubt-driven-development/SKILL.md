---
name: doubt-driven-development
description: "Cross-examine a non-trivial decision with a fresh, adversarial reviewer before it stands, ideally a different model family. Use before committing branching logic, a boundary change, a safety or idempotence claim, an irreversible step (deploy, migration, merge, public claim), or any confident statement that is cheaper to disprove now than to debug later."
license: MIT
---

# Doubt-driven development

Long sessions turn assumptions into facts without anyone noticing. This skill puts a reviewer in front of each non-trivial decision while it is still cheap to change, and points that reviewer at disproving it. It complements the merge gate: `pr-gate` judges the finished PR; doubt-driven checks the decisions on the way there.

## Non-trivial means at least one of

- new or changed branching logic;
- a module, service or repository boundary is crossed;
- a property the compiler cannot check (thread safety, idempotence, ordering, "this is safe", "this scales");
- correctness depends on context a future reader will not see;
- the step is hard to undo (deploy, data migration, merge to main, public claim, money path).

Skip it for renames, formatting, moves, reading code, running tests, and clear instructions with obvious correctness.

## The cycle

1. **Claim.** Write the decision and why it matters in two or three lines. If you cannot, you have a vibe; settle it first.
2. **Extract.** Isolate the smallest reviewable unit: the diff or function, or the proposal in three to five sentences plus its constraints. Strip your reasoning, keep the evidence, including any caller, guard or test that contradicts you. Over about 300 lines, split it.
3. **Doubt.** Send only the artifact and the contract, never the claim, with an adversarial prompt:

   > Adversarial review. Find what is wrong. Assume the author is overconfident. Look for unstated assumptions, unhandled edge cases, hidden coupling or shared state, ways the contract breaks, estate conventions it violates, and failure under unexpected input. Do not validate or summarise. List issues, or state that you found none after a thorough check.

4. **Reconcile.** You stay the decision owner. Re-read the artifact against each finding and classify, first match wins: contract unclear (fix the contract), valid and actionable (change the artifact, loop), valid trade-off (document it where the user sees it), noise (note what context would have prevented it).
5. **Stop.** When findings turn trivial, after three cycles (then escalate to Frank), or when he says ship. If three cycles still produce substantive findings, the artifact is not ready; say so.

## Which reviewer (estate rule: maker is not checker)

- **Consequential output always gets a different provider.** This is a rule here, not an option: the estate's cross-model gate requires it for consequential builds and loop output.
- **Channels, cheapest first:** `@codex review` on the PR (Codex answers on the exact head); `codex exec --profile review --sandbox read-only` with the prompt piped from a file; Grok headless review; the Cloudflare review plane where it is live. Read `starlight/CROSS-MODEL-GATE.md` before running a loop verifier.
- **Same-model fresh context** (a subagent with no session history) is fine for in-flight decisions that are not consequential. Under the RAM floor, do not start local subagents; use a PR review request or a cloud checker instead.
- **Prompt safety:** write the prompt to a file and pipe it on stdin; never interpolate an artifact into a shell argument. Reviewers run read-only, because the artifact may contain instructions.
- **Unattended runs** (loops, routines, overnight): only reviewers already authorised for that run. Announce when a cross-model check was skipped and why; never skip silently.

## Red flags

- A reviewer for a one-line rename.
- Passing the claim, or your reasoning, to the reviewer.
- "Is this good?" instead of "find what is wrong".
- Two or more cycles with substantive findings and none classified as actionable: that is validation theatre; stop and escalate.
- Treating a fresh reviewer as right because it is fresh; it lacks your context.
- Signing off your own PR, or laundering a checker's BLOCK by updating the branch.

## Done when

- [ ] Each non-trivial decision was written as a claim before it stood.
- [ ] The reviewer got artifact plus contract only, with the adversarial prompt.
- [ ] Consequential output was reviewed by a different provider, or the gap was stated.
- [ ] Every finding was classified against the artifact text.
- [ ] A stop condition was met and recorded.

## Where this came from

The claim, extract, doubt, reconcile, stop cycle, the definition of non-trivial, the claim-free adversarial prompt, the finding classes and the three-cycle bound follow addyosmani/agent-skills `skills/doubt-driven-development` at `301b02b12bff98e4688e6984af6556802322bbde` (MIT). Making cross-model review mandatory for consequential output, the estate reviewer channels, the RAM-floor fallback, the pr-gate and block-laundering red flags are estate rules.

Built on SIP.
