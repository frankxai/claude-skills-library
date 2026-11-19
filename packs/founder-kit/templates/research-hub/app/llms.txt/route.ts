import { getPublished, siteConfig, siteUrl } from "../../lib/investigations";

export const dynamic = "force-static";

export function GET() {
  const lines = getPublished().map(
    (i) => `- [${i.title}](${siteUrl}/${i.slug}/): ${i.summary} (${i.status})`,
  );
  const text = `# ${siteConfig.title}\n\n> ${siteConfig.description}\n\n## Investigations\n\n${lines.join("\n")}\n`;
  return new Response(text, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
