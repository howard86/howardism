import "focus-visible";
import "@/styles/globals.css";

import { Analytics } from "@vercel/analytics/react";
import type { Metadata, Viewport } from "next";
import { Fraunces, JetBrains_Mono, Newsreader } from "next/font/google";
import type { ChildrenProps } from "react";

import GoogleAnalytics from "@/components/google-analytics";
import { InitTweaksScript } from "@/components/tweaks/init-tweaks-script";
import { TweaksLauncher } from "@/components/tweaks/tweaks-launcher";
import { TweaksProvider } from "@/components/tweaks/tweaks-provider";
import { env } from "@/config/env";

import {
  AUTHOR_EMAIL,
  AUTHOR_NAME,
  PROFILE_IMAGE_NAME,
  SITE_NAME,
  SITE_TAGLINE,
  TWITTER_USERNAME,
} from "../constants";
import { Footer } from "./(layout)/footer";
import { Header } from "./(layout)/header";

const fraunces = Fraunces({
  subsets: ["latin"],
  axes: ["opsz"],
  weight: "variable",
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});

const newsreader = Newsreader({
  subsets: ["latin"],
  axes: ["opsz"],
  weight: "variable",
  style: ["normal", "italic"],
  variable: "--font-body",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(env.NEXT_PUBLIC_DOMAIN_NAME),
  title: {
    template: `${SITE_NAME} | %s`,
    default: SITE_NAME,
  },
  description: SITE_TAGLINE,
  generator: "Next.js",
  applicationName: SITE_NAME,
  referrer: "origin-when-cross-origin",
  keywords: [
    "Howardism",
    "AI research notes",
    "agent harness",
    "alignment",
    "Claude Code",
    "interaction models",
    "Anthropic",
    "OpenAI",
    "Thinking Machines Lab",
  ],
  authors: [{ name: AUTHOR_NAME }],
  creator: AUTHOR_NAME,
  publisher: AUTHOR_NAME,
  openGraph: {
    type: "website",
    locale: "en_GB",
    title: SITE_NAME,
    url: env.NEXT_PUBLIC_DOMAIN_NAME,
    siteName: SITE_NAME,
    description: SITE_TAGLINE,
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
    title: SITE_NAME,
    description: SITE_TAGLINE,
  },
  alternates: {
    canonical: env.NEXT_PUBLIC_DOMAIN_NAME,
    types: {
      "application/rss+xml": "/rss/feed.xml",
      "application/feed+json": "/rss/feed.json",
    },
  },
  other: {
    "msapplication-TileColor": "#ffffff",
  },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  colorScheme: "light dark",
};

export default function RootLayout({ children }: ChildrenProps) {
  return (
    <html
      className={`h-full scroll-smooth bg-muted bg-texture antialiased ${fraunces.variable} ${newsreader.variable} ${jetbrainsMono.variable}`}
      lang="en"
    >
      <head>
        <InitTweaksScript />
      </head>
      <body className="flex h-full flex-col">
        <TweaksProvider>
          <div className="fixed inset-0 flex justify-center sm:px-8">
            <div className="flex w-full max-w-7xl lg:px-8">
              <div className="w-full bg-background ring-1 ring-border" />
            </div>
          </div>
          <div className="relative flex flex-1 flex-col">
            <Header />
            <main className="flex flex-1 flex-col" id="main-content">
              {children}
            </main>
            <Footer />
            <TweaksLauncher />
          </div>
          <Analytics />
          {env.NEXT_PUBLIC_GA_MEASUREMENT_ID && (
            <GoogleAnalytics
              measurementId={env.NEXT_PUBLIC_GA_MEASUREMENT_ID}
            />
          )}
        </TweaksProvider>
      </body>
    </html>
  );
}
