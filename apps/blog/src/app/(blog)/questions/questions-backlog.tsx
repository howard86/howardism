"use client";

import type { OpenQuestionConcept } from "@howardism/article-contract/manifests/open-questions";
import { useEffect, useState } from "react";

import { loadOpenQuestions } from "./questions-data";
import { QuestionsWorklist } from "./questions-worklist";

const NOTE_CLASS =
  "mt-10 font-mono text-[11px] text-foreground-subtle uppercase tracking-[0.16em]";

/**
 * Fetches the backlog chunk, then hands it to the worklist. The split is what
 * keeps the corpus out of the page: the server renders only the shell and the
 * headline counts, so the questions travel once, as a cacheable JSON chunk,
 * rather than as prerendered HTML *and* the flight payload beside it.
 */
export function QuestionsBacklog() {
  const [concepts, setConcepts] = useState<OpenQuestionConcept[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    loadOpenQuestions()
      .then((loaded) => {
        if (active) {
          setConcepts(loaded);
        }
      })
      .catch(() => {
        // `concepts` stays null so a remount retries (loadOpenQuestions cleared
        // its cached rejection); surface a message instead of hanging.
        if (active) {
          setFailed(true);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  if (concepts === null) {
    return (
      <p className={NOTE_CLASS} role="status">
        {failed ? "The worklist failed to load." : "Loading the worklist…"}
      </p>
    );
  }

  return <QuestionsWorklist concepts={concepts} />;
}
