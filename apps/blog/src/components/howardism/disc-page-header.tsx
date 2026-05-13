import type { ReactNode } from "react";

import { DataGrid } from "./data-grid";
import { SunDisc } from "./sun-disc";

const TRAILING_PUNCTUATION = /[,.]$/;

interface DiscPageHeaderProps {
  children?: ReactNode;
  data?: [string, string][];
  discSize?: number;
  number?: string;
  plate?: string;
  title: string;
  titleAccent?: string;
  volume: string;
}

// Inner-page masthead in the Sun Disc style: double-rule ledger, one-line title, margin-notes
// data grid, and the signature orb. Mirrors the design's DiscPageHeader (sundisc.js).
export function DiscPageHeader({
  volume,
  title,
  titleAccent,
  plate = "Plate",
  number = "00",
  data,
  discSize = 420,
  children,
}: DiscPageHeaderProps) {
  return (
    <section className="hw-grain relative">
      {/* Double-rule masthead */}
      <div className="flex items-baseline justify-between border-foreground border-b-[3px] border-double pb-3">
        <span className="font-mono text-[11px] text-muted-foreground uppercase tracking-[0.18em]">
          {volume}
        </span>
        <span className="font-mono text-[11px] text-foreground-subtle uppercase tracking-[0.14em]">
          {plate} · No. {number}
        </span>
      </div>

      <div className="grid grid-cols-1 items-center gap-12 py-8 min-[820px]:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <div>
          <h1 className="m-0 font-display font-normal text-[clamp(40px,6vw,72px)] text-foreground leading-[1.05] tracking-[-0.03em]">
            {title}{" "}
            {titleAccent && (
              <em className="text-brand italic">{titleAccent}</em>
            )}
          </h1>
          {data && (
            <div className="mt-7">
              <DataGrid rows={data} />
            </div>
          )}
          {children}
        </div>
        <div className="mt-6 flex justify-center min-[820px]:mt-0 min-[820px]:max-w-full min-[820px]:justify-end min-[820px]:justify-self-end">
          <SunDisc
            number={number}
            plate={`${plate} · ${title.replace(TRAILING_PUNCTUATION, "")}`}
            size={discSize}
          />
        </div>
      </div>
    </section>
  );
}
