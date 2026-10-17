# Model and effort routing

The one-paragraph rule is in `SKILL.md`. This page carries the longer table, the evidence status per
task class, and how to behave when the top tier's quota is scarce.

## Contents

1. The rule
2. Task classes with evidence status
3. Spending a scarce top tier
4. Effort inside a tier
5. Anti-patterns

## 1. The rule

Route to the cheapest tier **whose failure you would catch**. Route to the top tier **where a failure
would be silent and inherited**. "Inherited" means other agents read the artifact as instructions: a
contract, a spec, a rubric, a gate, a routing table, a strategy memo that sets priorities.

The autonomy boundary from the Starlight routing doctrine holds everywhere: low-stakes classes may be
re-routed freely; irreversible classes (money path, substrate governance, external side effects) take
the safe default and a human acknowledgment. Substrate changes also take `/starlight-board`.

## 2. Task classes

Evidence column: `measured` means at least two concordant arena rounds in `starlight-evals`;
`doctrine` means routed on reasoning, not receipts. Check `starlight-evals/routing-table.json` before
quoting a status; it moves.

| Task class | Route | Evidence | Note |
|---|---|---|---|
| Constrained output feeding a pipeline (JSON to schema, exact counts, strict format) | Fable | measured (3 rounds) | Opus leaked past caps in three rounds running. |
| Codegen against a clear spec | Haiku or Sonnet | suggestion (n=1, trivial card) | Default Sonnet; escalate on a failing assert. |
| Grounding and extraction from a source | Haiku | suggestion (n=1) | Haiku is verbose on "output only"; use Fable when strict format is also required. |
| Bulk classification, fan-out tagging | Haiku | doctrine + n=1 | Cheap fan-out; verify a sample with a stronger tier. |
| Deep reasoning, architecture trade-offs, long-context synthesis | Opus | doctrine (R5 saturated, no ceiling found) | Escalate the single hardest step to Fable. |
| Agent and skill contracts, rubrics, gates, hooks | Fable | doctrine | Inherited artifacts. One careful pass beats three cheap ones. |
| Adversarial review of another model's work | Fable or Opus, never the maker's tier on the maker's output | doctrine | Maker is never checker. |
| Strategy and decision memos a human acts on | Fable | doctrine | Decision-first, with falsifiers. |
| Money path, substrate governance, external side effects | Fable (safe default) + human ack | binding | Never auto-applied. |

## 3. Spending a scarce top tier

When the top tier has a fraction of its quota left, spend in this order and stop when it runs out:

1. **Contracts and specs** every later agent inherits (this skill is one).
2. **Gates and tests** that make those contracts enforceable without the top tier present.
3. **Review** of what cheaper tiers produced against those contracts, as a different model from the
   maker.
4. **Strategy**: the memo that sets the next week's order of work, with numbers and falsifiers.
5. Never volume. Bulk edits, ports, mechanical syncs and anything a linter could do are Sonnet or
   Haiku work, and a top-tier agent that does them is spending the budget on nothing that compounds.

A useful test: if the artifact would be read by ten agents after you, it is top-tier work. If it
would be read by zero agents and one human once, it is probably not.

## 4. Effort inside a tier

Effort is a second axis. Within any tier:

- **Low**: lookups, status, formatting, single-file edits with a known pattern.
- **Medium**: implementation with a spec, tests, review of a bounded diff.
- **High**: anything whose output is a plan, a contract or a judgment; anything irreversible.

Prefer one high-effort pass with verification over several low-effort passes. Speed without a
check loop compounds error.

## 5. Anti-patterns

- Routing the whole task to the top tier because one step is hard. Split the step out.
- Routing a contract to Haiku because it is "just a markdown file". The file is read as instructions
  by every agent after it.
- Letting the maker's tier review the maker's output.
- Quoting a routing status from memory. The table moves; read it.
- Treating "Fable was used" as evidence of quality. The verification line is the evidence.
