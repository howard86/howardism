import rehypePrism from "@mapbox/rehype-prism"
import nextBundleAnalyzer from "@next/bundle-analyzer"
import nextMDX from "@next/mdx"
import { dirname, join } from "path"
import remarkGfm from "remark-gfm"
import { fileURLToPath } from "url"

const withBundleAnalyzer = nextBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
})

const withMDX = nextMDX({
  extension: /\.mdx?$/,
  options: {
    remarkPlugins: [remarkGfm],
    rehypePlugins: [rehypePrism],
  },
})

/** @type{import('next').NextConfig} */
const config = {
  pageExtensions: ["ts", "tsx", "mdx"],
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ["images.unsplash.com", "avatars.githubusercontent.com", "lh3.googleusercontent.com"],
  },
  experimental: {
    appDir: true,
    scrollRestoration: true,
    outputFileTracingRoot: join(dirname(fileURLToPath(import.meta.url)), "../../"),
  },
}

export default withBundleAnalyzer(withMDX(config))
