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
    NEXT_PUBLIC_DOMAIN_NAME: process.env.NEXT_PUBLIC_DOMAIN_NAME,
    NEXT_PUBLIC_GA_MEASUREMENT_ID: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID,
    NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN: process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    LINE_PAY_CHANNEL_ID: process.env.LINE_PAY_CHANNEL_ID,
    LINE_PAY_CHANNEL_SECRET_KEY: process.env.LINE_PAY_CHANNEL_SECRET_KEY,
    LINE_PAY_API_URL: process.env.LINE_PAY_API_URL,
  },
})
