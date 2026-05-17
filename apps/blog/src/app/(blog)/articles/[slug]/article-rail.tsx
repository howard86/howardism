import {
  type ArticleHeading,
  type ArticleLink,
  getBacklinks,
  getRelated,
} from "../service";
import { ArticleLinkRow } from "./article-link-row";
import { ArticleToc } from "./article-toc";
import { formatBacklinkLabel } from "./backlinks-disclosure";

interface ArticleRailProps {
  headings: ArticleHeading[];
  slug: string;
}

export async function ArticleRail({ headings, slug }: ArticleRailProps) {
  const [backlinks, related] = await Promise.all([
    getBacklinks(slug),
    getRelated(slug),
  ]);

  return (
    <aside aria-label="Article navigation rail" className="rail:block hidden">
      <div className="sticky top-8 flex max-h-[calc(100vh-4rem)] flex-col gap-8 overflow-y-auto pr-2 pb-4">
        <ArticleToc headings={headings} />
        <RailSection label="Related articles" links={related} />
        <RailSection
          label={formatBacklinkLabel(backlinks.length)}
          links={backlinks}
        />
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
      <div className="mb-3 font-medium font-mono text-[0.6875rem] text-foreground-subtle uppercase tracking-[0.16em]">
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
