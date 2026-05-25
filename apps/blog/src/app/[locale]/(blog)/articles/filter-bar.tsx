import { TopicDot } from "@/components/howardism/topic-dot";

import { TOPIC_META, TOPIC_ORDER } from "./topic-meta";

interface FilterBarProps {
  /** Section slugs present on the page, in order, for the "Filed under" row. */
  sectionSlugs: { slug: string; title: string }[];
}

const ROW_LABEL =
  "pt-1.5 font-mono text-[11px] text-foreground-subtle uppercase tracking-[0.18em]";
const PILL =
  "font-display font-medium text-[18px] text-muted-foreground capitalize transition-colors hover:text-brand";
const ACTIVE = "border-current border-b pb-0.5 text-brand italic";

/**
 * Two-row filter bar. "Filed under" jumps to each kind plate (in-page
 * anchors); "Topic" links to the `/articles/topic/[topic]` routes.
 */
export function FilterBar({ sectionSlugs }: FilterBarProps) {
  return (
    <div className="border-border border-b bg-card/40 px-[clamp(20px,5vw,56px)] py-5">
      <div className="grid grid-cols-[88px_1fr] items-baseline gap-x-6 gap-y-2.5">
        <span className={ROW_LABEL}>Filed under</span>
        <div className="flex flex-wrap gap-x-6 gap-y-1.5">
          <span className={`${PILL} ${ACTIVE}`}>all</span>
          {sectionSlugs.map(({ slug, title }) => (
            <a className={PILL} href={`#${slug}`} key={slug}>
              {title}
            </a>
          ))}
        </div>

        <span className={ROW_LABEL}>Topic</span>
        <div className="flex flex-wrap gap-x-6 gap-y-1.5">
          {TOPIC_ORDER.map((topic) => (
            <a
              className={`${PILL} flex items-baseline`}
              href={`/articles/topic/${topic}`}
              key={topic}
            >
              <TopicDot size={6} topic={topic} />
              {TOPIC_META[topic].label.toLowerCase()}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
