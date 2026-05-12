import "./src/config/env.mjs";

import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import nextBundleAnalyzer from "@next/bundle-analyzer";
import nextMDX from "@next/mdx";
import type { NextConfig } from "next";

import { getSecurityHeaders } from "./src/config/security-headers";

const withBundleAnalyzer = nextBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const withMDX = nextMDX({
  extension: /\.mdx?$/,
  options: {
    remarkPlugins: ["remark-gfm"],
    rehypePlugins: ["@mapbox/rehype-prism"],
  },
});

// Articles-only blog: the default CSP (which already allows `https:` for
// connect-src/img-src, covering Vercel Analytics and Unsplash) is sufficient.
// No feature needs geolocation.
const securityHeaders = getSecurityHeaders({ geolocation: "()" });

const nextConfig: NextConfig = {
  pageExtensions: ["ts", "tsx", "mdx"],
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
  reactStrictMode: true,
  outputFileTracingRoot: join(
    dirname(fileURLToPath(import.meta.url)),
    "../../"
  ),
  transpilePackages: ["@howardism/ui"],
  images: {
    remotePatterns: [{ hostname: "images.unsplash.com" }],
  },
};

export default withBundleAnalyzer(withMDX(nextConfig));
