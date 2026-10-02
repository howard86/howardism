import { z } from "zod";

export const CONTENT_MANIFESTS = [
  "article-graph.json",
  "articles-meta.json",
  "articles-meta.zh-TW.json",
  "open-questions.json",
  "search-index.json",
  "translations.json",
  "wiki-sources.json",
] as const;
const SHA256 = /^[a-f0-9]{64}$/;
const ARTICLE_PATH = /^content\/articles(?:-zh-TW)?\/[a-z0-9][a-z0-9-]*\.mdx$/;
const ASSET_PATH = /^content\/assets\/[a-z0-9][a-z0-9-]*\.(?:webp|png)$/;
export const MAX_FILE_BYTES = 64 * 1024 * 1024;
export const MAX_RELEASE_BYTES = 4 * 1024 * 1024 * 1024;
export const digestSchema = z.string().regex(SHA256);
export const contentPathSchema = z
  .string()
  .refine(
    (path) =>
      ARTICLE_PATH.test(path) ||
      ASSET_PATH.test(path) ||
      CONTENT_MANIFESTS.some((name) => path === `data/${name}`),
    "Unsupported content path"
  );
export const ContentFileSchema = z.strictObject({
  path: contentPathSchema,
  objectSha256: digestSchema,
  storedBytes: z.number().int().positive().max(MAX_FILE_BYTES),
  decodedSha256: digestSchema,
  decodedBytes: z.number().int().positive().max(MAX_FILE_BYTES),
  encoding: z.enum(["identity", "gzip"]),
});
export const ContentReleaseSchema = z
  .strictObject({
    schemaVersion: z.literal(1),
    profile: z.literal("full"),
    exporterVersion: z.literal("1"),
    files: z.array(ContentFileSchema).min(1).max(100_000),
    counts: z.strictObject({
      articlesByLocale: z.strictObject({
        en: z.number().int().positive(),
        "zh-TW": z.number().int().nonnegative(),
      }),
      assets: z.number().int().positive(),
    }),
  })
  .superRefine((release, ctx) => {
    const paths = new Set<string>();
    let total = 0;
    let en = 0;
    let zh = 0;
    let assets = 0;
    for (const file of release.files) {
      if (paths.has(file.path)) {
        ctx.addIssue({
          code: "custom",
          message: `Duplicate destination: ${file.path}`,
        });
      }
      paths.add(file.path);
      total += file.decodedBytes;
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
    if (total > MAX_RELEASE_BYTES) {
      ctx.addIssue({
        code: "custom",
        message: "Release exceeds decoded size limit",
      });
    }
    if (
      en !== release.counts.articlesByLocale.en ||
      zh !== release.counts.articlesByLocale["zh-TW"] ||
      assets !== release.counts.assets
    ) {
      ctx.addIssue({
        code: "custom",
        message: "Release counts do not match files",
      });
    }
    for (const name of CONTENT_MANIFESTS) {
      if (!paths.has(`data/${name}`)) {
        ctx.addIssue({ code: "custom", message: `Missing manifest: ${name}` });
      }
    }
  });
export const ContentLockSchema = z.strictObject({
  schemaVersion: z.literal(1),
  releaseSha256: digestSchema,
});
export type ContentRelease = z.infer<typeof ContentReleaseSchema>;
export type ContentFile = z.infer<typeof ContentFileSchema>;

export const ContentBuildMarkerSchema = z.strictObject({
  schemaVersion: z.literal(1),
  profile: z.literal("full"),
  applicationCommit: z.string().regex(/^[a-f0-9]{40}$/),
  releaseSha256: digestSchema,
  materializedTreeSha256: digestSchema,
});
