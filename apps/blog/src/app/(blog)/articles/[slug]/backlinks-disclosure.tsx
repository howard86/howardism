import { type ArticleLink, getArticleConnections } from "../service";
import { ArticleLinkRow } from "./article-link-row";

interface BacklinksDisclosureProps {
  defaultOpen?: boolean;
  preview?: boolean;
  slug: string;
}

export async function BacklinksDisclosure({
  defaultOpen = false,
  preview = true,
  slug,
}: BacklinksDisclosureProps) {
  const { backlinks, related } = await getArticleConnections(slug);

  return (
    <BacklinksDisclosureView
      backlinks={backlinks}
      defaultOpen={defaultOpen}
      preview={preview}
      related={related}
    />
  );
}

interface BacklinksDisclosureViewProps {
  backlinks: ArticleLink[];
  defaultOpen?: boolean;
  preview?: boolean;
  related: ArticleLink[];
}

export function BacklinksDisclosureView({
  backlinks,
  defaultOpen = false,
  related,
  preview = true,
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
          defaultOpen={defaultOpen}
          links={backlinks}
          preview={preview}
          summary={formatBacklinkLabel(backlinks.length)}
        />
      )}
      {hasRelated && (
        <DisclosurePanel
          defaultOpen={defaultOpen}
          links={related}
          preview={preview}
          summary="Related articles"
        />
      )}
    </section>
  );
}

interface DisclosurePanelProps {
  defaultOpen?: boolean;
  links: ArticleLink[];
  preview?: boolean;
  summary: string;
}

function DisclosurePanel({
  defaultOpen,
  links,
  summary,
  preview = true,
}: DisclosurePanelProps) {
  return (
    <details
      className="group border-foreground border-t-2 border-b border-b-border py-3 [&>summary::-webkit-details-marker]:hidden [&[open]+details]:border-t-0"
      open={defaultOpen}
    >
      <summary className="flex cursor-pointer list-none items-baseline gap-1.5 font-medium font-mono text-[var(--article-accent)] text-xs uppercase tracking-[0.08em] hover:text-foreground">
        <span aria-hidden="true">
          <span className="inline group-open:hidden">[+]</span>
          <span className="hidden group-open:inline">[−]</span>
        </span>
        <span>{summary}</span>
      </summary>
      <ul className="m-0 mt-4 flex list-none flex-col gap-4 pl-0">
        {links.map((link) => (
          <ArticleLinkRow key={link.slug} link={link} preview={preview} />
        ))}
      </ul>
    </details>
  );
}

export function formatBacklinkLabel(count: number): string {
  return `Cited by ${count}`;
}
