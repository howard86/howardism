import { NextSeo } from "next-seo"

import DEFAULT_SEO from "@/constants/seo"

export default function ThankYouHead() {
  return (
    <NextSeo
      {...DEFAULT_SEO}
      title="You're subscribed"
      description="Thanks for subscribing to my newsletter."
      useAppDir
    />
  )
}
