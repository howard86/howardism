import { createEnv } from "@t3-oss/env-nextjs"
import { z } from "zod"

export const env = createEnv({
  server: {
    CMS_API_ENDPOINT: z.string().url().optional(),
    CMS_API_KEY: z.string().optional(),
  },
  client: {
    NEXT_PUBLIC_DOMAIN_NAME: z.string(),
  },
  runtimeEnv: {
    CMS_API_ENDPOINT: process.env.CMS_API_ENDPOINT,
    CMS_API_KEY: process.env.CMS_API_KEY,
    NEXT_PUBLIC_DOMAIN_NAME: process.env.NEXT_PUBLIC_DOMAIN_NAME,
  },
})
