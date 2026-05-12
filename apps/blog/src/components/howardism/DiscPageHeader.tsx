import type { ReactNode } from "react";

import { DataGrid } from "./DataGrid";
import { SunDisc } from "./SunDisc";

interface DiscPageHeaderProps {
  children?: ReactNode;
  className?: string;
  data?: [string, string][];
  discSize?: number;
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
  discSize = 420,
  className,
  children,
}: DiscPageHeaderProps) {
  return (
    <section
      className={`hw-grain${className ? ` ${className}` : ""}`}
      data-testid="disc-page-header"
      style={{ paddingTop: 32, paddingBottom: 32, position: "relative" }}
    >
      <div style={{ maxWidth: 1120, margin: "0 auto", padding: "0 32px" }}>
        {/* Double-rule masthead */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            borderBottom: "3px double var(--hw-ink)",
            paddingBottom: 12,
          }}
        >
          <div
            className="hw-mono"
            style={{
              fontSize: 11,
              color: "var(--hw-ink-2)",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
            }}
          >
            {volume}
          </div>
          <div
            className="hw-mono"
            style={{
              fontSize: 11,
              color: "var(--hw-ink-3)",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
            }}
          >
            {plate} · No. {number}
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1.3fr) minmax(0, 1fr)",
            gap: 48,
            alignItems: "center",
            minHeight: 360,
            paddingTop: 32,
            paddingBottom: 32,
          }}
        >
          <div>
            <h1
              className="hw-display"
              style={{
                fontSize: "clamp(44px, 6vw, 80px)",
                lineHeight: 1.02,
                letterSpacing: "-0.03em",
                margin: 0,
                fontWeight: 400,
              }}
            >
              {title}{" "}
              {titleAccent && (
                <em style={{ fontStyle: "italic", color: "var(--hw-accent)" }}>
                  {titleAccent}
                </em>
              )}
            </h1>
            {data && (
              <div style={{ marginTop: 32 }}>
                <DataGrid rows={data} />
              </div>
            )}
            {children}
          </div>
          <div
            style={{
              justifySelf: "end",
              width: "100%",
              display: "flex",
              justifyContent: "flex-end",
            }}
          >
            <SunDisc
              number={number}
              plate={`${plate} · ${title}`}
              size={discSize}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
