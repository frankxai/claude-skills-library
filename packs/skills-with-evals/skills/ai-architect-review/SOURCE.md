# Source and provenance

`SKILL.md` in this directory is a **byte-identical mirror**. It is not authored here.

| | |
|---|---|
| Canonical file | [`public/skills/ai-architect-review/SKILL.md`](https://github.com/frankxai/frankx.ai-vercel-website/blob/main/public/skills/ai-architect-review/SKILL.md) |
| Upstream repository | [frankxai/frankx.ai-vercel-website](https://github.com/frankxai/frankx.ai-vercel-website) |
| Pinned commit | `344510ea167be7b98acfff4b9e712de86cf6fcd6` (2026-08-21) |
| `sha256` | `24d39ff51bda161fa125cc223bebdbdb3c4f594e68c3e43f1dd6090950dd001d` |
| License | MIT |

## Why edits go upstream, not here

The upstream repository tests this file. `scripts/check-ai-architecture-contract.mjs`
reads it on every build and fails when its Interview-mode questions, its fix-first
ordering, or its verdict mapping stop agreeing with the browser review runner that
ships the same logic from `app/ai-architect/ReviewRunner.tsx`.

Nothing in this library tests any of that. An edit made to the copy here would
therefore pass CI while silently disagreeing with the page it came from — and the
copy is the one people install. Change the skill upstream, let the contract gate
prove the change, then re-mirror.

## Checking the mirror

Has this copy been hand-edited since it was mirrored?

```bash
sha256sum free-skills/ai-architect-review/SKILL.md
# expect: 24d39ff51bda161fa125cc223bebdbdb3c4f594e68c3e43f1dd6090950dd001d
```

Has upstream moved on without us?

```bash
diff <(curl -fsSL https://raw.githubusercontent.com/frankxai/frankx.ai-vercel-website/main/public/skills/ai-architect-review/SKILL.md) \
     free-skills/ai-architect-review/SKILL.md && echo "in sync"
```

Both are run on demand, not in CI. Wiring the second one into this repository's
`Validate` workflow would make every pull request here depend on another
repository staying reachable, which trades a rare, quiet drift for a frequent,
loud outage. Re-mirroring is a copy and a hash update.
