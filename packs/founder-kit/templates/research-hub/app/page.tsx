import Link from "next/link";
import { getPublished, siteConfig, statusLabel } from "../lib/investigations";

export default function Home() {
  const items = getPublished();
  return (
    <>
      <h1>{siteConfig.title}</h1>
      <p>{siteConfig.description}</p>
      {items.length === 0 ? (
        <p className="note">No investigations are published yet. Add a file to content/investigations with status analysis or reviewed.</p>
      ) : (
        <ul className="list">
          {items.map((i) => (
            <li key={i.slug}>
              <h2><Link href={`/${i.slug}/`}>{i.title}</Link></h2>
              <p className="meta">
                <span className="badge">{statusLabel[i.status]}</span>{" "}
                {i.example && <span className="badge">Example</span>} {i.kind} · {i.sources.length} source{i.sources.length === 1 ? "" : "s"}
              </p>
              <p>{i.summary}</p>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
