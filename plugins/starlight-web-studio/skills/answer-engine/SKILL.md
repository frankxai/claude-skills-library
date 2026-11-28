---
name: answer-engine
description: Make a site findable by search engines and citable by AI answer engines (Google AI Overviews and AI Mode, ChatGPT search, Claude, Perplexity). Use for SEO or AEO/GEO work, structured data, JSON-LD, robots.txt and AI crawler policy, sitemaps, llms.txt, metadata, "why don't we show up in AI answers", or when studio-scan reports search or answer findings. Grounded in Google's published guidance; separates what is required from what is optional hygiene.
---

# Answer engine

Answer engines quote pages they can fetch, parse and trust. Most of that is old
SEO done properly. Start there, then add the parts that are specific to AI.

## What Google actually says

Google's "AI features and your website" guidance (developers.google.com/search,
last updated 2025-12-10) states that appearing in AI Overviews and AI Mode needs
no special file, markup or schema beyond normal Search eligibility. It
recommends: crawlable pages, internal links, good page experience, important
content in text, and structured data that matches the visible text.

So: never promise that llms.txt or a schema type earns a ranking. Re-read that
page before quoting it; guidance changes.

## The order of work

1. **Fetchable.** 200 on the canonical host, no accidental `noindex` (meta or
   `X-Robots-Tag`), a sitemap referenced from robots.txt.
2. **Readable without JavaScript.** Server-render the core copy. Content that
   ships at `opacity:0` or lives only in a canvas is invisible to any consumer
   that does not run and finish your scripts. Give canvas heroes a real h1.
3. **One page, one answer.** The h1 and the first paragraph state what this is,
   who it is for, and the one fact a person would quote. Questions people ask
   get their own headed sections with the answer in the first sentence.
4. **Structured data that matches the page.** JSON-LD for the publisher
   (`Organization` or `Person` with `sameAs`), `WebSite`, then only what is true
   on the page: `Product` with real offers, `Article` with author and dates,
   `FAQPage` only when the questions are visible. Validate with the Rich Results
   Test; a block that fails to parse is ignored entirely.
5. **Crawler policy is a decision, not a default.** Distinguish:
   - search and user-fetch agents (OAI-SearchBot, ChatGPT-User, Claude-SearchBot,
     Claude-User, PerplexityBot): blocking them removes you from their answers;
   - training crawlers (GPTBot, ClaudeBot, Google-Extended, Applebot-Extended,
     CCBot): a licensing choice. Record the choice in the repo.
   Check each vendor's current crawler documentation before writing rules; names
   change.
6. **Optional hygiene.** `/llms.txt` as a short markdown index of the pages an
   agent should read first, served as text, never as an HTML fallback.
7. **Entity consistency.** Same name, description and links across the site,
   the JSON-LD `sameAs`, and the profiles it points to.

## In a Next.js App Router repo

- Metadata through `export const metadata` or `generateMetadata`, with
  `alternates.canonical` absolute and on the canonical host.
- `app/robots.ts` and `app/sitemap.ts`, not static files that drift.
- One JSON-LD component per entity, rendered server-side with
  `<script type="application/ld+json">`; never build it from client state.
- `app/llms.txt/route.ts` returning `text/plain` if you ship one.

## Measure

Run `studio-scan.mjs` before and after. Report the search and answer scores and
the facts block (`jsonLdTypes`, `aiSearchBlocked`, `words`). For live citation
checks, ask the engines directly with the questions a buyer would type and
record which page, if any, was cited. That is the outcome; the scan is the input.
