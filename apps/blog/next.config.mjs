import "./src/config/env.mjs";

import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import rehypePrism from "@mapbox/rehype-prism";
import nextBundleAnalyzer from "@next/bundle-analyzer";
import nextMDX from "@next/mdx";
import remarkGfm from "remark-gfm";

const withBundleAnalyzer = nextBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const withMDX = nextMDX({
  extension: /\.mdx?$/,
  options: {
    remarkPlugins: [remarkGfm],
    rehypePlugins: [rehypePrism],
  },
});

/** @type{import('next').NextConfig} */
const config = {
  pageExtensions: ["ts", "tsx", "mdx"],
  reactStrictMode: true,
  swcMinify: true,
  transpilePackages: ["@howardism/ui", "@react-pdf/renderer"],
  images: {
    remotePatterns: [
      { hostname: "images.unsplash.com" },
      { hostname: "avatars.githubusercontent.com" },
      { hostname: "lh3.googleusercontent.com" },
    ],
  },
  experimental: {
    scrollRestoration: true,
    outputFileTracingRoot: join(
      dirname(fileURLToPath(import.meta.url)),
      "../../"
    ),
    mdxRs: false,
  },
};

export default withBundleAnalyzer(withMDX(config));
