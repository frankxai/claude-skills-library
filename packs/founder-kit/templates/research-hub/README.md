# Research hub

A small website for investigations: each one has a status, a summary and a visible list of sources. It is a Next.js App Router project with MDX content, an RSS feed, `llms.txt` and a sitemap. It uses no paid services, no analytics and no environment secrets.

Part of the Founder Kit pack. This is template 1 of 5.

## Quickstart

1. Copy this folder to a new repo, or deploy it with one of the options below.
2. Run `npm install`.
3. Edit `site.config.json` (title, description, author).
4. Replace `content/investigations/example-reading-a-source.mdx` with your own file. Keep `status: draft` until it is ready.
5. Run `npm run dev`, then `npm run build` before you push.

Set `SITE_URL` (for example `https://research.example.com`) at build time so the feed, sitemap and `llms.txt` carry absolute links. It is a public URL, not a secret.

## How the publication gate works

Each file in `content/investigations/` has a status:

| Status | Renders on site | In feed, sitemap, llms.txt | Label shown |
|---|---|---|---|
| `draft` | No | No | none |
| `analysis` | Yes | Yes | Analysis, not yet reviewed |
| `reviewed` | Yes, listed first | Yes | Reviewed |

`npm run build` runs `scripts/check-publication.mjs` first (the `prebuild` script). It fails the build when:

- `title`, `kind` or `summary` is missing, or `status` is not one of the three values.
- Any source lacks a title, a valid http(s) `url`, or an `accessed` date in `YYYY-MM-DD` form.
- `status` is `reviewed` and the file has no source with both a `url` and an `accessed` date.

Two fixtures prove it: `npm run test:gate` checks that `scripts/fixtures/pass` passes and `scripts/fixtures/fail` fails. The gate checks that evidence is present. It does not check that the claims are true, so a second person should read the sources before you mark a file `reviewed`.

## Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Ffrankxai%2Fclaude-skills-library&root-directory=packs%2Ffounder-kit%2Ftemplates%2Fresearch-hub&project-name=research-hub)

Needs verification after merge: this button points at the `main` branch of `frankxai/claude-skills-library`, so it works only once this folder is on `main`, and the root-directory parameter has not been tested. If it fails, import the repo in Vercel and set the root directory to `packs/founder-kit/templates/research-hub`. Add `SITE_URL` as an environment variable.

## Deploy to Cloudflare Pages (static export)

`next.config.mjs` sets `output: 'export'` when `DEPLOY_TARGET=cloudflare`:

```bash
SITE_URL=https://your-site.pages.dev npm run build:static
```

This writes a static site to `out/`. Create a Pages project, set the build command to `npm run build:static`, the output directory to `out`, and add `SITE_URL` and `DEPLOY_TARGET=cloudflare` as variables. Every route here is static, so nothing else changes.

## Accessibility

Visible focus on links, a skip link, semantic headings, light and dark colour schemes, and `prefers-reduced-motion` turns off all transitions. Labels use sentence case and the template ships no emoji.

## Files

- `content/investigations/*.mdx`: your content.
- `lib/investigations.ts`: loads files, drops drafts.
- `app/`: index, `[slug]`, `feed.xml`, `llms.txt`, sitemap, robots.
- `scripts/check-publication.mjs`: the gate.
