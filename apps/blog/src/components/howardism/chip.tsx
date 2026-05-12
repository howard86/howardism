import type { ReactNode } from "react";

interface ChipProps {
  children: ReactNode;
  className?: string;
  dot?: boolean;
}

export function Chip({ children, dot, className }: ChipProps) {
  return (
    <span className={`hw-chip${className ? ` ${className}` : ""}`}>
      {dot && <span aria-hidden="true" className="hw-dot" />}
      {children}
    </span>
  );
}
