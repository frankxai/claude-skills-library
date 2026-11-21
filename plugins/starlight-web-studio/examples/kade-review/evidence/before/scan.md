# http://127.0.0.1:8765/before.html — machine score 19.5/30

Scanned 2026-11-21T02:31:41.282Z. HTTP 200, 6 KB, TTFB 6 ms, 259 words of server text.

| Dimension | Score |
|---|---|
| search | 0/5 |
| answer | 4/5 |
| mobile | 3/5 |
| access | 3.5/5 |
| craft | 4/5 |
| speed | 5/5 |

## Findings

- **P1 search/description-missing** — No meta description. Fix: Write a 70-160 character description that answers "what is this and for whom".
- **P1 search/canonical-missing** — No rel=canonical. Fix: Add an absolute canonical URL on the canonical host.
- **P1 search/lang-missing** — <html> has no lang. Fix: Set <html lang> so search and screen readers pick the right language.
- **P1 answer/jsonld-missing** — No JSON-LD structured data. Fix: Add JSON-LD for the entity the page is about (Organization/Person + WebSite, then Product, Article or FAQPage as true).
- **P1 access/link-no-name** — 2 links have no accessible name. Fix: Give icon links an aria-label or visually hidden text.
- **P1 craft/stock-vocabulary** — Stock words: seamless, next-gen, next-generation, empower, empowering, cutting-edge, unlock your. Fix: Replace with the noun the buyer uses, the number you measured, the verb the product does.
- **P2 search/title-length** — Title is 4 chars: "KADE" Fix: Keep the title between 15 and 65 characters so it is not truncated or vague.
- **P2 search/h1-multiple** — 2 h1 elements. Fix: Keep one h1; demote the rest.
- **P2 search/heading-skip** — h1 → h3 at "Solar" Fix: Do not skip heading levels; size headings with CSS, not tag choice.
- **P2 search/open-graph-incomplete** — Missing og:title, og:description, og:image. Fix: Add Open Graph title, description and a 1200x630 image so shared links render.
- **P2 search/sitemap-missing** — No sitemap at robots Sitemap: or /sitemap.xml. Fix: Publish sitemap.xml and reference it from robots.txt.
- **P2 mobile/viewport-fit** — viewport-fit=cover not set. Fix: Set viewportFit: "cover" or every env(safe-area-inset-*) resolves to 0.
- **P2 mobile/theme-color-missing** — No theme-color. Fix: Declare theme-color per scheme so the status bar matches.
- **P2 mobile/manifest-missing** — No web app manifest link. Fix: Ship app/manifest.ts with display "standalone" and real icons.
- **P2 mobile/touch-icon-missing** — No apple-touch-icon. Fix: Add a 180x180 apple-touch-icon.
- **P2 access/img-alt-missing** — 1 of 1 <img> have no alt attribute. Fix: Give every image alt text, or alt="" when decorative.
- **info answer/llms-txt-missing** — No /llms.txt. Fix: Optional: publish /llms.txt as a markdown index of the pages an agent should read first.
