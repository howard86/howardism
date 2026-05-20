import { TopicDot } from "@/components/howardism/topic-dot";
import { InternalLink } from "@/components/internal-link";
import { formatDateShort } from "@/utils/time";

import type { ArticleEntity } from "./service";
import type { TagSectionSlug } from "./tag-sections";
import { TOPIC_META } from "./topic-meta";

interface KindMeta {
  color: string;
  prefix: string;
}

/** Per-section plate vocabulary: a letter prefix + accent color. */
const KIND_META: Record<TagSectionSlug, KindMeta> = {
  concept: { prefix: "C", color: "var(--brand)" },
  entity: { prefix: "E", color: "var(--topic-orgs)" },
  essay: { prefix: "S", color: "var(--topic-harness)" },
  index: { prefix: "I", color: "var(--foreground-subtle)" },
};

interface KindPlateProps {
  articles: ArticleEntity[];
  blurb: string;
  /** 1-based plate position. */
  position: number;
  /** Section slug used for the anchor id + tag link + kind styling. */
  slug: TagSectionSlug;
  title: string;
  /** Total plates, for the "NN of MM" marker. */
  total: number;
  visibleLimit: number;
}

export function KindPlate({
  articles,
  slug,
  blurb,
  position,
  total,
  title,
  visibleLimit,
}: KindPlateProps) {
  const meta = KIND_META[slug];
  const visible = articles.slice(0, visibleLimit);
  const banded = position % 2 === 0;
  const noun = title === "Essay" ? "pieces" : "notes";

  return (
    <section
      className="border-border border-b px-[clamp(20px,5vw,56px)] py-10"
      id={slug}
      style={banded ? { background: "var(--card)" } : undefined}
    >
      <div className="grid grid-cols-1 gap-x-11 gap-y-7 lg:grid-cols-[180px_1fr]">
        {/* marker */}
        <div>
          <div
            className="font-medium font-mono text-[10.5px] uppercase tracking-[0.22em]"
            style={{ color: meta.color }}
          >
            Plate · {String(position).padStart(2, "0")} of{" "}
            {String(total).padStart(2, "0")}
          </div>
          <div
            className="mt-2 font-display font-light text-[96px] leading-[0.86] tracking-[-0.045em]"
            style={{ color: meta.color }}
          >
            {articles.length}
          </div>
          <div className="mt-1 font-mono text-[10.5px] text-foreground-subtle uppercase tracking-[0.14em]">
            {title.toLowerCase()} {noun}
          </div>
          <p className="mt-4 max-w-[200px] font-body text-[14px] text-muted-foreground leading-[1.5]">
            {blurb}
          </p>
        </div>

        {/* indexed rows */}
        <div>
          <h2 className="m-0 font-display font-normal text-[clamp(30px,4vw,40px)] text-foreground leading-[1.04] tracking-[-0.022em]">
            {title},{" "}
            <em className="font-light italic" style={{ color: meta.color }}>
              in order.
            </em>
          </h2>

          <table className="mt-5 w-full border-collapse">
            <caption className="sr-only">
              {title} articles, sorted by date, newest first.
            </caption>
            <thead className="sr-only">
              <tr>
                <th scope="col">Index</th>
                <th scope="col">Title</th>
                <th scope="col">Topic</th>
                <th scope="col">Date</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((article, i) => (
                <tr
                  className="align-baseline"
                  key={article.slug}
                  style={{
                    borderTop:
                      i === 0
                        ? `2px solid ${meta.color}`
                        : "1px solid var(--border)",
                  }}
                >
                  <td className="w-[58px] py-3.5 align-baseline">
                    <span
                      className="font-display font-light text-[28px] leading-[0.9] tracking-[-0.03em]"
                      style={{ color: meta.color }}
                    >
                      {meta.prefix}
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  </td>
                  <td className="py-3.5 pr-6 align-baseline">
                    <InternalLink
                      className="font-display font-medium text-[19px] text-foreground leading-[1.2] tracking-[-0.013em] no-underline transition-colors hover:text-brand"
                      href={`/articles/${article.slug}`}
                      previewMeta={article.meta}
                    >
                      {article.meta.title}
                    </InternalLink>
                  </td>
                  <td className="w-[150px] py-3.5 pr-6 align-baseline">
                    {article.meta.topic && (
                      <span className="whitespace-nowrap font-mono text-[10px] text-foreground-subtle uppercase tracking-[0.12em]">
                        <TopicDot size={6} topic={article.meta.topic} />
                        {TOPIC_META[article.meta.topic].label}
                      </span>
                    )}
                  </td>
                  <td className="w-[150px] whitespace-nowrap py-3.5 text-right align-baseline font-mono text-[10.5px] text-foreground-subtle uppercase tracking-[0.12em]">
                    <time dateTime={article.meta.date}>
                      {formatDateShort(article.meta.date)}
                    </time>{" "}
                    · {article.meta.readingTime}′
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {articles.length > visible.length && (
            <a
              className="mt-3.5 inline-block border-current border-b pb-0.5 font-mono text-[11px] uppercase tracking-[0.18em]"
              href={`/articles/tag/${slug}`}
              style={{ color: meta.color }}
            >
              All {articles.length} {title.toLowerCase()} {noun} →
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
