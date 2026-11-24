import { DataGrid } from "@/components/howardism/data-grid";
import { DomainDot } from "@/components/howardism/domain-dot";
import { formatDateShort } from "@/utils/time";
import type {
  ArticleEntity,
  LatestRelease,
  WikiSource,
} from "./articles/service";
import { formatAuthors } from "./desk";

/** Sources shown before the "All N sources" disclosure. */
const VISIBLE_SOURCES = 6;
/** Revised notes listed per source before "+k more". */
const REVISED_LIMIT = 10;

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const META_CLASS =
  "font-mono text-[9.5px] text-foreground-subtle uppercase tracking-[0.16em]";

type SourceInfo = Pick<
  WikiSource,
  "author" | "citedBy" | "kind" | "published" | "url"
>;

interface ThisIssueProps {
  /** Visible articles, keyed by slug. */
  entities: Record<string, ArticleEntity | undefined>;
  release: LatestRelease;
  /** Wiki sources by title, for kind/author/url/refs. */
  sources: ReadonlyMap<string, SourceInfo>;
}

function formatWhen(published: string | undefined): string | null {
  if (!published) {
    return null;
  }
  return ISO_DATE_RE.test(published) ? formatDateShort(published) : published;
}

const pluralize = (n: number, word: string) =>
  `${n} ${word}${n === 1 ? "" : "s"}`;

function NoteLink({
  slug,
  entities,
}: {
  entities: ThisIssueProps["entities"];
  slug: string;
}) {
  const meta = entities[slug]?.meta;
  if (!meta) {
    return null;
  }
  return (
    <>
      {meta.domain ? <DomainDot domain={meta.domain} size={6} /> : null}
      <a
        className="text-foreground no-underline transition-colors hover:text-brand"
        href={`/articles/${slug}`}
      >
        {meta.title}
      </a>
    </>
  );
}

function RevisedList({
  slugs,
  entities,
}: {
  entities: ThisIssueProps["entities"];
  slugs: string[];
}) {
  const shown = slugs.slice(0, REVISED_LIMIT);
  const rest = slugs.length - shown.length;
  return (
    <p className="m-0 mt-1.5 font-body text-[14px] text-muted-foreground leading-[1.7]">
      {shown.map((slug, i) => (
        <span key={slug}>
          {i > 0 ? (
            <span aria-hidden="true" className="mx-1.5 text-foreground-subtle">
              /
            </span>
          ) : null}
          <NoteLink entities={entities} slug={slug} />
        </span>
      ))}
      {rest > 0 ? (
        <>
          <span aria-hidden="true" className="mx-1.5 text-foreground-subtle">
            /
          </span>
          <span className={META_CLASS}>+{rest} more</span>
        </>
      ) : null}
    </p>
  );
}

function SourceBlock({
  group,
  info,
  entities,
}: {
  entities: ThisIssueProps["entities"];
  group: LatestRelease["groups"][number];
  info: SourceInfo | undefined;
}) {
  const when = formatWhen(info?.published);
  const refs = info?.citedBy.length ?? 0;
  return (
    <article className="grid grid-cols-1 gap-x-8 gap-y-3 border-border border-t py-4 first:border-t-0 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
      <div>
        <div className={META_CLASS}>
          {info?.kind ?? "Source"}
          {when ? ` · ${when}` : ""}
          {refs > 0 ? ` · ${refs} refs` : ""}
        </div>
        <div className="mt-1 font-display font-medium text-[17px] text-foreground leading-[1.25]">
          {info?.url ? (
            <a
              className="no-underline transition-colors hover:text-brand"
              href={info.url}
              rel="noopener noreferrer"
              target="_blank"
            >
              {group.title}
            </a>
          ) : (
            group.title
          )}
        </div>
        {info?.author ? (
          <div className="mt-0.5 font-body text-[12.5px] text-foreground-subtle italic">
            {formatAuthors(info.author)}
          </div>
        ) : null}
      </div>
      <div>
        {group.new.length > 0 ? (
          <>
            <div className={META_CLASS}>Filed · {group.new.length}</div>
            <ul className="m-0 mt-1.5 list-none p-0 font-display font-medium text-[15px] leading-[1.5]">
              {group.new.map((slug) => (
                <li key={slug}>
                  <NoteLink entities={entities} slug={slug} />
                </li>
              ))}
            </ul>
          </>
        ) : null}
        {group.revised.length > 0 ? (
          <>
            <div
              className={`${META_CLASS} ${group.new.length > 0 ? "mt-3" : ""}`}
            >
              Revised · {group.revised.length}
            </div>
            <RevisedList entities={entities} slugs={group.revised} />
          </>
        ) : null}
      </div>
    </article>
  );
}

/**
 * "This issue" — what the latest release changed, filed under the source each
 * note gained. The overflow sources sit behind a `<details>` so the section
 * stays a static, script-free render.
 */
export function ThisIssue({ release, entities, sources }: ThisIssueProps) {
  const { entry, groups, upkeep, newSlugs, revisedSlugs } = release;
  const head = groups.slice(0, VISIBLE_SOURCES);
  const tail = groups.slice(VISIBLE_SOURCES);
  const block = (group: (typeof groups)[number]) => (
    <SourceBlock
      entities={entities}
      group={group}
      info={sources.get(group.title)}
      key={group.title}
    />
  );

  return (
    <section className="border-border border-b px-gutter py-10">
      <div className="grid grid-cols-1 gap-x-11 gap-y-8 lg:grid-cols-[180px_1fr]">
        <div>
          <div className="font-medium font-mono text-[10.5px] text-brand uppercase tracking-[0.22em]">
            Plate · {String(entry.no).padStart(2, "0")}
          </div>
          <h2 className="mt-2 font-display font-normal text-[clamp(30px,4vw,40px)] text-foreground leading-[1.04] tracking-[-0.022em]">
            This <em className="text-brand italic">issue.</em>
          </h2>
          <p className="mt-1.5 max-w-[240px] font-body text-[15px] text-muted-foreground leading-[1.5]">
            What each source changed. One source usually files a note and
            rewrites the ones it touches.
          </p>
          <div className="mt-4">
            <DataGrid
              maxWidth={200}
              rows={[
                ["New", String(newSlugs.length)],
                ["Revised", String(revisedSlugs.length)],
                ["Sources", String(groups.length)],
              ]}
            />
          </div>
        </div>

        <div className="min-w-0">
          {head.map(block)}
          {tail.length > 0 ? (
            <details className="group">
              <summary className="mt-2 inline-block cursor-pointer list-none border-brand border-b pb-0.5 font-mono text-[11px] text-brand uppercase tracking-[0.18em] group-open:mb-2 [&::-webkit-details-marker]:hidden">
                All {groups.length} sources this issue →
              </summary>
              {tail.map(block)}
            </details>
          ) : null}
          {upkeep.length > 0 ? (
            <p className="m-0 mt-4 border-border border-t border-dashed pt-4 font-body text-[14px] text-muted-foreground">
              <span className={META_CLASS}>Upkeep</span> ·{" "}
              {pluralize(upkeep.length, "note")} revised for links, merges and
              corrections.
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
