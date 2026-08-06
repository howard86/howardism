import { MCQ_CHOICE_COUNT } from "@howardism/article-contract/manifests/quiz";

export interface QuizPromptArgs {
  articleBody: string;
  cardCount: number;
  mcqCount: number;
  outputPath: string;
  title: string;
}

/**
 * Instruct an engine to write one concept's quiz bank as JSON. The engine writes
 * the file (the file-based workflow mirrors the translate path); the orchestrator
 * validates it and stamps on `domain`/`isHub`/`slug`/`title`, so the model only
 * has to produce `{ mcq, cards }` grounded strictly in the supplied article.
 */
export function buildQuizPrompt(args: QuizPromptArgs): string {
  const { articleBody, cardCount, mcqCount, outputPath, title } = args;
  return `You are writing an active-recall quiz for the wiki concept "${title}".

Read ONLY the article below. Do not use outside knowledge. Every question and
answer must be checkable against this text.

Write a JSON file to: ${outputPath}

The JSON must have exactly this shape:
{
  "mcq": [
    {
      "q": "<question>",
      "choices": ["<a>", "<b>", "<c>", "<d>"],   // exactly ${MCQ_CHOICE_COUNT} options
      "answerIdx": 0,                              // index of the correct option
      "explanation": "<one sentence, grounded in the article>"
    }
  ],
  "cards": [
    { "front": "<prompt>", "back": "<answer from the article>" }
  ]
}

Rules:
- Produce ${mcqCount} MCQs and ${cardCount} flashcards.
- Each MCQ has exactly ${MCQ_CHOICE_COUNT} choices, exactly one correct.
- Distractors must be PLAUSIBLE and similar in length to the answer — never an
  obvious throwaway. A reader who skimmed should still have to think.
- Vary which index is correct across questions.
- Test understanding (why/how/what-follows), not trivia phrasing.
- Output ONLY the JSON file. No prose, no markdown fences.

--- ARTICLE: ${title} ---
${articleBody}
--- END ARTICLE ---`;
}
