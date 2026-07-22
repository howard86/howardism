import { z } from "zod";

/**
 * Current-state record per translated slug — the durable, committed truth at
 * `apps/blog/src/data/translations.json`. Drives staleness classification on the
 * CLI side and the blog's language switcher on read. The SQLite history DB is a
 * per-machine cache layered on top; this manifest is authoritative across clones.
 */
export const TranslationRecordSchema = z.object({
  costEstimated: z.boolean().nullish(),
  costUsd: z.number().nullable(),
  credits: z.number().nullable(),
  durationMs: z.number(),
  engine: z.string(),
  model: z.string().nullable(),
  sourceHash: z.string(),
  sourceTitle: z.string().nullable(),
  translatedAt: z.string(),
});

export type TranslationRecord = z.infer<typeof TranslationRecordSchema>;

export const TranslationsManifestSchema = z.object({
  articles: z.record(z.string(), TranslationRecordSchema),
  generatedOn: z.string(),
  locale: z.string(),
});

export type TranslationsManifest = z.infer<typeof TranslationsManifestSchema>;

/** Parse + validate a raw translations manifest; throws on drift. */
export const parseTranslations = (data: unknown): TranslationsManifest =>
  TranslationsManifestSchema.parse(data);
