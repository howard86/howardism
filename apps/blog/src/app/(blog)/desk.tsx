import { formatDateShort } from "@/utils/time";

import type { WikiSource } from "./articles/service";

interface DeskProps {
  sources: WikiSource[];
}

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function formatWhen(published: string | undefined): string | null {
  if (!published) {
    return null;
  }
  return ISO_DATE_RE.test(published) ? formatDateShort(published) : published;
}

/**
 * "The Desk" — the raw sources behind the wiki, ordered by how often they're
 * cited. Backed by the importer's `wiki-sources.json`.
 */
export function Desk({ sources }: DeskProps) {
  if (sources.length === 0) {
    return null;
  }

  const kinds = sources.reduce<Record<string, number>>((acc, s) => {
    acc[s.kind] = (acc[s.kind] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <section className="border-border border-b px-gutter py-10">
      <div className="grid grid-cols-1 gap-x-11 gap-y-8 lg:grid-cols-[180px_1fr]">
        <div>
          <div className="font-medium font-mono text-[10.5px] text-brand uppercase tracking-[0.22em]">
            Plate · ∞
          </div>
          <h2 className="mt-2 font-display font-normal text-[clamp(30px,4vw,40px)] text-foreground leading-[1.04] tracking-[-0.022em]">
            The <em className="text-brand italic">desk.</em>
          </h2>
          <p className="mt-1.5 max-w-[200px] font-body text-[15px] text-muted-foreground leading-[1.5]">
            The sources behind the wiki, ranked by how often they&apos;re cited.
          </p>
          <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 font-mono text-[10.5px] text-foreground-subtle uppercase tracking-[0.14em]">
            {Object.entries(kinds).map(([kind, n]) => (
              <div className="contents" key={kind}>
                <dt>{kind}</dt>
                <dd className="m-0 text-muted-foreground">{n}</dd>
              </div>
            ))}
          </dl>
        </div>

        <ul className="m-0 grid list-none grid-cols-1 gap-x-6 gap-y-0 p-0 sm:grid-cols-2 lg:grid-cols-3">
          {sources.map((source) => {
            const when = formatWhen(source.published);
            return (
              <li
                className="border-border border-b border-dashed py-3"
                key={source.title}
              >
                <div className="font-mono text-[9.5px] text-foreground-subtle uppercase tracking-[0.16em]">
                  {source.kind}
                  {when ? ` · ${when}` : ""}
                  {source.citedBy.length > 0
                    ? ` · ${source.citedBy.length} refs`
                    : ""}
                </div>
                <div className="mt-1 font-display font-medium text-[15px] text-foreground leading-[1.25]">
                  {source.url ? (
                    <a
                      className="no-underline transition-colors hover:text-brand"
                      href={source.url}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      {source.title}
                    </a>
                  ) : (
                    source.title
                  )}
                </div>
                {source.author && (
                  <div className="mt-0.5 font-body text-[12.5px] text-foreground-subtle italic">
                    {source.author}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
