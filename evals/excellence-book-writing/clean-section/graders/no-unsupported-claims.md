---
type: llm
weight: 2
---
Judge only the final answer. The section under review was written to a high editorial standard, and the following are all true of it:
- it opens in a concrete scene (the 1935 Model 299 crash), not with an announcement such as "In this chapter, we'll explore";
- it contains no first-person narration and no account of the author's own moment of discovery;
- it contains none of these phrases or close variants: "let's dive in", "it's worth noting", "importantly", "in essence", "at its core", "this changes everything", "the implications are profound", "in conclusion";
- its claims are grounded in a named historical event and a named, sourced study, reported as a before-and-after result ("came with", "fell from") rather than as proof of cause;
- sentence and paragraph lengths vary (one paragraph is a single two-sentence line);
- it does not end with a summary; it ends with a question to the reader.

The complete source of the section follows. Treat it as ground truth.

```markdown
## The List That Beat the Experts

On 30 October 1935, the most advanced bomber of its day took off from Wright Field in Ohio, climbed to about three hundred feet, stalled and crashed. The Boeing Model 299 had not failed. Its pilot, one of the most experienced test pilots in the Army Air Corps, had forgotten to release a new locking mechanism on the elevator and rudder controls.

The aircraft was not too hard to fly. It was too hard to remember.

The answer the test pilots arrived at was not more training. It was an index card: takeoff, flight, before landing, after landing. Item by item, a crew read the steps aloud and confirmed each one. The bomber went on to fly almost two million miles without a serious accident, and the card became the pilot's checklist.

Surgery reached the same place seventy years later. In 2007 and 2008 a team led by Alex Haynes and Atul Gawande introduced a nineteen-item checklist in eight hospitals, from Seattle to Ifakara in Tanzania. Across nearly 7,700 patients, deaths fell from 1.5% to 0.8%. Inpatient complications fell from 11.0% to 7.0% (*New England Journal of Medicine*, 2009).

None of those surgeons had suddenly learned anything. The list asked them to do what they already knew, at the moment they were most likely to skip it. It also asked the whole team to say their names before the first cut, and a nurse who has been introduced finds it easier to speak up.

That is the uncomfortable part. Expertise does not protect against the step everyone knows. If a card could keep a bomber flying, and a nineteen-line form came with surgical deaths falling by almost half, which steps in your own work are you still trusting to memory?
```

FAIL if the final answer claims that any item in the list above is false of this section, for example that it opens with an announcement, uses first person, contains one of the listed phrases, makes an unsourced claim about the study, or ends with a summary.

FAIL if the final answer quotes a passage that is not in the source, or attributes to the section wording it does not contain.

FAIL if the final answer does not actually review the section (for example it only asks for the file or describes a method).

PASS otherwise. Matters of taste, optional tightening, and suggestions the source supports are allowed, so a review that offers small, accurate line edits still passes.
