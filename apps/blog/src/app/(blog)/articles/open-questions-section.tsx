import { InternalLink } from "@/components/internal-link";

import type { OpenQuestionConcept } from "./service";

interface OpenQuestionsSectionProps {
  /** Accent color token for the rule + concept markers. */
  color?: string;
  concepts: OpenQuestionConcept[];
  /** Section heading; omit to render the list without its own header. */
  heading?: string;
}

/**
 * Renders a grouped open-questions list: one block per concept (title links to
 * that article's inline `## Open Questions`), with the unanswered questions as
 * a bullet list. Shared by domain pages and the standalone `/questions` backlog.
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
          <li key={concept.slug}>
            <InternalLink
              className="font-display font-medium text-[18px] text-foreground no-underline transition-colors hover:text-brand"
              href={`/articles/${concept.slug}#open-questions`}
            >
              {concept.title}
            </InternalLink>
            <ul className="m-0 mt-2 flex list-none flex-col gap-2 p-0">
              {concept.questions.map((question) => (
                <li
                  className="border-l-2 pl-3 font-body text-[15px] text-muted-foreground leading-[1.5]"
                  key={question}
                  style={{ borderColor: color }}
                >
                  {question}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </section>
  );
}
