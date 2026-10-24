# Claude Code / Agent Harness Instructions

This repository defines skills and enforcement packs for the Anthropic Claude ecosystem. Agents must follow the instructions detailed in this file and in `AGENTS.md`.

## Key Directories

*   `free-skills/`: Contains the public skills catalog. Each skill must have its own directory containing a `SKILL.md` with proper frontmatter.
*   `packs/`: Enforcement packs that provide mechanisms for verifying skills (CI hooks, checks, templates).
*   `scripts/`: Validation, generation, and other CI scripts.
*   `docs/`: Generated catalog output and static HTML.
*   `runtimes/`: Guides for various runtime platforms.

## Validation, Build, and Lint Commands

Whenever modifying files, especially skills or packs, always run validation scripts before pushing:

*   **Validate skills frontmatter & structure:** `python3 scripts/validate_skills.py`
*   **Run all test suites:** `node --test` (includes pack tests and absorption gates)
*   **Check internal links:** `python3 scripts/check_links.py`
*   **Generate and check catalog sync:** `python3 scripts/generate_catalog.py --check`
*   **Generate and check catalog site sync:** `python3 scripts/generate_site.py --check`
*   **Check README counts:** `python3 scripts/check_counts.py`
*   **Build catalog and check JSON sync:** `node scripts/build-catalog.mjs --check`

## Conventions and Rules

*   **Consult `AGENTS.md`**: `AGENTS.md` contains the cross-harness operating contract, inherited estate rules, guardrails, and non-waivable constraints. **Always obey `AGENTS.md` rules.**
*   **Single Scope per Branch**: Agents must work on a single bounded context per branch (one agent = one branch) to prevent collisions.
*   **No Absolute Machine Paths as Docs**: Do not document internal machine-specific paths as standard URLs or global usage points.
*   **Do Not Touch Prohibited Areas**: Avoid changes to payments/checkout/billing/webhooks, auth, secrets, `.env` files, `vercel.json`, `.github/workflows`, brand/product copy, or income/earnings claims, unless explicitly named in the task scope.

## Architecture

*   Skills define capabilities and triggers through `.md` files. They act as prompts loaded dynamically by a skills-aware runtime.
*   Packs enforce those rules through runnable mechanisms (bash scripts, hooks, workflow setups).

For detailed guidance on creating new skills, refer to `CONTRIBUTING.md` and `spec/README.md`.
