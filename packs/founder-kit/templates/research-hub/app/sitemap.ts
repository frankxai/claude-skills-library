import type { MetadataRoute } from "next";
import { getPublished, siteUrl } from "../lib/investigations";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${siteUrl}/` },
    ...getPublished().map((i) => ({ url: `${siteUrl}/${i.slug}/`, lastModified: i.updated || undefined })),
  ];
}
