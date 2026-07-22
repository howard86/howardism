import { DomainGroup } from "./domain-group";
import type { DomainGroup as DomainGroupData } from "./domain-groups";
import { IndexRow } from "./index-row";
import { KIND_META } from "./kind-meta";
import type { ArticleEntity } from "./service";
import type { TagSectionSlug } from "./tag-sections";

interface KindPlateProps {
  articles: ArticleEntity[];
  blurb: string;
  /** When set, render per-domain sub-sections instead of a flat list. */
  groups?: DomainGroupData[];
  /** Subject tags with their own page — used to decide which chips link. */
  navigable: ReadonlySet<string>;
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
  groups,
  navigable,
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
      className="border-border border-b px-gutter py-10"
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
            className="mt-2 font-display font-light text-[56px] leading-[0.86] tracking-[-0.045em] lg:text-[96px]"
            style={{ color: meta.color }}
          >
            {articles.length}
          </div>
          <div className="mt-1 font-mono text-[10.5px] text-foreground-subtle uppercase tracking-[0.14em]">
            {title.toLowerCase()} {noun}
          </div>
          <p className="mt-4 hidden max-w-[200px] font-body text-[14px] text-muted-foreground leading-[1.5] lg:block">
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

          {groups ? (
            <div className="mt-5 flex flex-col gap-7">
              {groups.map((group) => (
                <DomainGroup
                  articles={group.articles}
                  domain={group.domain}
                  key={group.domain}
                  navigable={navigable}
                />
              ))}
            </div>
          ) : (
            <>
              <ol className="m-0 mt-5 list-none p-0">
                {visible.map((article, i) => (
                  <IndexRow
                    accent={meta.color}
                    article={article}
                    first={i === 0}
                    key={article.slug}
                    navigable={navigable}
                    ordinal={i + 1}
                    prefix={meta.prefix}
                  />
                ))}
              </ol>

              {articles.length > visible.length && (
                <a
                  className="mt-3.5 inline-block border-current border-b pb-0.5 font-mono text-[11px] uppercase tracking-[0.18em]"
                  href={`/articles/tag/${slug}`}
                  style={{ color: meta.color }}
                >
                  All {articles.length} {title.toLowerCase()} {noun} →
                </a>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
