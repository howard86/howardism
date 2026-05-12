import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    CMS_API_ENDPOINT: z.string().url().optional(),
    CMS_API_KEY: z.string().optional(),
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
    VERCEL_ENV: process.env.VERCEL_ENV,

    NEXT_PUBLIC_DOMAIN_NAME: process.env.NEXT_PUBLIC_DOMAIN_NAME,
    NEXT_PUBLIC_GA_MEASUREMENT_ID: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID,
  },
});
