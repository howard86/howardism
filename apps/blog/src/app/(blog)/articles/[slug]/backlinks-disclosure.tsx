import { InternalLink } from "@/components/internal-link";
import { TagChip } from "@/components/tag-chip";
import { truncate } from "@/utils/text";

import { type ArticleLink, getBacklinks, getRelated } from "../service";

const BACKLINK_DESCRIPTION_MAX = 120;

interface BacklinksDisclosureProps {
  slug: string;
}

export async function BacklinksDisclosure({ slug }: BacklinksDisclosureProps) {
  const [backlinks, related] = await Promise.all([
    getBacklinks(slug),
    getRelated(slug),
  ]);

  return <BacklinksDisclosureView backlinks={backlinks} related={related} />;
}

interface BacklinksDisclosureViewProps {
  backlinks: ArticleLink[];
  related: ArticleLink[];
}

export function BacklinksDisclosureView({
  backlinks,
  related,
}: BacklinksDisclosureViewProps) {
  const hasBacklinks = backlinks.length > 0;
  const hasRelated = related.length > 0;

  if (!(hasBacklinks || hasRelated)) {
    return null;
  }

  return (
    <section aria-label="Article cross-references" className="mb-10">
      {hasBacklinks && (
        <DisclosurePanel
          links={backlinks}
          summary={formatBacklinkLabel(backlinks.length)}
        />
      )}
      {hasRelated && (
        <DisclosurePanel links={related} summary="Related articles" />
      )}
    </section>
  );
}

interface DisclosurePanelProps {
  links: ArticleLink[];
  summary: string;
}

function DisclosurePanel({ links, summary }: DisclosurePanelProps) {
  return (
    <details className="group border-foreground border-t-2 border-b border-b-border py-3 [&>summary::-webkit-details-marker]:hidden [&[open]+details]:border-t-0">
      <summary className="flex cursor-pointer list-none items-baseline gap-1.5 font-medium font-mono text-brand text-xs uppercase tracking-[0.08em] hover:text-foreground">
        <span aria-hidden="true">
          <span className="inline group-open:hidden">[+]</span>
          <span className="hidden group-open:inline">[−]</span>
        </span>
        <span>{summary}</span>
      </summary>
      <ul className="m-0 mt-4 flex list-none flex-col gap-4 pl-0">
        {links.map((link) => (
          <BacklinkRow key={link.slug} link={link} />
        ))}
      </ul>
    </details>
  );
}

interface BacklinkRowProps {
  link: ArticleLink;
}

function BacklinkRow({ link }: BacklinkRowProps) {
  const { slug, meta } = link;
  return (
    <li className="flex flex-col gap-0.5">
      <TagChip tag={meta.tag} />
      <InternalLink
        className="font-display font-medium text-[0.95rem] text-foreground no-underline hover:text-brand"
        href={`/articles/${slug}`}
        previewMeta={meta}
      >
        {meta.title}
      </InternalLink>
      <p className="m-0 font-body text-muted-foreground text-xs leading-[1.45]">
        {truncate(meta.description, BACKLINK_DESCRIPTION_MAX)}
      </p>
    </li>
  );
}

function formatBacklinkLabel(count: number): string {
  if (count === 1) {
    return "1 article links here";
  }
  return `${count} articles link here`;
}
