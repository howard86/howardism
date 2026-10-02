import { z } from "zod";
import {
  CONTENT_MANIFESTS,
  ContentFileSchema,
  contentPathSchema,
  digestSchema,
} from "./content-release";

const TRAILING_DOT = /\.$/;
const IPV4_HOST = /^(?:\d{1,3}\.){3}\d{1,3}$/;

export const MAX_SAMPLE_ARTICLES_PER_LOCALE = 32;
export const MAX_SAMPLE_ASSETS = 64;
export const MAX_SAMPLE_RELEASE_BYTES = 128 * 1024 * 1024;
export const SAMPLE_LOCK_FILE = "content.sample.lock.json";

export const samplePathSchema = z
  .string()
  .refine(
    (path) =>
      path === "coverage.json" || contentPathSchema.safeParse(path).success,
    "Unsupported sample content path"
  );
export const SampleFileSchema = ContentFileSchema.extend({
  path: samplePathSchema,
});
export const SampleReleaseSchema = z
  .strictObject({
    schemaVersion: z.literal(1),
    profile: z.literal("sample"),
    exporterVersion: z.literal("1"),
    files: z.array(SampleFileSchema).min(1).max(256),
    counts: z.strictObject({
      articlesByLocale: z.strictObject({
        en: z.number().int().positive().max(MAX_SAMPLE_ARTICLES_PER_LOCALE),
        "zh-TW": z
          .number()
          .int()
          .positive()
          .max(MAX_SAMPLE_ARTICLES_PER_LOCALE),
      }),
      assets: z.number().int().nonnegative().max(MAX_SAMPLE_ASSETS),
    }),
  })
  .superRefine((release, ctx) => {
    const paths = new Set<string>();
    let total = 0;
    let storedTotal = 0;
    let en = 0;
    let zh = 0;
    let assets = 0;
    for (const file of release.files) {
      if (paths.has(file.path)) {
        ctx.addIssue({
          code: "custom",
          message: `Duplicate sample destination: ${file.path}`,
        });
      }
      paths.add(file.path);
      total += file.decodedBytes;
      storedTotal += file.storedBytes;
      if (file.path.startsWith("content/articles/")) {
        en += 1;
      }
      if (file.path.startsWith("content/articles-zh-TW/")) {
        zh += 1;
      }
      if (file.path.startsWith("content/assets/")) {
        assets += 1;
      }
    }
    if (storedTotal > MAX_SAMPLE_RELEASE_BYTES) {
      ctx.addIssue({
        code: "custom",
        message: "Sample release exceeds stored size limit",
      });
    }
    if (total > MAX_SAMPLE_RELEASE_BYTES) {
      ctx.addIssue({
        code: "custom",
        message: "Sample release exceeds decoded size limit",
      });
    }
    if (
      en !== zh ||
      en !== release.counts.articlesByLocale.en ||
      zh !== release.counts.articlesByLocale["zh-TW"] ||
      assets !== release.counts.assets
    ) {
      ctx.addIssue({
        code: "custom",
        message: "Sample release counts do not match bilingual files",
      });
    }
    for (const path of [
      "coverage.json",
      ...CONTENT_MANIFESTS.map((name) => `data/${name}`),
    ]) {
      if (!paths.has(path)) {
        ctx.addIssue({
          code: "custom",
          message: `Missing sample file: ${path}`,
        });
      }
    }
  });

export const samplePublicBaseUrlSchema = z.url().refine((value) => {
  const url = new URL(value);
  const host = url.hostname.toLowerCase().replace(TRAILING_DOT, "");
  const localHost =
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host.endsWith(".local") ||
    host.endsWith(".internal");
  const ipLiteral = IPV4_HOST.test(host) || host.includes(":");
  return (
    url.protocol === "https:" &&
    !url.username &&
    !url.password &&
    !url.search &&
    !url.hash &&
    !localHost &&
    !ipLiteral
  );
}, "Sample base URL must be public HTTPS without credentials, query or fragment");

export const SampleLockSchema = z.strictObject({
  schemaVersion: z.literal(1),
  profile: z.literal("sample"),
  releaseSha256: digestSchema,
  publicBaseUrl: samplePublicBaseUrlSchema,
});

export type SampleRelease = z.infer<typeof SampleReleaseSchema>;
export type SampleFile = z.infer<typeof SampleFileSchema>;
export type SampleLock = z.infer<typeof SampleLockSchema>;
