import { z } from "zod";

import { WIKI_DOMAINS } from "../index";

/**
 * The vault's `#oq/*` triage tag, carried through to the blog so the reader can
 * tell an answerable question from a standing request for evidence:
 *
 * - `now` — answerable today by synthesis over pages already in the wiki.
 * - `source` — needs external evidence that does not exist in the vault yet.
 * - `wait` — a prediction, falsifiable only by a future event.
 * - `note` — an observation the vault has not yet folded into an article body.
 *
 * The vault tags every backlog bullet, but the tag is the author's own
 * workflow marker and drifts; `null` records an untagged bullet rather than
 * guessing a bucket for it.
 */
export const OPEN_QUESTION_KINDS = ["now", "source", "wait", "note"] as const;

export const OpenQuestionSchema = z.object({
  kind: z.enum(OPEN_QUESTION_KINDS).nullable(),
  text: z.string(),
});

export type OpenQuestion = z.infer<typeof OpenQuestionSchema>;

/**
 * Questions were a bare `string[]` before the triage tag was carried through.
 * The committed manifest only takes the new shape on the next `import:wiki`,
 * so a legacy bullet is read as untagged rather than failing the blog build.
 */
const OpenQuestionEntrySchema = z.union([
  OpenQuestionSchema,
  z.string().transform((text): OpenQuestion => ({ kind: null, text })),
]);

/**
 * The open-questions backlog, harvested from the vault and regrouped under the
 * blog's domains. Each concept that still has unanswered questions becomes one
 * entry; the blog buckets these by `domain` for the `/questions` page and the
 * per-domain sections on domain pages.
 *
 * `resolved` carries the questions the vault has since settled (a concept
 * page's `## Resolved Questions` section). They are the counterweight to the
 * open list: without them the blog publishes only what is unsettled.
 */
export const OpenQuestionConceptSchema = z.object({
  domain: z.enum(WIKI_DOMAINS),
  questions: z.array(OpenQuestionEntrySchema),
  resolved: z.array(z.string()).default([]),
  slug: z.string(),
  title: z.string(),
});

export type OpenQuestionConcept = z.infer<typeof OpenQuestionConceptSchema>;

export const OpenQuestionsManifestSchema = z.object({
  byConcept: z.array(OpenQuestionConceptSchema),
  generatedOn: z.string(),
});

export type OpenQuestionsManifest = z.infer<typeof OpenQuestionsManifestSchema>;

/** Parse + validate a raw open-questions manifest; throws on drift. */
export const parseOpenQuestions = (data: unknown): OpenQuestionsManifest =>
  OpenQuestionsManifestSchema.parse(data);
