import type { OpenQuestion } from "@howardism/article-contract/manifests/open-questions";
import type { ReactNode } from "react";

import { InternalLink } from "@/components/internal-link";

import type { OpenQuestionConcept } from "./service";
import { bucketOf, TRIAGE_META, type TriageBucket } from "./triage-meta";

/** One ledger line: the question text plus the bucket it was filed under. */
export interface QuestionLine {
  bucket: TriageBucket;
  text: string;
}

/** Flatten a concept into ledger lines, open questions first, settled last. */
export const linesOf = (concept: OpenQuestionConcept): QuestionLine[] => [
  ...concept.questions.map((question: OpenQuestion) => ({
    bucket: bucketOf(question),
    text: question.text,
  })),
  ...concept.resolved.map((text) => ({
    bucket: "resolved" as TriageBucket,
    text,
  })),
];

/**
 * Wrap every match of `pattern` in a `<mark>`. The pattern must carry exactly
 * one capture group, so `split` returns match and non-match parts alternating.
 */
function Highlighted({
  pattern,
  text,
}: {
  pattern: RegExp | null;
  text: string;
}): ReactNode {
  if (!pattern) {
    return text;
  }
  const parts = text.split(pattern);
  if (parts.length === 1) {
    return text;
  }
  // Odd indices are the captured matches. Keys are the part's offset in the
  // source string, which stays unique when the same word matches twice.
  const nodes: ReactNode[] = [];
  let offset = 0;
  for (const [index, part] of parts.entries()) {
    if (index % 2 === 1) {
      nodes.push(
        <mark
          className="rounded-[3px] bg-brand/15 px-0.5 font-medium text-foreground"
          key={`${offset}-${part}`}
        >
          {part}
        </mark>
      );
    } else {
      nodes.push(part);
    }
    offset += part.length;
  }
  return nodes;
}

interface ConceptStanzaProps {
  /** Accent for the 2px rule that opens the stanza's line list. */
  color: string;
  /** Pre-filtered lines; the stanza renders exactly what it is handed. */
  lines: QuestionLine[];
  /** Highlight pattern from the worklist's search field. */
  pattern?: RegExp | null;
  slug: string;
  title: string;
}

/**
 * One concept's ledger stanza — the note that raised the questions, then its
 * lines on hairline rules. Shared by the domain pages and the `/questions`
 * worklist so a question reads the same way wherever it surfaces.
 */
export function ConceptStanza({
  color,
  lines,
  pattern = null,
  slug,
  title,
}: ConceptStanzaProps) {
  const open = lines.filter((line) => line.bucket !== "resolved").length;

  return (
    <li>
      <div className="flex items-baseline justify-between gap-4">
        <InternalLink
          className="font-display font-medium text-[18px] text-foreground no-underline transition-colors hover:text-brand"
          href={`/articles/${slug}#open-questions`}
        >
          <Highlighted pattern={pattern} text={title} />
        </InternalLink>
        <span className="shrink-0 font-mono text-[10.5px] text-foreground-subtle uppercase tabular-nums tracking-[0.12em]">
          {open} open
        </span>
      </div>
      <ul
        className="m-0 mt-2.5 list-none border-t-2 p-0"
        style={{ borderColor: color }}
      >
        {lines.map((line) => {
          const meta = TRIAGE_META[line.bucket];
          const settled = line.bucket === "resolved";
          return (
            <li
              className={`border-border border-b py-2.5 font-body text-[15px] leading-[1.55] last:border-b-0 ${
                settled ? "text-foreground-subtle" : "text-muted-foreground"
              }`}
              key={`${line.bucket}-${line.text}`}
            >
              {meta.code && (
                <span
                  className="mr-2 font-mono text-[10px] uppercase tracking-[0.14em]"
                  style={{ color: meta.tone }}
                >
                  {meta.code}
                </span>
              )}
              <Highlighted pattern={pattern} text={line.text} />
            </li>
          );
        })}
      </ul>
    </li>
  );
}

interface OpenQuestionsSectionProps {
  /** Accent color token for the rule + concept markers. */
  color?: string;
  concepts: OpenQuestionConcept[];
  /** Section heading; omit to render the list without its own header. */
  heading?: string;
}

/**
 * A grouped open-questions list — one stanza per concept. Used by the domain
 * pages, where the list is short enough to read straight through; `/questions`
 * renders the same stanzas behind its own search and triage controls.
 */
export function OpenQuestionsSection({
  concepts,
  heading,
  color = "var(--brand)",
}: OpenQuestionsSectionProps) {
  if (concepts.length === 0) {
    return null;
  }

  const total = concepts.reduce((sum, c) => sum + c.questions.length, 0);

  return (
    <section className="mt-12">
      {heading && (
        <h2
          className="m-0 border-t-2 pt-3 font-display font-normal text-[clamp(22px,3vw,28px)] text-foreground tracking-[-0.02em]"
          style={{ borderColor: color }}
        >
          {heading}{" "}
          <span className="font-mono text-[12px] text-foreground-subtle tracking-[0.12em]">
            {total} open
          </span>
        </h2>
      )}
      <ul className="m-0 mt-6 flex list-none flex-col gap-7 p-0">
        {concepts.map((concept) => (
          <ConceptStanza
            color={color}
            key={concept.slug}
            lines={linesOf(concept)}
            slug={concept.slug}
            title={concept.title}
          />
        ))}
      </ul>
    </section>
  );
}
