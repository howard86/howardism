import "./src/config/env.mjs";

import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import nextBundleAnalyzer from "@next/bundle-analyzer";
import nextMDX from "@next/mdx";
import type { NextConfig } from "next";

import {
  DEFAULT_CSP_DIRECTIVES,
  getSecurityHeaders,
} from "./src/config/security-headers";

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

// Blog uses Mapbox GL (map tiles + worker), Vercel Analytics, and Sendgrid
// client — connect-src and worker-src are widened accordingly. Geolocation is
// granted to same-origin so the mapbox feature can prompt.
const securityHeaders = getSecurityHeaders({
  geolocation: "(self)",
  contentSecurityPolicy: {
    ...DEFAULT_CSP_DIRECTIVES,
    "connect-src": [
      "'self'",
      "https:",
      "https://api.mapbox.com",
      "https://events.mapbox.com",
      "https://*.vercel-insights.com",
    ],
    "img-src": ["'self'", "https:", "data:", "blob:", "https://*.mapbox.com"],
    "worker-src": ["'self'", "blob:"],
  },
});

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
  transpilePackages: ["@howardism/ui", "@react-pdf/renderer"],
  images: {
    remotePatterns: [
      { hostname: "images.unsplash.com" },
      { hostname: "avatars.githubusercontent.com" },
      { hostname: "lh3.googleusercontent.com" },
    ],
  },
};

export default withBundleAnalyzer(withMDX(nextConfig));
