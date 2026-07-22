import { z } from "zod";

import { WIKI_DOMAINS } from "../index";

/**
 * The per-article quiz bank, generated from each concept's MDX and committed so
 * the blog stays fully static (client-side grading, no runtime LLM). One entry
 * per quizzed concept; the blog reads it for the in-article "Test yourself"
 * widget, the `/learn/[domain]` skill tree, and `/review` spaced repetition.
 */

/** Every MCQ carries exactly four options so the grid layout is uniform. */
export const MCQ_CHOICE_COUNT = 4;

/**
 * A single multiple-choice question — the objective gate. `answerIdx` indexes
 * into `choices`; `explanation` is shown after grading regardless of outcome.
 */
export const QuizMcqSchema = z.object({
  answerIdx: z
    .number()
    .int()
    .min(0)
    .max(MCQ_CHOICE_COUNT - 1),
  choices: z.array(z.string().min(1)).length(MCQ_CHOICE_COUNT),
  explanation: z.string().min(1),
  q: z.string().min(1),
});

export type QuizMcq = z.infer<typeof QuizMcqSchema>;

/** A front/back recall card — fed into the SM-2 review scheduler once unlocked. */
export const QuizCardSchema = z.object({
  back: z.string().min(1),
  front: z.string().min(1),
});

export type QuizCard = z.infer<typeof QuizCardSchema>;

/**
 * One concept's quiz bank. `domain` + `isHub` are set by the generator from the
 * concept's MOC membership (hubs are the `*(hub)*`-marked entries) and drive the
 * skill-tree tiering, so the blog never has to re-parse MOC prose.
 */
export const QuizConceptSchema = z.object({
  cards: z.array(QuizCardSchema),
  domain: z.enum(WIKI_DOMAINS),
  isHub: z.boolean(),
  mcq: z.array(QuizMcqSchema),
  slug: z.string().min(1),
  title: z.string().min(1),
});

export type QuizConcept = z.infer<typeof QuizConceptSchema>;

export const QuizManifestSchema = z.object({
  concepts: z.array(QuizConceptSchema),
  generatedOn: z.string(),
});

export type QuizManifest = z.infer<typeof QuizManifestSchema>;

/** Parse + validate a raw quiz manifest; throws on drift. */
export const parseQuiz = (data: unknown): QuizManifest =>
  QuizManifestSchema.parse(data);
