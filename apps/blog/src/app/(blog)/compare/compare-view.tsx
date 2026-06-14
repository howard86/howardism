"use client";

import { cn } from "@howardism/ui/lib/utils";
import Link from "next/link";
import { type ReactNode, useState } from "react";

export interface ComparePanel {
  body: ReactNode;
  href: string;
  slug: string;
  title: string;
}

/** Static column-count classes so Tailwind keeps them (no interpolation). */
const COLUMN_CLASS: Record<number, string> = {
  1: "lg:grid-cols-1",
  2: "lg:grid-cols-2",
  3: "lg:grid-cols-3",
};

const PANEL_CLASS =
  "max-h-[calc(100dvh-9rem)] overflow-y-auto rounded-md border border-border bg-card/40 p-5";

/**
 * Side-by-side reader for up to three article bodies. On wide screens the
 * panels sit in parallel, each scrolling on its own. Below `lg` they collapse
 * to a tab bar that flips one panel into view at a time; all panels stay
 * mounted, so each keeps its scroll position across tab switches.
 */
export function CompareView({ panels }: { panels: ComparePanel[] }) {
  const [active, setActive] = useState(0);

  return (
    <div className="mx-auto max-w-wide px-gutter py-6">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h1 className="font-mono text-[11px] text-foreground-subtle uppercase tracking-[0.2em]">
          Comparing {panels.length}{" "}
          {panels.length === 1 ? "article" : "articles"}
        </h1>
        <Link
          className="font-mono text-[11px] text-foreground-subtle uppercase tracking-[0.16em] no-underline transition-colors hover:text-brand"
          href="/articles"
        >
          All articles →
        </Link>
      </div>

      {/* Mobile/tablet tab bar */}
      <fieldset
        aria-label="Choose an article to read"
        className="m-0 flex flex-wrap gap-1.5 border-0 p-0 lg:hidden"
      >
        {panels.map((panel, index) => (
          <button
            aria-pressed={index === active}
            className="rounded-full border border-border px-3 py-1.5 font-body text-[13px] text-foreground-subtle transition-colors aria-pressed:border-brand/40 aria-pressed:bg-brand/10 aria-pressed:text-brand"
            key={panel.slug}
            onClick={() => setActive(index)}
            type="button"
          >
            {panel.title}
          </button>
        ))}
      </fieldset>

      <div
        className={cn(
          "grid grid-cols-1 gap-6",
          COLUMN_CLASS[panels.length] ?? COLUMN_CLASS[3]
        )}
      >
        {panels.map((panel, index) => (
          <section
            aria-label={panel.title}
            className={cn(
              PANEL_CLASS,
              index === active ? "block" : "hidden",
              "lg:block"
            )}
            key={panel.slug}
          >
            <header className="mb-5 border-border border-b border-dashed pb-3">
              <Link
                className="font-display text-[18px] text-foreground leading-[1.25] no-underline transition-colors hover:text-brand"
                href={panel.href}
              >
                {panel.title}
              </Link>
            </header>
            {panel.body}
          </section>
        ))}
      </div>
    </div>
  );
}
