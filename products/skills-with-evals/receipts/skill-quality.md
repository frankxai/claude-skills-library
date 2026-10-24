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

Filled in by the commits that fix each finding.
