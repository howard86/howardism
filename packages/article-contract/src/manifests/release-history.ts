import { z } from "zod";

/** File name under `data/` in a content release. */
export const RELEASE_HISTORY_MANIFEST = "release-history.json";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
/** Truncated sha256 hex: enough to tell bodies apart, small enough to ship. */
const SHORT_HASH = /^[a-f0-9]{12}$/;

const isoDateSchema = z.string().regex(ISO_DATE);
const shortHashSchema = z.string().regex(SHORT_HASH);

/**
 * One published content release, diffed against the release before it.
 *
 * - `new`: slugs first published in this release.
 * - `revised`: slugs whose article BODY changed. The hash ignores frontmatter,
 *   the hero-image export and the importer's generated `## Sources` block, so
 *   taxonomy-only or source-list-only edits are not revisions.
 * - `sourcesGained`: for each new or revised slug, the source titles added to
 *   its `sources:` frontmatter in this release.
 * - `resolved`: questions newly moved to a concept's resolved list.
 */
export const ReleaseEntrySchema = z.object({
  date: isoDateSchema,
  new: z.array(z.string()),
  no: z.number().int().positive(),
  resolved: z.array(z.object({ slug: z.string(), text: z.string() })),
  revised: z.array(z.string()),
  sourcesGained: z.record(z.string(), z.array(z.string())),
});

export type ReleaseEntry = z.infer<typeof ReleaseEntrySchema>;

/**
 * Per-note activity derived from `releases`: the release date the note first
 * appeared in, every later release date that revised its body (oldest first),
 * and the latest of those as `revised`.
 */
export const NoteHistorySchema = z.object({
  first: isoDateSchema,
  revised: isoDateSchema.optional(),
  revisions: z.array(isoDateSchema),
});

export type NoteHistory = z.infer<typeof NoteHistorySchema>;

/**
 * The corpus fingerprint a release was diffed from, kept so the next release
 * can be diffed without the previous corpus on disk. Hashes only: body hash
 * per slug, hashed source titles per slug, hashed resolved-question texts per
 * slug. The blog never reads this.
 */
export const CorpusStateSchema = z.object({
  bodies: z.record(z.string(), shortHashSchema),
  resolved: z.record(z.string(), z.array(shortHashSchema)),
  sources: z.record(z.string(), z.array(shortHashSchema)),
});

export type CorpusState = z.infer<typeof CorpusStateSchema>;

/**
 * Release history, oldest release first. `head` is the corpus state as of the
 * latest release; `base` is the state before it, so re-recording the latest
 * release on the same date diffs against the right baseline. `base` is null
 * when there is at most one release.
 */
export const ReleaseHistoryManifestSchema = z.object({
  base: CorpusStateSchema.nullable(),
  head: CorpusStateSchema,
  notes: z.record(z.string(), NoteHistorySchema),
  releases: z.array(ReleaseEntrySchema),
  schemaVersion: z.literal(1),
});

export type ReleaseHistoryManifest = z.infer<
  typeof ReleaseHistoryManifestSchema
>;

/**
 * What `content:prepare` materializes when a pinned release predates this
 * manifest: no releases, so the blog renders its history-free fallback.
 */
export const EMPTY_RELEASE_HISTORY: ReleaseHistoryManifest = {
  base: null,
  head: { bodies: {}, resolved: {}, sources: {} },
  notes: {},
  releases: [],
  schemaVersion: 1,
};

/** Parse + validate a raw release-history manifest; throws on drift. */
export const parseReleaseHistory = (data: unknown): ReleaseHistoryManifest =>
  ReleaseHistoryManifestSchema.parse(data);
