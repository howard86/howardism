import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    CMS_API_ENDPOINT: z.string().url().optional(),
    CMS_API_KEY: z.string().optional(),
    BETTER_AUTH_URL: z.string().url(),
    BETTER_AUTH_SECRET: z.string().min(1),
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
  },
  runtimeEnv: {
    isLive:
      process.env.NODE_ENV === "production" &&
      process.env.NEXT_PUBLIC_VERCEL_ENV === "production",

    CMS_API_ENDPOINT: process.env.CMS_API_ENDPOINT,
    CMS_API_KEY: process.env.CMS_API_KEY,
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    GITHUB_ID: process.env.GITHUB_ID,
    GITHUB_SECRET: process.env.GITHUB_SECRET,
    VERCEL_ENV: process.env.VERCEL_ENV,

    NEXT_PUBLIC_DOMAIN_NAME: process.env.NEXT_PUBLIC_DOMAIN_NAME,
    NEXT_PUBLIC_GA_MEASUREMENT_ID: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID,
  },
});
