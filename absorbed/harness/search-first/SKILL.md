---
name: search-first
description: "Look for an existing repo, package, and skill before writing a new one. Use when starting a feature, adding a dependency, or about to create a folder or utility on Frank's machine."
license: MIT
---

# Search before you add a folder

On this machine the search order is fixed. Do the steps you can, then write.

1. Match the name under `C:/Users/frank/starlight/repos`. Do not recurse from `C:\`, from the home directory, or from This PC. Phone Link will download files if you do.
2. Check `gh` for `frankxai` and, when the brand is Arcanea, the dormant `Arcanea-Labs` org.
3. Read the domain guide that already owns the topic.
4. Pick one child repo. Record path, git toplevel, origin, and branch.
5. Run `python C:/Users/frank/.starlight/workspace-bootstrap/route_work.py guard` from that repo. A refuse means you are still in the wrong place.

## What you may install

- `pnpm` when the lockfile is pnpm. `uv` for Python. Podman when a container is required.
- A single named skill whose license is MIT, Apache-2.0, BSD, ISC, CC0, CC-BY, or Unlicense.

## What you do not install

- A catalog, a marketplace `full` profile, or a second orchestrator.
- A new top-level folder under `C:/Users/frank`.
- Anything from `C:/Users/frank/universe`. That tree is quarantined.

## Decision

- Depend, when their repo is the runtime and you can pin a commit.
- Absorb, when the value is a procedure and you can re-express it through `node scripts/absorb.mjs` in the skills library.
- Adapt, only for a system this machine already runs.
- Build, when the first three searches came back empty and you wrote down what you searched.

## Where this came from

The adopt-or-build choice follows affaan-m/ECC `skills/search-first` at `4eb71d92a39cab44ad40ac9d8a6a5ccb4029d6c2` (MIT). The path order, the Phone Link ban, and the location gate are estate rules.

Built on SIP.
