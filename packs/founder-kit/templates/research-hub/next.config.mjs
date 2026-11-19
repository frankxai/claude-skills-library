// DEPLOY_TARGET=cloudflare builds a fully static site into ./out.
// Any other value (or none) is a normal Next.js build for Vercel.
const isStatic = process.env.DEPLOY_TARGET === "cloudflare";

/** @type {import('next').NextConfig} */
const nextConfig = {
  ...(isStatic ? { output: "export", trailingSlash: true } : {}),
};

export default nextConfig;
