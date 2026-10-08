import { cn } from "@howardism/ui/lib/utils";

import { InternalLink } from "@/components/internal-link";

export function CompareEmpty() {
  return (
    <div className="mx-auto max-w-read px-gutter py-20 text-center">
      <h1 className="font-display font-normal text-[22px] text-foreground tracking-[-0.015em]">
        Nothing to compare.
      </h1>
      <p className="mt-3 font-body text-[15px] text-muted-foreground leading-[1.6]">
        Add up to three article slugs to the URL — e.g.{" "}
        <code className="rounded-sm bg-muted px-1.5 py-0.5 font-mono text-[13px]">
          /compare?ids=slug-a,slug-b
        </code>
        .
      </p>
      <InternalLink
        className={cn(
          "mt-6 inline-block font-mono text-[11px] uppercase tracking-[0.16em]",
          "text-brand no-underline transition-colors hover:text-foreground"
        )}
        href="/articles"
      >
        Browse all articles →
      </InternalLink>
    </div>
  );
}
