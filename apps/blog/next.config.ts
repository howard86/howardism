import "./src/config/env";

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
    remarkPlugins: [
      ["remark-gfm", {}],
      ["remark-frontmatter", ["yaml"]],
      ["remark-mdx-frontmatter", { name: "meta" }],
    ],
    rehypePlugins: [
      ["rehype-slug", {}],
      join(
        dirname(fileURLToPath(import.meta.url)),
        "src/lib/rehype-mdx-headings.mjs"
      ),
      [
        "rehype-autolink-headings",
        {
          behavior: "append",
          properties: {
            className: ["heading-anchor"],
            ariaLabel: "Permalink to this heading",
          },
          content: { type: "text", value: "#" },
        },
      ],
      [
        "rehype-pretty-code",
        {
          theme: { light: "github-light", dark: "github-dark" },
          keepBackground: false,
        },
      ],
    ],
  },
});

const isProduction = process.env.NODE_ENV === "production";

// Articles-only blog. The default CSP is tight (no 'unsafe-eval', no broad
// `https:` connect-src) — extend it here for the specific external endpoints
// the blog uses: Vercel Analytics + Web Vitals reporting, and Google
// Analytics when NEXT_PUBLIC_GA_MEASUREMENT_ID is set. No feature needs
// geolocation. In dev the server is plain HTTP, so skip the HTTPS-forcing
// headers — Safari honours HSTS on `localhost` and otherwise refuses to
// connect over HTTP with a TLS handshake error.
const contentSecurityPolicy = {
  ...DEFAULT_CSP_DIRECTIVES,
  "script-src": [
    "'self'",
    "'unsafe-inline'",
    "https://va.vercel-scripts.com",
    "https://www.googletagmanager.com",
    "https://www.google-analytics.com",
  ],
  "connect-src": [
    "'self'",
    "https://vitals.vercel-insights.com",
    "https://va.vercel-scripts.com",
    "https://www.google-analytics.com",
    "https://analytics.google.com",
    "https://region1.analytics.google.com",
  ],
};

const securityHeaders = getSecurityHeaders({
  geolocation: "()",
  insecureTransport: !isProduction,
  contentSecurityPolicy,
});

const nextConfig: NextConfig = {
  pageExtensions: ["ts", "tsx"],
  poweredByHeader: false,
  headers: isProduction
    ? () => [{ source: "/(.*)", headers: securityHeaders }]
    : undefined,
  redirects: () => [
    { source: "/photos", destination: "/", permanent: true },
    { source: "/about", destination: "/", permanent: true },
    { source: "/thank-you", destination: "/", permanent: true },
    // The synthesized `/articles/wiki` landing page was retired once
    // `/articles` itself became the dense tag-grouped index. Keep the URL
    // alive as a permanent (308) redirect so any external links and the
    // pre-rename graph references still land on the canonical index.
    { source: "/articles/wiki", destination: "/articles", permanent: true },
    {
      source: "/articles/wiki-changelog",
      destination: "/articles",
      permanent: true,
    },
    {
      source: "/articles/tag/changelog",
      destination: "/articles",
      permanent: true,
    },
    {
      source: "/zh-TW/articles/wiki-changelog",
      destination: "/zh-TW/articles",
      permanent: true,
    },
  ],
  reactStrictMode: true,
  outputFileTracingRoot: join(
    dirname(fileURLToPath(import.meta.url)),
    "../../"
  ),
  transpilePackages: ["@howardism/ui", "@howardism/article-contract"],
  images: {
    remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }],
  },
};

export default withBundleAnalyzer(withMDX(nextConfig));
