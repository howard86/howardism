import "focus-visible"
import "@/styles/globals.css"

import { Analytics } from "@vercel/analytics/react"
import { Metadata, Viewport } from "next"
import { type ChildrenProps } from "react"

import GoogleAnalytics from "@/components/GoogleAnalytics"
import { env } from "@/config/env.mjs"

import {
  AUTHOR_EMAIL,
  AUTHOR_NAME,
  PROFILE_IMAGE_NAME,
  SITE_DESCRIPTION,
  SITE_NAME,
  TWITTER_USERNAME,
} from "../constants"
import { Footer } from "./(layout)/Footer"
import { Header } from "./(layout)/Header"

export const metadata: Metadata = {
  metadataBase: new URL(env.NEXT_PUBLIC_DOMAIN_NAME),
  title: {
    template: `${SITE_NAME} | %s`,
    default: `${SITE_NAME} | Blog`,
  },
  description: SITE_DESCRIPTION,
  generator: "Next.js",
  applicationName: SITE_NAME,
  referrer: "origin-when-cross-origin",
  keywords: [
    "Howard Tai",
    "Howardism",
    "Software Engineer",
    "Mathematician",
    "Amateur Diver",
    "Lifelong learner",
    "Fullstack Developer",
    "Oddle",
    "Singapore",
    "Taiwan",
    "London",
    "Remote",
    "Anywhere",
    "World",
    "Computer Science",
    "React",
    "Next.js",
    "Node.js",
  ],
  authors: [{ name: AUTHOR_NAME }],
  creator: AUTHOR_NAME,
  publisher: AUTHOR_NAME,
  openGraph: {
    type: "website",
    locale: "en_UK",
    title: SITE_NAME,
    url: env.NEXT_PUBLIC_DOMAIN_NAME,
    siteName: SITE_NAME,
    description: SITE_DESCRIPTION,
    emails: AUTHOR_EMAIL,
    images: [
      {
        url: `/${PROFILE_IMAGE_NAME}`,
        width: 400,
        height: 400,
        alt: "Profile Picture",
      },
    ],
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "16x16", type: "image/x-icon" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
  twitter: {
    card: "summary_large_image",
    site: TWITTER_USERNAME,
    creator: TWITTER_USERNAME,
  },
  alternates: {
    canonical: env.NEXT_PUBLIC_DOMAIN_NAME,
    types: {
      "application/rss+xml": `/rss/feed.xml`,
      "application/feed+json": `/rss/feed.json`,
    },
  },
  other: {
    "msapplication-TileColor": "#ffffff",
  },
}

export const viewport: Viewport = {
  themeColor: "#ffffff",
  colorScheme: "light dark",
}

export default function RootLayout({ children }: ChildrenProps) {
  return (
    <html
      data-theme="jp"
      lang="en"
      className="h-full scroll-smooth bg-base-200 bg-texture antialiased"
    >
      <body className="flex h-full flex-col">
        <div className="fixed inset-0 flex justify-center sm:px-8" aria-label="content background">
          <div className="flex w-full max-w-7xl lg:px-8">
            <div className="w-full bg-base-100 ring-1 ring-base-300" />
          </div>
        </div>
        <div className="relative flex flex-1 flex-col">
          <Header />
          <main className="flex flex-1 flex-col">{children}</main>
          <Footer />
        </div>
        <Analytics />
        {env.NEXT_PUBLIC_GA_MEASUREMENT_ID && (
          <GoogleAnalytics measurementId={env.NEXT_PUBLIC_GA_MEASUREMENT_ID} />
        )}
      </body>
    </html>
  )
}
