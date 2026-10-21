# Answer key: seeded problems in chapter-02-iron-discipline.md

Not shown to the model under test. The runner never stages files named `KEY.md`, and the case exposes only `resources/`. The same facts appear in the judge rubrics in `graders/`, which only the judge sees.

The review is a pre-publication quality gate against the rules in `free-skills/book-publishing/SKILL.md`: the Spartan Mindset book profile and the cross-book standards. Length is out of scope and the prompt says so, because a 600-word fixture would otherwise trip the 2,000 to 3,000 word target in every arm.

| # | Problem | Where | Rule in the skill | Grader | Needs the skill? |
|---|---|---|---|---|---|
| 1 | Emoji in book content | "You may never do less" | Universal rule 1, no emoji | `d1-emoji` | no |
| 2 | Hashtags | last line | Universal rule 2, no hashtags | `d2-hashtags` | no |
| 3 | AI-sounding phrases | "Let's delve into", "It's important to note that", "In conclusion" | Universal rule 3 | `d3-ai-phrases` | no |
| 4 | Spiritual / manifestation language | "Align your energy with the universe … vibes" | Spartan rule: no spiritual language, no manifestation talk, no "vibes" | `d4-spiritual` | partly |
| 5 | Eight-sentence paragraph | "Iron Is Built in Sets" | Spartan rule: paragraphs max 4 sentences | `d5-paragraph-length` | yes |
| 6 | Ends with "Conclusion" instead of "The Standard" | last section | Spartan rule: every chapter ends with "The Standard" | `d6-standard-section` | yes |
| 7 | Unsourced statistic | "Research shows that 92% …" | Quality gate: specific claims have cited sources | `d7-unsourced-stat` | no |
| 8 | Misattributed epigraph | Leonidas I quote (generally credited to Jim Rohn) | Universal rule 5: epigraphs real, attributed, verifiable | `d8-epigraph` | no |

The last column is the design: five problems a careful editor finds without the skill, two only the skill's book profile can supply, and one in between. A lift that comes only from rows 5 and 6 means the skill is carrying house rules, which is its job; a lift on rows 1 to 3, 7 and 8 would mean it also sharpens general review.

Checked on purpose and not problems: every other paragraph has four sentences or fewer, the protocol is concrete (floor, sets, distances, a four-week block), and the training metaphors fit the book.

Revision 2, 2026-10-21: after a Codex review, "Motivation runs out by the second week" became "Motivation fades" so the fixture holds one unsourced claim, not two; `d3` also accepts "In conclusion"; `d4` accepts deleting the sentence; `d8` accepts removing the epigraph.
