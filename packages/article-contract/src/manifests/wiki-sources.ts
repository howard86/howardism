import { z } from "zod";

/**
 * A raw source document aggregated across the wiki for the home page's reading
 * list. `citedBy` lists the article slugs whose `sources:` frontmatter cite this
 * doc — it both ranks the desk and lets the blog pick a domain's lead source.
 */
export const WikiSourceSchema = z.object({
  author: z.string().optional(),
  citedBy: z.array(z.string()),
  /** Coarse medium derived from the URL: Talk | Paper | Repo | Article | Note. */
  kind: z.string(),
  published: z.string().optional(),
  title: z.string(),
  url: z.string().optional(),
});

export type WikiSource = z.infer<typeof WikiSourceSchema>;

export const WikiSourcesManifestSchema = z.object({
  generatedOn: z.string(),
  sources: z.array(WikiSourceSchema),
});

export type WikiSourcesManifest = z.infer<typeof WikiSourcesManifestSchema>;

/** Parse + validate a raw wiki-sources manifest; throws on drift. */
export const parseWikiSources = (data: unknown): WikiSourcesManifest =>
  WikiSourcesManifestSchema.parse(data);
