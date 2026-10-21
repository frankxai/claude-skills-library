# Answer key: seeded problems in checklists-draft.md

Not shown to the model under test. The runner never stages files named `KEY.md`, and the case exposes only `resources/`. The same facts appear in the judge rubrics in `graders/`, which only the judge sees.

The review is an editorial pass against the anti-patterns in `free-skills/excellence-book-writing/SKILL.md`. The study figures (Haynes et al., *NEJM* 2009: 1.5% to 0.8% deaths, 11.0% to 7.0% inpatient complications, eight hospitals, nearly 7,700 patients) are accurate and declared out of scope, so the case tests prose judgment, not fact-checking.

| # | Problem | Where | Section of the skill | Grader |
|---|---|---|---|---|
| 1 | Announces instead of doing; opens without tension | "In this chapter, we'll explore …" | The Announcement Pattern; Opening: Create Tension | `d1-announcement` |
| 2 | Author's discovery moment as the main event | "The moment I understood everything was 2 AM …" | The Self-Congratulation Pattern; Cardinal Rule 2 | `d2-self-congratulation` |
| 3 | Asserted significance | "This changes everything. The implications are profound." | The Hollow Enthusiasm Pattern | `d3-hollow-enthusiasm` |
| 4 | Stock generated phrasing | "Let's dive in", "It's worth noting that" | The AI Tell-Tale Signs | `d4-ai-tells` |
| 5 | Sweeping unsupported claim | "Every great surgeon in history has relied on a checklist." | Cardinal Rule 4, Factual Grounding | `d5-ungrounded-claim` |
| 6 | Abstract nominalised jargon | "The implementation of checklist methodologies …" | Concrete Over Abstract | `d6-abstract-jargon` |
| 7 | Three paragraphs on one template | "First, … Second, … Third, …" | The Template Pattern | `d7-template-structure` |
| 8 | Summary ending | "In conclusion, we've seen that …" | Ending: Invite, Don't Conclude | `d8-concluding-ending` |

Unlike the book-publishing suite, every problem here is one a strong general editor can find without the skill. That is deliberate: this skill claims to raise general editorial judgment, so its suite asks whether loading it finds more of these, more reliably, with better fixes. A small or zero delta is a real and publishable result.

Checked on purpose and not problems: the study paragraph is accurate and sourced, and the operating-room sentence ("a dozen people, hundreds of instruments") is a fair, concrete description.

Revision 2, 2026-10-21: a Codex review caught that revision 1 misdated the study (2008 and 2009; it ran October 2007 to September 2008), called its outcome "major" rather than "inpatient" complications, and counted operations rather than patients; all corrected in both fixtures and the clean grader. The opening sentence also lost an ungrounded comparison ("outperform years of expert training") so the fixture holds one sweeping claim, not two.
