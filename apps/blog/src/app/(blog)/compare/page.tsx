import { cn } from "@howardism/ui/lib/utils";
import type { Metadata } from "next";
import Link from "next/link";

import { env } from "@/config/env";
import { resolveCompareIds } from "@/lib/compare-ids";

import { importArticleModule } from "../articles/render-article";
import { getArticles } from "../articles/service";
import { CompareView } from "./compare-view";

export const metadata: Metadata = {
  title: "Compare — Howardism",
  description:
    "Read up to three articles side by side to cross-reference them.",
  alternates: { canonical: `${env.NEXT_PUBLIC_DOMAIN_NAME}/compare` },
  // URL-driven tool view, not indexable content.
  robots: { index: false, follow: true },
};

interface ComparePageProps {
  searchParams: Promise<{ ids?: string | string[] }>;
}

function CompareEmpty() {
  return (
    <div className="mx-auto max-w-read px-4 py-20 text-center">
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
      <Link
        className={cn(
          "mt-6 inline-block font-mono text-[11px] uppercase tracking-[0.16em]",
          "text-brand no-underline transition-colors hover:text-foreground"
        )}
        href="/articles"
      >
        Browse all articles →
      </Link>
    </div>
  );
}

export default async function ComparePage({ searchParams }: ComparePageProps) {
  const { ids } = await searchParams;
  const { ids: knownIds } = await getArticles();
  const slugs = resolveCompareIds(ids, new Set(knownIds));

  if (slugs.length === 0) {
    return <CompareEmpty />;
  }

  const panels = await Promise.all(
    slugs.map(async (slug) => {
      const mod = await importArticleModule(slug, "en");
      const Body = mod.default;
      return {
        slug,
        title: mod.meta.title,
        href: `/articles/${slug}`,
        body: (
          <div
            className={cn(
              "prose max-w-none",
              mod.meta.dropCap && "prose-drop-cap"
            )}
          >
            <Body />
          </div>
        ),
      };
    })
  );

  return <CompareView panels={panels} />;
}
