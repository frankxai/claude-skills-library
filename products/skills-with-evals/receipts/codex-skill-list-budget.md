# Codex skill-list trimming · measured 2026-10-24 · codex-cli 0.164.0

**Finding:** Codex does not show a fixed ~100 characters of each skill description. It fits *all installed
skills* (from every plugin) into one model-visible list with a fixed budget, and trims every description
evenly once the list would exceed it. In these runs the list plateaued at about **20,600–20,800
characters** of `- <plugin>:<skill>: <description> (file: …)` lines.

| Skills installed | Description length shown (min / median / max) | Total list characters |
|---|---|---|
| 10 (`skills-with-evals`) | 191 / 252 / 395, **full** | not recorded |
| 20 | 236 / 290 / 460, full | 9,282 |
| 30 | 210 / 290 / 460, full | 13,777 |
| 40 | 210 / 289 / 533, full | 18,138 |
| 60 | 190 / 192 / 195, **trimmed** | 20,619 |
| 80 | 106 / 108 / 110, trimmed | 20,826 |
| 114 (`claude-skills-library`) | 102 / 104 / 106, trimmed | not recorded |

The 20–80 rows used a probe plugin named `n<N>` holding the first N skills of `catalog/skills.json`. With
that short plugin name, 114 skills trimmed to 120–124 characters rather than 102–106. The plugin name is
part of each line, so it spends the same budget.

**What it means for a skill author:**
- With a small install (≤ 40 skills here), Codex sees the whole description.
- With a large install (≈ 80+ skills across all plugins, common for daily users), only about the first
  100 characters survive. A "use when" after that point is cut.
- Put the trigger cue early. `scripts/trigger-lint.mjs` warns when it starts after character 100.

**How to reproduce:**

```bash
H=$(mktemp -d -p "$PWD"); mkdir -p $H/.codex
HOME=$H CODEX_HOME=$H/.codex codex plugin marketplace add "$PWD"
HOME=$H CODEX_HOME=$H/.codex codex plugin add claude-skills-library@claude-skills-library   # or skills-with-evals@…
HOME=$H CODEX_HOME=$H/.codex codex debug prompt-input "review this diff" | sed 's/\\n/\n/g' | grep -E '^- [a-z0-9-]+:'
```

**Correction:** earlier text in this PR said "Codex shows only about the first 100 characters of each
description". That held for the full library (114 skills), not in general. The independent G2 install
caught it: Codex showed the 10-skill pack's descriptions in full.
