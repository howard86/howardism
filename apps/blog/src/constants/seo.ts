import { DefaultSeoProps } from "next-seo";

import config from "@/config";

const SITE_NAME = "Howardism";
const TWITTER_USERNAME = "@howard86_";
const PROFILE_IMAGE_NAME = "profile.jpeg";

const DEFAULT_OPEN_GRAPH = {
  type: "website",
  locale: "en_US",
  url: config.domain,
  site_name: SITE_NAME,
  description: `Howard Tai | A Lifelong learner`,
  images: [
    {
      url: `${config.domain}${PROFILE_IMAGE_NAME}`,
      width: 400,
      height: 400,
      alt: "Profile Picture",
    },
  ],
};

const DEFAULT_SEO: DefaultSeoProps = {
  title: "Blog",
  titleTemplate: `${SITE_NAME} | %s`,
  description: `Howard Tai | A Lifelong learner`,
  canonical: config.domain,
  openGraph: DEFAULT_OPEN_GRAPH,
  twitter: {
    handle: TWITTER_USERNAME,
    site: TWITTER_USERNAME,
    cardType: "summary_large_image",
  },
};

export default DEFAULT_SEO;
