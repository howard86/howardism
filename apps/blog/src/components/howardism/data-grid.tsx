import { cn } from "@howardism/ui/lib/utils";
import { Fragment, type ReactNode } from "react";

interface DataGridProps {
  className?: string;
  maxWidth?: number;
  rows: [string, ReactNode][];
  /** Stack label over value below 480px — for the narrow article column. */
  stack?: boolean;
}

export function DataGrid({
  rows,
  maxWidth = 360,
  className,
  stack = false,
}: DataGridProps) {
  return (
    <div
      className={cn(
        "grid gap-x-4 gap-y-1.5 font-mono text-[11px] text-foreground-subtle uppercase tracking-[0.18em]",
        stack
          ? "grid-cols-1 min-[480px]:grid-cols-[auto_1fr]"
          : "grid-cols-[auto_1fr]",
        className
      )}
      data-testid="data-grid"
      style={{ maxWidth }}
    >
      {rows.map(([label, value]) => (
        <Fragment key={label}>
          <span>{label}</span>
          <span className="font-body text-muted-foreground normal-case tracking-[0.02em]">
            {value}
          </span>
        </Fragment>
      ))}
    </div>
  );
}
