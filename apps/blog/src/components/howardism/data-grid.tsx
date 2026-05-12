import { Fragment } from "react";

interface DataGridProps {
  className?: string;
  maxWidth?: number;
  rows: [string, string][];
}

export function DataGrid({ rows, maxWidth = 360, className }: DataGridProps) {
  return (
    <div
      className={`hw-mono${className ? ` ${className}` : ""}`}
      data-testid="data-grid"
      style={{
        fontSize: 11,
        color: "var(--hw-ink-3)",
        letterSpacing: "0.18em",
        textTransform: "uppercase",
        display: "grid",
        gridTemplateColumns: "auto 1fr",
        gap: "6px 16px",
        maxWidth,
      }}
    >
      {rows.map(([label, value]) => (
        <Fragment key={label}>
          <span>{label}</span>
          <span
            style={{
              fontFamily: "var(--hw-font-body)",
              color: "var(--hw-ink-2)",
              textTransform: "none",
              letterSpacing: "0.02em",
            }}
          >
            {value}
          </span>
        </Fragment>
      ))}
    </div>
  );
}
