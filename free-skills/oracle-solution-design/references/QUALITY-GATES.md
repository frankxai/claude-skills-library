# Quality Gates Reference

> **Purpose:** Formalized pass/fail criteria between solution design phases.
> **Used by:** /oracle-solution-design orchestrator skill.

---

## Gate 1: Discovery Complete

**Blocks:** Phase 2 (ARCHITECT) cannot start until this passes.

| Criterion | Check | Pass If |
|-----------|-------|---------|
| Use cases identified | Count top use cases | >= 3 documented |
| OCI service mapping | Each use case has candidate services | All mapped |
| Constraints captured | Compliance, timeline, budget documented | All present |
| Existing patterns checked | oracle-quickstart + AI Blueprints reviewed | Confirmed |
| Confidentiality | No real names in any output | Zero violations |

**Verdict:** ALL criteria must pass. If any fail, return to Phase 1.

---

## Gate 2: Architecture Validated

**Blocks:** Phase 3 (VISUALIZE) cannot start until this passes.

| Criterion | Check | Pass If |
|-----------|-------|---------|
| Services verified | Each OCI service confirmed in official docs | All verified |
| Pricing sourced | Every cost from oracle.com/cloud/price-list/ | All sourced with date |
| No blanket claims | No "X times cheaper" without model-specific comparison | Zero violations |
| Patterns checked | oracle-quickstart, technology-engineering reviewed | Confirmed |
| Well-Architected | Follows OCI WAF pillars (security, reliability, perf, cost) | Addressed |
| Confidentiality | No real names, codename only | Zero violations |
| AI Blueprints | Decision tree consulted for GenAI workloads | Documented |
| Model selection | OCI GenAI matrix consulted | Model choices justified |

**Verdict:** ALL criteria must pass. Architecture docs ready for visual translation.

---

## Gate 3: Visuals Compliant

**Blocks:** Phase 4 (PROTOTYPE) cannot start until this passes.

| Criterion | Check | Pass If |
|-----------|-------|---------|
| Logo-free | Visual inspection of every image | ZERO Oracle logos |
| Service names | Match official Oracle branding | 26ai not 23ai, correct names |
| Spelling | No typos in diagrams | Zero errors |
| Resolution | Readable at 1920x1080 | Confirmed |
| Accuracy | Diagrams match SOLUTION-DESIGN.md | Consistent |
| Brand colors | Oracle Red (#C74634) for accents | Applied |

**Verdict:** ALL criteria must pass. Regenerate any non-compliant images.

---

## Gate 4: Prototype Functional

**Blocks:** Phase 5 (DELIVER) cannot start until this passes.

| Criterion | Check | Pass If |
|-----------|-------|---------|
| Core workflow | End-to-end interaction works | Functional |
| Processing states | Loading/progress indicators visible | Present |
| No dead elements | Every button/link does something | Zero dead links |
| Demo banner | PROTOTYPE/DEMO label visible | Present |
| No real data | All data is mock/synthetic | Confirmed |
| Responsive | Not broken on mobile viewport | Acceptable |

**Verdict:** ALL criteria must pass. Fix any failures before packaging.

---

## Gate 5: Delivery Ready

**Blocks:** Customer handoff cannot happen until this passes.

| Criterion | Check | Pass If |
|-----------|-------|---------|
| File structure | Matches standard layout | All files present |
| README | Contains codename only, no industry/scope | Clean |
| Images | Logo-free (final visual inspection) | Confirmed |
| Prototype | Loads standalone (no build tools needed) | Works |
| BOM | Pricing verified with sources and dates | All sourced |
| Confidentiality | /oracle-confidentiality audit passed | PASS |
| McKinsey test | Would a top consulting firm present this? | Yes |

**Verdict:** ALL criteria must pass. This is the final gate before delivery.

---

## Escalation Rules

If a gate fails:
1. Document the specific failure
2. Return to the relevant phase
3. Fix the issue
4. Re-run the gate
5. Do NOT skip gates, even under time pressure

If the same gate fails 3 times on the same criterion:
1. Flag to user for manual review
2. Ask if the criterion should be adjusted for this engagement
3. Document any exceptions in the SDD

---

*Version: 1.0 | Created: 2026-02-09*
