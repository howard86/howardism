import { NextSeo } from "next-seo"

import config from "@/config"
import DEFAULT_SEO from "@/constants/seo"

export default function RootHead() {
  return (
    <>
      <meta charSet="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <NextSeo {...DEFAULT_SEO} useAppDir />

      <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
      <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
      <link rel="manifest" href="/site.webmanifest" />
      <meta name="msapplication-TileColor" content="#ffffff" />
      <meta name="theme-color" content="#ffffff" />

      <link rel="alternate" type="application/rss+xml" href={`${config.domain}/rss/feed.xml`} />
      <link rel="alternate" type="application/feed+json" href={`${config.domain}/rss/feed.json`} />
    </>
  )
}
