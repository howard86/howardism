import { createEnv } from "@t3-oss/env-nextjs"
import { z } from "zod"

export const env = createEnv({
  server: {
    CMS_API_ENDPOINT: z.string().url().optional(),
    CMS_API_KEY: z.string().optional(),
    NEXTAUTH_URL: z.string().url().optional(),
    LINE_PAY_CHANNEL_ID: z.string().optional(),
    LINE_PAY_CHANNEL_SECRET_KEY: z.string().optional(),
    LINE_PAY_API_URL: z.string().url().optional(),
    TDX_API_ENDPOINT: z.string().url(),
    TDX_API_CLIENT_ID: z.string(),
    TDX_API_CLIENT_SECRET: z.string(),
    GOOGLE_CLIENT_ID: z.string(),
    GOOGLE_CLIENT_SECRET: z.string(),
    GITHUB_ID: z.string(),
    GITHUB_SECRET: z.string(),
    VERCEL_ENV: z.string().optional(),
  },
  client: {
    isLive: z.boolean(),
    NEXT_PUBLIC_DOMAIN_NAME: z.string(),
    NEXT_PUBLIC_GA_MEASUREMENT_ID: z.string().optional(),
    NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN: z.string(),
  },
  runtimeEnv: {
    isLive:
      process.env.NODE_ENV === "production" && process.env.NEXT_PUBLIC_VERCEL_ENV === "production",

    CMS_API_ENDPOINT: process.env.CMS_API_ENDPOINT,
    CMS_API_KEY: process.env.CMS_API_KEY,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    GITHUB_ID: process.env.GITHUB_ID,
    GITHUB_SECRET: process.env.GITHUB_SECRET,
    VERCEL_ENV: process.env.VERCEL_ENV,
    LINE_PAY_CHANNEL_ID: process.env.LINE_PAY_CHANNEL_ID,
    LINE_PAY_CHANNEL_SECRET_KEY: process.env.LINE_PAY_CHANNEL_SECRET_KEY,
    LINE_PAY_API_URL: process.env.LINE_PAY_API_URL,
    TDX_API_ENDPOINT: process.env.TDX_API_ENDPOINT,
    TDX_API_CLIENT_ID: process.env.TDX_API_CLIENT_ID,
    TDX_API_CLIENT_SECRET: process.env.TDX_API_CLIENT_SECRET,

    NEXT_PUBLIC_DOMAIN_NAME: process.env.NEXT_PUBLIC_DOMAIN_NAME,
    NEXT_PUBLIC_GA_MEASUREMENT_ID: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID,
    NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN: process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN,
  },
})
