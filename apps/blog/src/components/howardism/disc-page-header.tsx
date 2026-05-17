import type { ReactNode } from "react";

import { DataGrid } from "./data-grid";

interface DiscPageHeaderProps {
  children?: ReactNode;
  data?: [string, string][];
  number?: string;
  plate?: string;
  title: string;
  titleAccent?: string;
  volume: string;
}

export function DiscPageHeader({
  volume,
  title,
  titleAccent,
  plate = "Plate",
  number = "00",
  data,
  children,
}: DiscPageHeaderProps) {
  return (
    <section className="hw-grain relative">
      <div className="flex items-baseline justify-between border-foreground border-b-[3px] border-double pb-3">
        <span className="font-mono text-[11px] text-muted-foreground uppercase tracking-[0.18em]">
          {volume}
        </span>
        <span className="font-mono text-[11px] text-foreground-subtle uppercase tracking-[0.14em]">
          {plate} · No. {number}
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
