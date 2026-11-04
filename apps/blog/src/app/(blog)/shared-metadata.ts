import type { Metadata } from "next";

import { PROFILE_IMAGE_NAME, SITE_NAME, TWITTER_USERNAME } from "../constants";

// Next merges `openGraph`, `twitter` and `alternates` shallowly: a segment that
// sets one replaces the whole object from its parent. Spread these into every
// segment that sets them so the site-wide fields survive.
// https://nextjs.org/docs/app/api-reference/functions/generate-metadata#merging
export const baseOpenGraph = {
  type: "website",
  locale: "en_GB",
  siteName: SITE_NAME,
  images: [
    {
      url: `/${PROFILE_IMAGE_NAME}`,
      width: 400,
      height: 400,
      alt: "Profile Picture",
    },
  ],
} satisfies NonNullable<Metadata["openGraph"]>;

export const baseTwitter = {
  card: "summary_large_image",
  site: TWITTER_USERNAME,
  creator: TWITTER_USERNAME,
} satisfies NonNullable<Metadata["twitter"]>;

export const feedAlternates = {
  "application/rss+xml": "/rss/feed.xml",
  "application/feed+json": "/rss/feed.json",
} satisfies Record<string, string>;
