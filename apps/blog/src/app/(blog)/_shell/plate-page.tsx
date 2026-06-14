import { cn } from "@howardism/ui/lib/utils";
import type { CSSProperties, ReactNode } from "react";

import { DiscPageHeader } from "@/components/howardism/disc-page-header";
import { DomainLabel } from "@/components/howardism/domain-label";

import type { ArticleDomain } from "../articles/service";
import { PLATE_META, type PlateKey } from "../plate-meta";

const VOLUME = "Howardism · Vol. 03";

const WIDTH_CLASS = {
  read: "max-w-read",
  index: "max-w-index",
  wide: "max-w-wide",
} as const;

interface PlatePageProps {
  /** Domain/kind tint for the compact header. */
  accent?: string;
  /** Body owns its own horizontal gutter (full-bleed banded sections). */
  bleed?: boolean;
  children: ReactNode;
  /** Plate II leaf — surfaces "Plate II · {domain}" in the compact eyebrow. */
  domain?: ArticleDomain;
  /** Override the right eyebrow (reader badges + brand). */
  eyebrowEnd?: ReactNode;
  /** "none" lets the page render its own header (e.g. the article reader). */
  header?: "full" | "compact" | "none";
  /** Rendered under the header DataGrid (intro copy, save button). */
  headerChildren?: ReactNode;
  headerData?: [string, ReactNode][];
  plate: PlateKey;
  /** Reading column: `max-w-read` widening to `max-w-index` at the rail bp. */
  rail?: boolean;
  stackData?: boolean;
  /** Merged onto the outer container (e.g. the reader's --article-accent). */
  style?: CSSProperties;
  /** Defaults to the plate's canonical title. */
  title?: string;
  titleAccent?: ReactNode;
  /** Semantic content width; ignored when `rail` is set. */
  width: "read" | "index" | "wide";
}

/**
 * The single page shell every public blog route renders through. It owns the
 * content width (one of three semantic stops), the responsive page gutter, the
 * page-enter animation, and — unless `header="none"` — the shared
 * `DiscPageHeader`, numbered from the plate taxonomy.
 */
export function PlatePage({
  width,
  plate,
  domain,
  header = "full",
  title,
  titleAccent,
  accent,
  headerData,
  headerChildren,
  eyebrowEnd,
  stackData,
  rail = false,
  bleed = false,
  style,
  children,
}: PlatePageProps) {
  const meta = PLATE_META[plate];
  const widthClass = rail ? "max-w-read rail:max-w-index" : WIDTH_CLASS[width];

  let headerNode: ReactNode = null;
  if (header !== "none") {
    const eyebrowStart =
      header === "compact" && domain ? (
        <>
          {meta.label}
          <span aria-hidden="true" className="mx-1.5">
            ·
          </span>
          <DomainLabel domain={domain} />
        </>
      ) : (
        VOLUME
      );
    headerNode = (
      <DiscPageHeader
        accent={accent}
        data={headerData}
        eyebrowEnd={eyebrowEnd ?? `${meta.label} · No. ${meta.number}`}
        eyebrowStart={eyebrowStart}
        stackData={stackData}
        title={title ?? meta.title}
        titleAccent={titleAccent}
        variant={header}
      >
        {headerChildren}
      </DiscPageHeader>
    );
  }

  if (bleed) {
    return (
      <div className={cn("hw-page-enter mx-auto", widthClass)} style={style}>
        {headerNode && <div className="px-gutter">{headerNode}</div>}
        {children}
      </div>
    );
  }

  return (
    <div
      className={cn("hw-page-enter mx-auto px-gutter pb-20", widthClass)}
      style={style}
    >
      {headerNode}
      {children}
    </div>
  );
}
