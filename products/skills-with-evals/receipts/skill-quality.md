# Skill quality lint: pack receipt

Tool: `node scripts/skill-quality.mjs` (rules and sources in the script header). Budget: body at most
500 lines and about 5,000 tokens (characters / 4).

**Why `$<digit>` is a rule.** Claude Code 2.1.310's skill loader (read from the installed binary) replaces
`/\$(\d+)(?!\w)/` with the skill's arguments whenever the skill is invoked with that many arguments, anywhere in
the body, code blocks included; `\$` escapes it. "$250B" is safe (a letter follows); "$5 a month" or SQL
`WHERE id = $1` is not.

## Before (24 Oct 2026, at the commit that adds the lint)

10 checked, **9 failed**.

| Skill | Result | Body lines | ~Tokens | Boundaries section | Cue at char | Failing rules |
|---|---|---|---|---|---|---|
| `ui-ux-design-expert` | FAIL | 713 | 5427 | **no** | 165 | boundaries, size |
| `github-code-review` | FAIL | 89 | 1111 | **no** | 77 | boundaries |
| `nextjs-expert` | FAIL | 707 | 4717 | **no** | 131 | boundaries, size |
| `mcp-architecture` | FAIL | 468 | 2574 | **no** | 113 | boundaries |
| `ai-architect-review` | pass | 229 | 2729 | yes | 65 | — |
| `langgraph-patterns` | FAIL | 315 | 2172 | **no** | 135 | boundaries |
| `skill-builder` | FAIL | 913 | 5535 | **no** | 21 | boundaries, size |
| `product-management-expert` | FAIL | 62 | 780 | **no** | 126 | boundaries |
| `book-publishing` | FAIL | 323 | 4068 | **no** | 78 | boundaries |
| `excellence-book-writing` | FAIL | 303 | 2127 | **no** | 103 | boundaries |

No skill had an unescaped `$<digit>`. The cue-position warnings (six skills past character 100) are the description
fixes proposed in `DESCRIPTION-FIXES.md` (D3). They change routing, so they wait for a before/after trigger
measurement and are not part of this lint's hard rules.

## After

**Fix 1, boundaries (9 skills).** Each skill without one gained a short "When not to use" section, placed after its
opening (or after its Purpose section), that names the adjacent job it should leave alone and, where the pack has
one, the skill to use instead. The sections are consistent with each suite's stay-out task without quoting it.
Descriptions are unchanged, so routing is unchanged. Result: 3 of 10 fail, all on size.

**Fix 2, size (3 skills).** Reference material moved verbatim into `references/`, linked from a "Reference files"
index after "When not to use". Each file says when to read it. Check: every original non-blank line is
in exactly one place afterwards (0 lost); the only added lines are the index and the reference file headers.
The knowledge each suite's answer key depends on stays in the body (WCAG for ui-ux; the Next.js 16 gotchas, Server
Actions, environment variables, Cache Components and security for nextjs; frontmatter, directory layout, progressive
disclosure, descriptions and the validation checklist for skill-builder). The eval harness stages the whole skill
folder, references included. `install-test.mjs`: Claude Code and Codex both see all 10.

| Skill | Result | Body lines | ~Tokens | Boundaries | Cue at char |
|---|---|---|---|---|---|
| `ui-ux-design-expert` | pass | 713 → 252 | 5427 → 2432 | yes | 165 |
| `github-code-review` | pass | 89 → 96 | 1111 → 1255 | yes | 77 |
| `nextjs-expert` | pass | 707 → 306 | 4717 → 2901 | yes | 131 |
| `mcp-architecture` | pass | 468 → 475 | 2574 → 2686 | yes | 113 |
| `ai-architect-review` | pass | 229 → 229 | 2729 → 2729 | yes | 65 |
| `langgraph-patterns` | pass | 315 → 322 | 2172 → 2281 | yes | 135 |
| `skill-builder` | pass | 913 → 412 | 5535 → 3498 | yes | 21 |
| `product-management-expert` | pass | 62 → 69 | 780 → 892 | yes | 126 |
| `book-publishing` | pass | 323 → 330 | 4068 → 4156 | yes | 78 |
| `excellence-book-writing` | pass | 303 → 310 | 2127 → 2220 | yes | 103 |

**Now: 10 checked, 0 failed.** A test (`pack gate`) fails CI if any pack skill regresses or
if a file in a skill's `references/` is not linked from its SKILL.md.

These changes are made before any lift run, so the first measured results describe the skills as they are now.
