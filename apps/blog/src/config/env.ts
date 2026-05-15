import { z } from "zod";

const envSchema = z.object({
  // Canonical site origin. Defaults to the production domain so that
  // `metadataBase`, Open Graph URLs and the RSS feed resolve to absolute URLs
  // even when the env var is not provided at build time.
  NEXT_PUBLIC_DOMAIN_NAME: z.url().default("https://www.howardism.dev"),
  NEXT_PUBLIC_GA_MEASUREMENT_ID: z
    .string()
    .regex(/^G-[A-Z0-9]+$/)
    .optional(),
});

const parsed = envSchema.safeParse({
  NEXT_PUBLIC_DOMAIN_NAME: process.env.NEXT_PUBLIC_DOMAIN_NAME,
  NEXT_PUBLIC_GA_MEASUREMENT_ID: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID,
});

if (!parsed.success) {
  throw new Error(
    `Invalid environment variables:\n${z.prettifyError(parsed.error)}`
  );
}

export const env = parsed.data;
