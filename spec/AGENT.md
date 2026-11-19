# The agent-file standard

Skills have an open specification (see [`README.md`](README.md)). Agent definitions do not, so this
library states one, and it lives in exactly one place: the `agent-hygiene` skill's
[`references/agent-file-contract.md`](../free-skills/agent-hygiene/references/agent-file-contract.md).

That page defines the frontmatter, the six questions every agent file answers regardless of heading
style, the four admissible shapes found in the estate, the voice rules, the length budget, and the
exact check list (`E1`..`E7`, `W1`..`W10`) that
[`packs/agent-hygiene/ci/agent-lint.py`](../packs/agent-hygiene/ci/agent-lint.py) enforces.

Why a pointer and not a copy: an agent reading an installed repo never sees this `spec/` folder, and
a second copy of the contract here would drift against the one that ships. The skill is the standard;
this file exists so a contributor looking for it in `spec/` finds it.

To check a file against it, in any repo that installed the pack:

```bash
python3 .claude/ci/agent-lint.py .claude/agents/your-agent.md
```

or in this library:

```bash
python3 packs/agent-hygiene/ci/agent-lint.py path/to/your-agent.md
```
