import { z } from "zod";

import { WIKI_DOMAINS } from "../index";

/**
 * The open-questions backlog, harvested from the vault and regrouped under the
 * blog's domains. Each concept that still has unanswered questions becomes one
 * entry; the blog buckets these by `domain` for the `/questions` page and the
 * per-domain sections on domain pages.
 */
export const OpenQuestionConceptSchema = z.object({
  domain: z.enum(WIKI_DOMAINS),
  questions: z.array(z.string()),
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
