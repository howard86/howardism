import { ScrollArea } from "@howardism/ui/components/scroll-area";

import {
  type ArticleHeading,
  type ArticleLink,
  getArticleConnections,
} from "../service";
import { ArticleLinkRow } from "./article-link-row";
import { ArticleToc } from "./article-toc";
import { formatBacklinkLabel } from "./backlinks-disclosure";

interface ArticleRailProps {
  headings: ArticleHeading[];
  slug: string;
}

export async function ArticleRail({ headings, slug }: ArticleRailProps) {
  const { backlinks, related } = await getArticleConnections(slug);

  const isEmpty =
    headings.length === 0 && related.length === 0 && backlinks.length === 0;
  if (isEmpty) {
    return null;
  }

  return (
    <aside aria-label="Article navigation rail" className="rail:block hidden">
      <div className="sticky top-20 flex h-[calc(100vh-6rem)] flex-col gap-6">
        <ArticleToc headings={headings} />
        <ScrollArea className="min-h-0 flex-1">
          <div className="flex flex-col gap-8 pr-3 pb-4">
            <RailSection label="Related articles" links={related} />
            <RailSection
              label={formatBacklinkLabel(backlinks.length)}
              links={backlinks}
            />
          </div>
        </ScrollArea>
      </div>
    </aside>
  );
}

interface RailSectionProps {
  label: string;
  links: ArticleLink[];
}

function RailSection({ label, links }: RailSectionProps) {
  if (links.length === 0) {
    return null;
  }
  return (
    <section>
      <div className="mb-3 font-medium font-mono text-[10.5px] text-[var(--article-accent)] uppercase tracking-[0.22em]">
        {label}
      </div>
      <ul className="m-0 flex list-none flex-col gap-3 pl-0">
        {links.map((link) => (
          <ArticleLinkRow key={link.slug} link={link} />
        ))}
      </ul>
    </section>
  );
}
