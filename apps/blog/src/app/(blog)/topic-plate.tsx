import { InternalLink } from "@/components/internal-link";
import { formatDateShort } from "@/utils/time";

import type {
  ArticleEntity,
  ArticleTopic,
  WikiSource,
} from "./articles/service";
import { TOPIC_META } from "./articles/topic-meta";
import { TopicSparkline } from "./topic-sparkline";

interface TopicPlateProps {
  articles: ArticleEntity[];
  bars: number[];
  count: number;
  index: number;
  leadSource: WikiSource | undefined;
  topic: ArticleTopic;
}

const VISIBLE_NOTES = 4;

/**
 * One home-page topic plate: a giant count numeral + activity sparkline, the
 * topic's freshest notes, and the source most cited within the topic.
 */
export function TopicPlate({
  topic,
  articles,
  count,
  bars,
  leadSource,
  index,
}: TopicPlateProps) {
  const meta = TOPIC_META[topic];
  const notes = articles.slice(0, VISIBLE_NOTES);
  const banded = index % 2 === 1;
  const plateNo = String(index + 1).padStart(2, "0");

  return (
    <section
      className="border-border border-b px-[clamp(20px,5vw,56px)] py-9"
      style={banded ? { background: "var(--card)" } : undefined}
    >
      <div className="grid grid-cols-1 items-start gap-x-11 gap-y-8 lg:grid-cols-[180px_1fr_320px]">
        {/* marker */}
        <div>
          <div
            className="font-medium font-mono text-[10.5px] uppercase tracking-[0.22em]"
            style={{ color: meta.color }}
          >
            Plate · {plateNo}
          </div>
          <div
            className="mt-2 font-display font-light text-[96px] leading-[0.86] tracking-[-0.045em]"
            style={{ color: meta.color }}
          >
            {count}
          </div>
          <div className="mt-1 font-mono text-[10.5px] text-foreground-subtle uppercase tracking-[0.14em]">
            filed under {meta.label.toLowerCase()}
          </div>
          <div className="mt-3.5 flex flex-col gap-1.5">
            <TopicSparkline bars={bars} color={meta.color} />
            <div className="font-mono text-[9.5px] text-foreground-subtle uppercase tracking-[0.14em]">
              Activity · 8 wks
            </div>
          </div>
        </div>

        {/* body */}
        <div>
          <h2 className="m-0 font-display font-normal text-[clamp(30px,4vw,40px)] text-foreground leading-[1.04] tracking-[-0.022em]">
            {meta.label},{" "}
            <em className="font-light italic" style={{ color: meta.color }}>
              in order.
            </em>
          </h2>
          <p className="mt-1.5 max-w-[580px] font-body text-[16px] text-muted-foreground leading-[1.5]">
            {meta.blurb}
          </p>

          <ol className="m-0 mt-5 list-none p-0">
            {notes.map((article, i) => (
              <li
                className="grid grid-cols-[auto_1fr_auto] items-baseline gap-x-4 py-2.5"
                key={article.slug}
                style={{
                  borderTop:
                    i === 0
                      ? `2px solid ${meta.color}`
                      : "1px solid var(--border)",
                }}
              >
                <span
                  className="font-medium font-mono text-[11px] tracking-[0.14em]"
                  style={{ color: meta.color }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <InternalLink
                  className="font-display font-medium text-[18px] text-foreground leading-[1.25] tracking-[-0.008em] no-underline transition-colors hover:text-brand"
                  href={`/articles/${article.slug}`}
                  previewMeta={article.meta}
                >
                  {article.meta.title}
                </InternalLink>
                <span className="whitespace-nowrap font-mono text-[10.5px] text-foreground-subtle tracking-[0.12em]">
                  {formatDateShort(article.meta.date)} ·{" "}
                  {article.meta.readingTime}′
                </span>
              </li>
            ))}
            <li className="border-border border-t py-2.5">
              <a
                className="border-current border-b pb-0.5 font-mono text-[11px] uppercase tracking-[0.18em]"
                href={`/articles/topic/${topic}`}
                style={{ color: meta.color }}
              >
                All {count} notes in {meta.label.toLowerCase()} →
              </a>
            </li>
          </ol>
        </div>

        {/* source aside */}
        {leadSource && (
          <aside
            className="pt-1 pl-5"
            style={{ borderLeft: `2px solid ${meta.color}` }}
          >
            <div className="font-mono text-[10px] text-foreground-subtle uppercase tracking-[0.18em]">
              Sourced from · {leadSource.kind}
            </div>
            <div className="mt-1.5 font-display font-medium text-[18px] text-foreground leading-[1.25] tracking-[-0.01em]">
              {leadSource.url ? (
                <a
                  className="no-underline transition-colors hover:text-brand"
                  href={leadSource.url}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  {leadSource.title}
                </a>
              ) : (
                leadSource.title
              )}
            </div>
            {(leadSource.author || leadSource.published) && (
              <div className="mt-1 font-body text-[13.5px] text-foreground-subtle italic">
                {[leadSource.author, leadSource.published]
                  .filter(Boolean)
                  .join(" · ")}
              </div>
            )}
            <div
              className="mt-3.5 font-mono text-[10px] uppercase tracking-[0.16em]"
              style={{ color: meta.color }}
            >
              ● {leadSource.citedBy.length}{" "}
              {leadSource.citedBy.length === 1 ? "ref" : "refs"} in wiki
            </div>
          </aside>
        )}
      </div>
    </section>
  );
}
