import "./src/config/env";

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import nextBundleAnalyzer from "@next/bundle-analyzer";
import nextMDX from "@next/mdx";
import type { NextConfig } from "next";

import {
  isPagesExport,
  isStaticExport,
  isVercelStatic,
} from "./src/config/deploy-target";
import {
  imageDeviceSizes,
  imageFormats,
  imageMinimumCacheTTL,
  imageQualities,
  imageSizes,
} from "./src/config/image-config";
import { redirects } from "./src/config/redirects";
import { getBlogSecurityHeaders } from "./src/config/security-headers";

const contentState = JSON.parse(
  readFileSync(new URL("./.content-state.json", import.meta.url), "utf8")
);
const previewSlugs =
  contentState.profile === "sample"
    ? JSON.parse(
        readFileSync(
          new URL("./src/.content-coverage.json", import.meta.url),
          "utf8"
        )
      ).slugs
    : [];
if (process.env.VERCEL_ENV === "production") {
  const lock = JSON.parse(
    readFileSync(new URL("./content.lock.json", import.meta.url), "utf8")
  );
  if (
    contentState.profile !== "full" ||
    contentState.schemaVersion !== 1 ||
    contentState.releaseSha256 !== lock.releaseSha256
  ) {
    throw new Error("Production requires the pinned full-content preparation");
  }
}

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
      [
        join(
          dirname(fileURLToPath(import.meta.url)),
          "src/lib/rehype-preview-links.mjs"
        ),
        { profile: contentState.profile, slugs: previewSlugs },
      ],
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

// Articles-only blog. The CSP directives live in `security-headers.ts` so the
// Pages build can reuse them in a <meta> tag. In dev the server is plain
// HTTP, so skip the HTTPS-forcing headers — Safari honours HSTS on
// `localhost` and otherwise refuses to connect over HTTP with a TLS handshake
// error. No feature needs geolocation.
const securityHeaders = getBlogSecurityHeaders(!isProduction);

const nextConfig: NextConfig = {
  pageExtensions: ["ts", "tsx"],
  poweredByHeader: false,
  headers:
    isProduction && !isStaticExport
      ? () => [{ source: "/(.*)", headers: securityHeaders }]
      : undefined,
  ...(isStaticExport
    ? {
        output: "export" as const,
        ...(isPagesExport ? { trailingSlash: true } : {}),
      }
    : { redirects: () => redirects }),
  reactStrictMode: true,
  outputFileTracingRoot: join(
    dirname(fileURLToPath(import.meta.url)),
    "../../"
  ),
  transpilePackages: ["@howardism/ui", "@howardism/article-contract"],
  images: {
    // AVIF first: the hero illustrations are flat-shaded, which AVIF encodes
    // roughly 40% smaller than the WebP default. Browsers without AVIF fall
    // through to WebP via content negotiation.
    formats: [...imageFormats],
    deviceSizes: imageDeviceSizes,
    imageSizes,
    qualities: imageQualities,
    // Content-hashed sources make 31 days safe and keep Hobby transforms under 5k/month.
    minimumCacheTTL: imageMinimumCacheTTL,
    unoptimized: isPagesExport,
    ...(isVercelStatic
      ? {
          loader: "custom" as const,
          loaderFile: "src/lib/vercel-image-loader.ts",
        }
      : {}),
    remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }],
  },
};

export default withBundleAnalyzer(withMDX(nextConfig));
