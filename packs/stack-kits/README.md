# stack-kits

Framework kits from [blencorp/claude-code-kit](https://github.com/blencorp/claude-code-kit)
plus a prompt router that reads skills in the right order: the release gate first,
the framework second, specialists after, and the repo's own design files above all
of them.

It has three parts:

1. **Four vendored kits**: `nextjs`, `react`, `tailwindcss` and `shadcn`. They are pinned and
   re-syncable, MIT. See [SOURCES.md](SOURCES.md) for what was taken and what was left.
2. **A router hook** (`hooks/skill-activation-prompt.mjs`) on `UserPromptSubmit`. It
   matches the prompt against `.claude/skills/stack-kits.rules.json`, and against a
   repo's own `skill-rules.json` if one exists, then injects one ordered list of skills
   and agents to read. It has zero dependencies and never blocks.
3. **A composer** (`lib/compose.mjs`) that writes that rules file from the kit
   fragments, the estate pairing rules (`rules/estate.json`) and the repo's own
   `stack-kits.local.json`. It keeps only rules whose skill exists in the repo.

Several estate repos already carry a `.claude/skills/skill-rules.json` in the older
ACOS schema (`triggers.keywords`), and no hook reads it. The router reads that file
as well, so those rules start working. The installer never writes it.

## Install

```bash
packs/stack-kits/install.sh /path/to/repo            # detect, install, compose, merge hook
packs/stack-kits/install.sh /path/to/repo --dry-run
packs/stack-kits/install.sh /path/to/repo --kits tailwindcss
```

Detection reads the root `package.json` and `apps/*/package.json`. A kit is not
copied when the repo already has an equivalent skill (`nextjs` → `nextjs-react-expert`).
Its triggers route to the existing skill instead, so one repo never carries two
Next.js skills competing for the same prompt. `--force-kits` overrides this.

Install `web-excellence` first. The router ranks `web-release-gate` as critical, but
only routes to it if it is installed.

## What a routed prompt looks like

```
$ echo '{"prompt":"make the hero responsive with tailwind"}' | node .claude/hooks/skill-activation-prompt.mjs
[stack-kits] Read these skills in order before acting (SKILL.md under .claude/skills/):
  1. web-release-gate [critical] — website work starts here; it sequences audit, motion, performance and visual proof, and defines done
  2. tailwindcss [medium] — Tailwind CSS v4 utility-first styling patterns …
[stack-kits] Precedence: DESIGN.md, TASTE.md outrank every skill listed here. Kit examples use placeholder colors and fonts; use this repo's tokens instead.
```

## Repo-specific rules

Put them in `.claude/skills/stack-kits.local.json`. The installer never writes that
file, and a re-install merges it over the generated rules:

```json
{
  "_precedence": "taste.md and design.md outrank every skill; homepage edits follow docs/strategy/HOMEPAGE-PRESERVATION-CONTRACT.md.",
  "skills": {
    "frankx-brand": { "priority": "high" },
    "shadcn": { "disabled": true }
  }
}
```

## Tests

```bash
node --test packs/stack-kits/tests/*.test.mjs
```

There are 18 checks, all run in CI by `pack-tests.yml`. They cover priority ordering,
word-boundary keywords (including `next.js`), invalid regex tolerance, dead-reference
filtering, the prompt never being echoed, never-block on bad input, path-like skill
names refused, alias, alias-merge and local-override composition, reading ACOS-schema rules, and install idempotency. The
install tests also confirm that existing hooks are preserved and that locally edited
kits are set aside rather than deleted, that a repo's own `skill-rules.json` is never written, and that a `.gitignore` hiding installed files is reported with the exact lines to add.

## Upgrading

```bash
packs/stack-kits/sync-upstream.sh --check   # drift report, exit 1 on drift
packs/stack-kits/sync-upstream.sh           # re-vendor at upstream HEAD
```

After a sync, update the table in `SOURCES.md`, run the tests and re-run `install.sh` in
each repo.
