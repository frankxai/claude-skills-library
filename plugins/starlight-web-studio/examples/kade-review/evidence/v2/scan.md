# http://127.0.0.1:8765/v2.html — machine score 28.5/30

Scanned 2026-11-21T02:31:51.623Z. HTTP 200, 12 KB, TTFB 8 ms, 355 words of server text.

| Dimension | Score |
|---|---|
| search | 4.5/5 |
| answer | 5/5 |
| mobile | 4/5 |
| access | 5/5 |
| craft | 5/5 |
| speed | 5/5 |

## Findings

- **P2 search/sitemap-missing** — No sitemap at robots Sitemap: or /sitemap.xml. Fix: Publish sitemap.xml and reference it from robots.txt.
- **P2 mobile/manifest-missing** — No web app manifest link. Fix: Ship app/manifest.ts with display "standalone" and real icons.
- **P2 mobile/touch-icon-missing** — No apple-touch-icon. Fix: Add a 180x180 apple-touch-icon.
- **info answer/llms-txt-missing** — No /llms.txt. Fix: Optional: publish /llms.txt as a markdown index of the pages an agent should read first.
