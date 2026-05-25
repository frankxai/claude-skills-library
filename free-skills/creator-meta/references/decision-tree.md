# Creator Meta — Decision Tree (abstract)

_The Q1-Q6 walk. For concrete paths, see your creator-specific child skill (e.g., `frankx-meta/references/decision-tree.md`)._

## The walk

```
You have a new artifact. Where does it go?

Q1: Is it inbound and unprocessed?
    (chat export, brain dump, voice memo, screenshot, news clipping)
    → YES: L0 — {creator}/intake/
    → After processing: move to {creator}/intake/processed/{YYYY-MM-DD-slug}.{ext}
    → Add row to {creator}/intake/INDEX.md (source → outputs)

Q2: Is it long-form prose that informs a decision?
    (architecture, plan, brand doc, audit, handover, research note)
    → YES: L1 — {creator}/docs/{topic-or-date-folder}/
    → Topic folders: by domain (architecture/, brand/, design/, research/, …)
    → Dated folders: audits/, handoffs/, plans/, specs/
    → Naming: dated docs use YYYY-MM-DD-{slug}.md

Q3: Is it Claude harness tooling?
    (skill, command, agent, hook)
    → YES: L2
    → Reusable across all your repos? → ~/.claude/{skills,commands,agents,hooks}/  (GLOBAL)
    → Creator-specific? → {creator}/.claude/{skills,commands,agents,hooks}/  (PROJECT)
    → Hooks: register in {creator}/.claude/settings.json to fire

Q4: Is it typed data, MDX content, library code, or build script?
    → YES: L3
    → Typed registry shape? → {creator}/data/{system}.ts (TS over JSON when shape stable)
    → CRM-style human-edited record? → {creator}/data/crm/{file}.json
    → Published prose with components? → {creator}/content/{type}/{slug}.mdx
    → Library function (TS module)? → {creator}/lib/{domain}/{name}.ts
    → Build/generation/migration script? → {creator}/scripts/{name}.{mjs,ts,js}

Q5: Does it ship as a page / component / static asset to your creator's site?
    → YES: L4
    → New top-level route? → {creator}/{app|src/pages}/{route}/page.{tsx,mdx}
    → Dynamic route? → {creator}/{app}/{route}/[slug]/page.tsx
    → API handler? → {creator}/{app}/api/{route}/route.ts (sparingly — prefer SSR)
    → Route-specific component? → {creator}/{app}/{route}/components/{Name}.tsx
    → Shared component? → {creator}/components/{domain}/{Name}.tsx
    → Generic UI primitive? → {creator}/components/ui/{Name}.tsx
    → Static image? → {creator}/public/images/{domain}/{file}
    → OG card? → {creator}/public/og/{slug}.{png|jpg}
    → Rule: server component by default (Next.js); image gen via vendor-neutral pipeline; brand voice clean

Q6: Is it a foundational framework for OTHERS to fork?
    → YES: L5
    → First check: is this already covered by an existing substrate repo?
    → If yes: extend the existing substrate (don't fork it inside the creator repo)
    → If no: create a new sibling repo at ~/{name}/ with:
        - MIT or appropriate OSS license
        - Dedicated brand identity (separate from creator brand)
        - Its own SKILL.md describing what it is
        - Public GitHub repo
    → Then: in creator repo, add a Tier-2 entry to data/ecosystem.ts referencing it

If none fit:
    → You are either (a) misreading the artifact (re-read, re-walk),
      OR (b) inventing a new layer (don't — this requires a meta-rule revision).
```

## Common edge cases

### "It's a doc that has code examples"
- Mostly prose? → L1 (docs/)
- Mostly code? → L3 (lib/ or scripts/)
- Roughly even? → L1 if audience is human reader; L3 if it ships to a route

### "It's a JSON config that drives the app"
- Hand-edited (CRM-style)? → L3 as `data/{name}.json`
- Generated? → script in `scripts/` that produces it; output goes wherever the consumer reads it

### "It's a registry both typed AND human-readable"
- Source-of-truth in TypeScript at L3 (`data/{system}.ts`)
- Human-readable mirror at L1 (`docs/...` or skill `references/`) — labeled as a mirror

### "It's a skill I'd want in OTHER creator repos too"
- Promote to global at `~/.claude/skills/{name}/`
- All your creator repos use the same skill
- Right call for cross-cutting tools (e.g., visual generation, brand-voice, substrate-meta)

### "It's a page that pulls from a substrate repo"
- Page at L4: `{creator}/app/{route}/page.tsx`
- Data accessor at L3: imports from substrate's npm package OR copies the type definitions with absorption-log note
- Don't symlink the substrate repo. Don't reach across the filesystem.

### "It's a private personal note (journal, half-baked idea)"
- Sidecar vault outside the creator repo (e.g., `~/Obsidian/{Creator}-Vault/_daily/`)
- When it crystallizes, promote to the repo per Q1-Q6

### "It's something for the creator's day job"
- Stays out of the creator repo
- Use a separate work-specific skill or `~/Documents/Work/`
- Never commit work-stuff into the creator repo

## When to NOT walk the tree

- Routine edit to an existing file → just edit
- Bug fix in a known file → just fix
- Updating a stale doc → find it, update it

The tree is for **adding new things**, not for every edit.

## Anti-patterns

- "It's a quick experiment, I'll put it in the root" → No root-level files. Find the right layer.
- "I'll add it to multiple registries to be safe" → Pick one canonical.
- "I'll create a new top-level folder for this" → Check existing folders first. New top-level adds require explicit approval.
- "I'll skip the layer model, just this once" → Skipping creates the sprawl this skill prevents.
