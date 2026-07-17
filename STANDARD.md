# Agent Skill Standard

This repository is the reference home of the **[Agent Skill Standard](./standard/)** — an open
specification, six-level maturity model, and conformance validator for production AI agent skills.

- **Specification:** [`standard/SPEC.md`](./standard/SPEC.md)
- **Maturity model (L0–L5):** [`standard/MATURITY-MODEL.md`](./standard/MATURITY-MODEL.md)
- **Conformance + validator:** [`standard/CONFORMANCE.md`](./standard/CONFORMANCE.md) · [`standard/validate-skill.mjs`](./standard/validate-skill.mjs)
- **Reference skills:** [`standard/examples/`](./standard/examples/)

```bash
node standard/validate-skill.mjs standard/examples/customer-discovery-synthesis
# => Maturity: L4 Governed
```

**Version:** 1.0.0 · **Steward:** [FrankX](https://frankx.ai) · Built on
[Anthropic Agent Skills](https://agentskills.io/specification).

The standard is named after the thing, not the author: FrankX stewards it, the ecosystem owns it.
Every skill in this library is authored to it; the format primitive (L1) comes from Anthropic, and
the evaluation, governance, and composition levels (L2–L5) are what this standard adds.
