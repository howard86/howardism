import "focus-visible"
import "../styles/globals.css"

import { Metadata } from "next"
import Script from "next/script"
import type { ChildrenProps } from "react"

import { env } from "@/config/env.mjs"

import { Footer } from "./Footer"
import { Header } from "./Header"

const SITE_NAME = "Howardism"
const TWITTER_USERNAME = "@howard86_"
const PROFILE_IMAGE_NAME = "profile.jpeg"
const SITE_DESCRIPTION = "A Software Engineer, Mathematician, and Amateur Diver's Journey"
const AUTHOR_NAME = "Howard Tai"

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
  colorScheme: "light dark",
  creator: AUTHOR_NAME,
  publisher: AUTHOR_NAME,
  openGraph: {
    type: "website",
    locale: "en_UK",
    title: SITE_NAME,
    url: env.NEXT_PUBLIC_DOMAIN_NAME,
    siteName: SITE_NAME,
    description: SITE_DESCRIPTION,
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
  themeColor: "#ffffff",
  manifest: "/site.webmanifest",
  twitter: {
    card: "summary_large_image",
    site: TWITTER_USERNAME,
    creator: TWITTER_USERNAME,
  },
  viewport: "width=device-width, initial-scale=1",
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

export default function RootLayout({ children }: ChildrenProps) {
  return (
    <html data-theme="jp" lang="en" className="h-full scroll-smooth bg-texture antialiased">
      <body className="flex h-full flex-col dark:bg-black">
        <div className="fixed inset-0 flex justify-center sm:px-8">
          <div className="flex w-full max-w-7xl lg:px-8">
            <div className="w-full bg-white ring-1 ring-zinc-100 dark:bg-zinc-900 dark:ring-zinc-300/20" />
          </div>
        </div>
        <div className="relative flex flex-1 flex-col">
          <Header />
          <main className="flex flex-1 flex-col">{children}</main>
          <Footer />
        </div>
        <Script id="dark-mode-script" strategy="beforeInteractive">
          {`
            let darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

            updateMode()
            darkModeMediaQuery.addEventListener('change', updateModeWithoutTransitions)
            window.addEventListener('storage', updateModeWithoutTransitions)

            function updateMode() {
                let isSystemDarkMode = darkModeMediaQuery.matches
                let isDarkMode = window.localStorage.isDarkMode === 'true' || (!('isDarkMode' in window.localStorage) && isSystemDarkMode)

                if (isDarkMode) {
                document.documentElement.classList.add('dark')
                } else {
                document.documentElement.classList.remove('dark')
                }

                if (isDarkMode === isSystemDarkMode) {
                delete window.localStorage.isDarkMode
                }
            }

            function disableTransitionsTemporarily() {
                document.documentElement.classList.add('[&_*]:!transition-none')
                window.setTimeout(() => {
                document.documentElement.classList.remove('[&_*]:!transition-none')
                }, 0)
            }

            function updateModeWithoutTransitions() {
                disableTransitionsTemporarily()
                updateMode()
            }
            `}
        </Script>
      </body>
    </html>
  )
}
