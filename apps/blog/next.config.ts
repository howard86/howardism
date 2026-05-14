import "./src/config/env";

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
// No feature needs geolocation. In dev the server is plain HTTP, so skip the
// HTTPS-forcing headers — Safari honours HSTS on `localhost` and otherwise
// refuses to connect over HTTP with a TLS handshake error.
const securityHeaders = getSecurityHeaders({
  geolocation: "()",
  insecureTransport: process.env.NODE_ENV !== "production",
});

const nextConfig: NextConfig = {
  pageExtensions: ["ts", "tsx", "mdx"],
  headers: () => [{ source: "/(.*)", headers: securityHeaders }],
  redirects: () => [
    { source: "/photos", destination: "/", permanent: true },
    { source: "/about", destination: "/", permanent: true },
    { source: "/thank-you", destination: "/", permanent: true },
    // The synthesized `/articles/wiki` landing page was retired once
    // `/articles` itself became the dense tag-grouped index. Keep the URL
    // alive as a permanent (308) redirect so any external links and the
    // pre-rename graph references still land on the canonical index.
    { source: "/articles/wiki", destination: "/articles", permanent: true },
  ],
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
