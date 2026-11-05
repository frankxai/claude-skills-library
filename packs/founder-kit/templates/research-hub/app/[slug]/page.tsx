import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { getBySlug, getPublished, statusLabel } from "../../lib/investigations";

export const dynamicParams = false;

export function generateStaticParams() {
  return getPublished().map((i) => ({ slug: i.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const i = getBySlug((await params).slug);
  return i ? { title: i.title, description: i.summary } : {};
}

export default async function Investigation({ params }: { params: Promise<{ slug: string }> }) {
  const i = getBySlug((await params).slug);
  if (!i) notFound();
  return (
    <article>
      <h1>{i.title}</h1>
      <p className="meta">
        <span className="badge">{statusLabel[i.status]}</span> {i.kind} · updated {i.updated}
      </p>
      {i.example && (
        <p className="note">This is an example investigation that ships with the template. Replace it with your own.</p>
      )}
      <p>{i.summary}</p>
      <MDXRemote source={i.body} />
      <h2 id="sources">Sources</h2>
      <ol className="sources">
        {i.sources.map((s) => (
          <li key={s.url}>
            <a href={s.url}>{s.title}</a>
            <span className="meta"> · accessed {s.accessed}{s.locator ? ` · ${s.locator}` : ""}</span>
          </li>
        ))}
      </ol>
    </article>
  );
}
