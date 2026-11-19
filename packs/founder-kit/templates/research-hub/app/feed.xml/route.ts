import { getPublished, siteConfig, siteUrl } from "../../lib/investigations";

export const dynamic = "force-static";

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function GET() {
  const items = getPublished()
    .map(
      (i) => `<item><title>${esc(i.title)}</title><link>${siteUrl}/${i.slug}/</link><guid>${siteUrl}/${i.slug}/</guid><description>${esc(i.summary)}</description></item>`,
    )
    .join("");
  const xml = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>${esc(siteConfig.title)}</title><link>${siteUrl}/</link><description>${esc(siteConfig.description)}</description>${items}</channel></rss>`;
  return new Response(xml, { headers: { "Content-Type": "application/rss+xml; charset=utf-8" } });
}
