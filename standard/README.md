# The Agent Skill Standard

> An open specification, six-level maturity model, and conformance validator for production AI agent skills.

[![Built on Agent Skills](https://img.shields.io/badge/built%20on-Agent%20Skills-blue.svg)](https://agentskills.io/specification)

**Version:** 1.0.0 · **Status:** stable · **Steward:** [FrankX](https://frankx.ai)

---

## What this is

Anthropic's [Agent Skills](https://agentskills.io/specification) format gave the ecosystem a clean primitive: a folder with a `SKILL.md` that an agent loads by progressive disclosure. That primitive is the foundation. It does not, by itself, tell a team when a skill is *trustworthy enough to depend on*.

The **Agent Skill Standard** answers that. It is a thin layer on top of Agent Skills that adds the three things production teams need:

1. **Evaluation** — proof a skill works on purpose, not by luck.
2. **Governance** — an owner, a version, a risk tier, and a rollback path.
3. **Composition** — safe behavior inside a bundle, with attestation and a clear boundary.

It is named after the *thing*, not the author. FrankX stewards it; the ecosystem owns it.

## Why a standard, not a brand

A standard earns trust by being checkable. So this repository ships:

- [`SPEC.md`](./SPEC.md) — the normative specification (what a conforming skill must contain).
- [`MATURITY-MODEL.md`](./MATURITY-MODEL.md) — the six levels, L0 Prompt to L5 Composed.
- [`CONFORMANCE.md`](./CONFORMANCE.md) — the checklist and how the validator maps a skill to a level.
- [`validate-skill.mjs`](./validate-skill.mjs) — a zero-dependency validator that reports a skill's maturity level.
- [`examples/`](./examples/) — reference skills at L1 and L4.

## Quick start

```bash
# Report the maturity level of any skill folder
node standard/validate-skill.mjs standard/examples/customer-discovery-synthesis
```

```
customer-discovery-synthesis
  L1 Documented   PASS  valid SKILL.md, name + trigger description
  L2 Referenced   PASS  references/ + scripts/, body 41 lines
  L3 Evaluated    PASS  evals/scenarios.md (3 scenarios)
  L4 Governed     PASS  owner, version, risk_tier, rollback present
  L5 Composed     n/a   no composition declared
  => Maturity: L4 Governed
```

## Relationship to the ecosystem

| Layer | Owner | Role |
|---|---|---|
| Agent Skills format | Anthropic | The `SKILL.md` primitive + progressive disclosure (defines L1) |
| **Agent Skill Standard** | FrankX (steward) | Adds evaluation, governance, composition (L2–L5) |
| [claude-skills-library](https://github.com/frankxai/claude-skills-library) | Open source | 100+ MIT skills authored to this standard |
| [SIP](https://github.com/frankxai/Starlight-Intelligence-System) | Starlight | Cross-party attestation + sovereignty (the substrate behind L5) |

## License

The specification text and tooling in this directory are released under the repository's [MIT license](../LICENSE). Reuse freely; attribution to the Agent Skill Standard is appreciated.

---

Stewarded by [Frank Riemer](https://frankx.ai). For builders, not consumers.
