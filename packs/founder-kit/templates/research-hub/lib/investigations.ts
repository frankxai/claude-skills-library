import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import site from "../site.config.json";

export type Status = "draft" | "analysis" | "reviewed";

export interface Source {
  title: string;
  url: string;
  accessed: string;
  locator?: string;
}

export interface Investigation {
  slug: string;
  title: string;
  kind: string;
  summary: string;
  status: Status;
  example: boolean;
  updated: string;
  sources: Source[];
  body: string;
}

export const siteConfig = site;
export const siteUrl = (process.env.SITE_URL || "http://localhost:3000").replace(/\/$/, "");

const DIR = path.join(process.cwd(), "content", "investigations");

const asDate = (v: unknown): string =>
  v instanceof Date ? v.toISOString().slice(0, 10) : String(v ?? "");

function read(file: string): Investigation {
  const { data, content } = matter(fs.readFileSync(path.join(DIR, file), "utf8"));
  const sources = Array.isArray(data.sources) ? data.sources : [];
  return {
    slug: file.replace(/\.mdx?$/, ""),
    title: String(data.title ?? ""),
    kind: String(data.kind ?? ""),
    summary: String(data.summary ?? ""),
    status: data.status as Status,
    example: data.example === true,
    updated: asDate(data.updated),
    sources: sources.map((s: Record<string, unknown>) => ({
      title: String(s.title ?? ""),
      url: String(s.url ?? ""),
      accessed: asDate(s.accessed),
      locator: s.locator ? String(s.locator) : undefined,
    })),
    body: content,
  };
}

/** Drafts are filtered out here, so no page, feed, sitemap or llms.txt can show one. */
export function getPublished(): Investigation[] {
  if (!fs.existsSync(DIR)) return [];
  const rank: Record<string, number> = { reviewed: 0, analysis: 1 };
  return fs
    .readdirSync(DIR)
    .filter((f) => /\.mdx?$/.test(f))
    .map(read)
    .filter((i) => i.status === "reviewed" || i.status === "analysis")
    .sort((a, b) => rank[a.status] - rank[b.status] || b.updated.localeCompare(a.updated));
}

export function getBySlug(slug: string): Investigation | undefined {
  return getPublished().find((i) => i.slug === slug);
}

export const statusLabel: Record<Status, string> = {
  draft: "Draft",
  analysis: "Analysis, not yet reviewed",
  reviewed: "Reviewed",
};
