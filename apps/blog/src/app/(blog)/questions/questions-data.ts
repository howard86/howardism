import type {
  OpenQuestionConcept,
  OpenQuestionsManifest,
} from "@howardism/article-contract/manifests/open-questions";

let backlogPromise: Promise<OpenQuestionConcept[]> | null = null;

/**
 * Lazily fetch the open-questions backlog. The dynamic import keeps the 800 KB
 * manifest out of the page payload — the server page renders the shell and its
 * counts, and the corpus arrives as its own browser-cacheable chunk instead of
 * being serialised twice (rendered HTML plus flight data) into every hit of
 * `/questions`. The cached promise means a remount never refetches.
 *
 * The shape is owned by `@howardism/article-contract` and gated at write time
 * by the CLI — and re-parsed on the server by `articles/service.ts`, which the
 * page itself imports, so manifest drift still fails the build. This chunk
 * loads in the browser, so it is read against the shared type without a second
 * zod parse, exactly as `components/search/search-data.ts` reads its index.
 */
export function loadOpenQuestions(): Promise<OpenQuestionConcept[]> {
  if (!backlogPromise) {
    backlogPromise = import("@/data/open-questions.json")
      .then(
        (mod) => (mod.default as unknown as OpenQuestionsManifest).byConcept
      )
      .catch((err) => {
        // Drop the cached rejection so a remount retries the chunk fetch
        // instead of being stuck with a permanently-failed promise.
        backlogPromise = null;
        throw err;
      });
  }
  return backlogPromise;
}
