# founder-kit

A free, open pack of starter projects for founders who build with Claude Code. Each template is a small deployable site you can read in an afternoon and rebuild yourself. No paid services, analytics or secrets.

## Templates

| # | Template | State |
|---|---|---|
| 1 | [Research hub](templates/research-hub/README.md): investigations with visible sources and a publication gate | Available |
| 2 | Library | Planned |
| 3 | Blog (same codebase as the research hub, configured as a blog) | Planned |
| 4 | Book studio | Planned |
| 5 | Content studio | Planned |

Planned templates have no code yet.

## Use template 1

Follow the quickstart in [templates/research-hub/README.md](templates/research-hub/README.md). An installer command that copies a template and seeds instruction files is planned and does not exist yet.

## Shared rules for every template

- Next.js App Router with MDX content, a feed, `llms.txt` and a sitemap.
- Static export for Cloudflare Pages through `DEPLOY_TARGET`.
- A prebuild gate that fails the build when a published entry has no evidence.
- No secrets, no `.env` files, no analytics.
