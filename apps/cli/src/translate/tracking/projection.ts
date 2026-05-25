import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

/**
 * Current-state record per translated slug. This is the DURABLE, committed
 * truth (lives at apps/blog/src/data/translations.json): it drives staleness
 * classification and is read by the blog at build time for the language
 * switcher. The SQLite DB is a per-machine history cache layered on top.
 */
export interface TranslationRecord {
  costUsd: number | null;
  credits: number | null;
  durationMs: number;
  engine: string;
  model: string | null;
  sourceHash: string;
  sourceTitle: string | null;
  translatedAt: string;
}

export interface TranslationProjection {
  articles: Record<string, TranslationRecord>;
  generatedOn: string;
  locale: string;
}

const DEFAULT_LOCALE = "zh-TW";

const emptyProjection = (locale: string): TranslationProjection => ({
  generatedOn: new Date().toISOString().slice(0, 10),
  locale,
  articles: {},
});

/** Read the committed projection, tolerant of a missing or malformed file. */
export async function readProjection(
  path: string,
  locale: string = DEFAULT_LOCALE
): Promise<TranslationProjection> {
  let raw: string;
  try {
    raw = await readFile(path, "utf8");
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      return emptyProjection(locale);
    }
    throw err;
  }
  try {
    const parsed = JSON.parse(raw) as Partial<TranslationProjection>;
    return {
      generatedOn: parsed.generatedOn ?? emptyProjection(locale).generatedOn,
      locale: parsed.locale ?? locale,
      articles: parsed.articles ?? {},
    };
  } catch {
    return emptyProjection(locale);
  }
}

/** Recorded surface hash for a slug, or null if not yet tracked. */
export function recordedHashOf(
  projection: TranslationProjection,
  slug: string
): string | null {
  return projection.articles[slug]?.sourceHash ?? null;
}

/**
 * Merge this run's per-slug updates over the existing projection (preserving
 * untouched slugs) and write it back, pretty-printed with a trailing newline
 * to match the other committed manifests. Merging — rather than dumping the
 * DB — is what keeps the committed file authoritative across fresh clones.
 */
export async function writeProjection(
  path: string,
  existing: TranslationProjection,
  updates: Record<string, TranslationRecord>,
  options: { removedSlugs?: string[] } = {}
): Promise<TranslationProjection> {
  const articles: Record<string, TranslationRecord> = {
    ...existing.articles,
    ...updates,
  };
  for (const slug of options.removedSlugs ?? []) {
    delete articles[slug];
  }
  const sorted: Record<string, TranslationRecord> = {};
  for (const slug of Object.keys(articles).sort()) {
    sorted[slug] = articles[slug];
  }
  const next: TranslationProjection = {
    generatedOn: new Date().toISOString().slice(0, 10),
    locale: existing.locale ?? DEFAULT_LOCALE,
    articles: sorted,
  };
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(next, null, 2)}\n`, "utf8");
  return next;
}
