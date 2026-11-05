import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { siteConfig, siteUrl } from "../lib/investigations";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: siteConfig.title, template: `%s | ${siteConfig.title}` },
  description: siteConfig.description,
  alternates: { types: { "application/rss+xml": "/feed.xml" } },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <a className="skip" href="#main">Skip to content</a>
        <header className="site">
          <Link href="/">{siteConfig.title}</Link>
        </header>
        <main id="main">{children}</main>
        <footer className="site meta">
          <a href="/feed.xml">Feed</a> · <a href="/llms.txt">llms.txt</a> · <a href="/sitemap.xml">Sitemap</a>
        </footer>
      </body>
    </html>
  );
}
