import { SubjectChip } from "@/components/howardism/subject-chip";

import type { TagIndexEntry } from "./service";

interface TagIndexProps {
  tags: TagIndexEntry[];
}

/**
 * "By subject" plate — every free-form subject tag across the wiki as a
 * clickable chip, most-referenced first. Multi-article tags open their tag
 * page; a tag carried by a single article jumps straight to that article.
 */
export function TagIndex({ tags }: TagIndexProps) {
  if (tags.length === 0) {
    return null;
  }

  const multi = tags.filter((entry) => entry.count > 1);
  const singles = tags.filter((entry) => entry.count === 1);

  return (
    <section className="border-border border-b px-gutter py-10" id="subjects">
      <div className="grid grid-cols-1 gap-x-11 gap-y-7 lg:grid-cols-[180px_1fr]">
        <div>
          <div className="font-medium font-mono text-[10.5px] text-brand uppercase tracking-[0.22em]">
            Plate · #
          </div>
          <div className="mt-2 font-display font-light text-[56px] text-brand leading-[0.86] tracking-[-0.045em] lg:text-[96px]">
            {tags.length}
          </div>
          <div className="mt-1 font-mono text-[10.5px] text-foreground-subtle uppercase tracking-[0.14em]">
            subjects
          </div>
          <p className="mt-4 hidden max-w-[200px] font-body text-[14px] text-muted-foreground leading-[1.5] lg:block">
            Free-form subjects across the wiki, most-referenced first.
          </p>
        </div>

        <div>
          <h2 className="m-0 font-display font-normal text-[clamp(30px,4vw,40px)] text-foreground leading-[1.04] tracking-[-0.022em]">
            By subject,{" "}
            <em className="font-light text-brand italic">most cited.</em>
          </h2>
          <div className="mt-6 flex flex-wrap">
            {multi.map(({ tag, href }) => (
              <SubjectChip href={href} key={tag} tag={tag} />
            ))}
          </div>
          {singles.length > 0 && (
            <details className="mt-4">
              <summary className="cursor-pointer font-mono text-[11px] text-foreground-subtle uppercase tracking-[0.18em]">
                +{singles.length} one-off subjects
              </summary>
              <div className="mt-4 flex flex-wrap">
                {singles.map(({ tag, href }) => (
                  <SubjectChip href={href} key={tag} tag={tag} />
                ))}
              </div>
            </details>
          )}
        </div>
      </div>
    </section>
  );
}
