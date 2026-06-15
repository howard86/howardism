import { cn } from "@howardism/ui/lib/utils";
import type { ReactNode } from "react";

import { DataGrid } from "./data-grid";

interface DiscPageHeaderProps {
  /** Domain/kind tint for the compact top rule + title accent. */
  accent?: string;
  children?: ReactNode;
  data?: [string, ReactNode][];
  /** Right eyebrow content ("Plate · No.", or reader badges + brand). */
  eyebrowEnd: ReactNode;
  /** Left eyebrow content (volume, or "Plate II · domain" on the reader). */
  eyebrowStart: ReactNode;
  /** Stack the DataGrid label over value — for the narrow compact column. */
  stackData?: boolean;
  title: string;
  titleAccent?: ReactNode;
  /** "full" — masthead double-rule + large title; "compact" — reading/shelf. */
  variant?: "full" | "compact";
}

export function DiscPageHeader({
  variant = "full",
  eyebrowStart,
  eyebrowEnd,
  title,
  titleAccent,
  accent,
  data,
  stackData = false,
  children,
}: DiscPageHeaderProps) {
  if (variant === "compact") {
    const hasAccent = Boolean(accent);
    return (
      <section className="hw-grain relative">
        <div
          className={cn(
            hasAccent
              ? "border-t-[3px] border-b border-b-border border-double pt-2.5 pb-10"
              : "border-border border-b border-dashed pt-8 pb-6"
          )}
          style={hasAccent ? { borderTopColor: accent } : undefined}
        >
          <div className="mb-7 flex items-baseline justify-between gap-4">
            <span
              className={cn(
                "inline-flex items-center font-mono text-[10.5px] uppercase tracking-[0.22em]",
                hasAccent ? null : "text-foreground-subtle"
              )}
              style={hasAccent ? { color: accent } : undefined}
            >
              {eyebrowStart}
            </span>
            <span className="inline-flex items-center gap-2 font-mono text-[10.5px] text-foreground-subtle uppercase tracking-[0.22em]">
              {eyebrowEnd}
            </span>
          </div>
          <h1 className="m-0 font-display font-normal text-[27px] text-foreground leading-[1.2] tracking-[-0.015em]">
            {title}
            {titleAccent && (
              <>
                {" "}
                <em
                  className="italic"
                  style={{ color: accent ?? "var(--brand)" }}
                >
                  {titleAccent}
                </em>
              </>
            )}
          </h1>
          {data && (
            <div className="mt-5">
              <DataGrid maxWidth={280} rows={data} stack={stackData} />
            </div>
          )}
          {children && <div className="mt-5">{children}</div>}
        </div>
      </section>
    );
  }

  return (
    <section className="hw-grain relative">
      <div className="flex items-baseline justify-between border-foreground border-b-[3px] border-double pb-3">
        <span className="font-mono text-[11px] text-muted-foreground uppercase tracking-[0.18em]">
          {eyebrowStart}
        </span>
        <span className="font-mono text-[11px] text-foreground-subtle uppercase tracking-[0.14em]">
          {eyebrowEnd}
        </span>
      </div>

      <div className="py-8">
        <h1 className="m-0 font-display font-normal text-[clamp(40px,6vw,72px)] text-foreground leading-[1.05] tracking-[-0.03em]">
          {title}{" "}
          {titleAccent && <em className="text-brand italic">{titleAccent}</em>}
        </h1>
        {data && (
          <div className="mt-7">
            <DataGrid rows={data} />
          </div>
        )}
        {children}
      </div>
    </section>
  );
}
