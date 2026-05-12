import type { ReactNode } from "react";

interface EyebrowProps {
  children: ReactNode;
  className?: string;
}

export function Eyebrow({ children, className }: EyebrowProps) {
  return (
    <div className={`hw-eyebrow${className ? ` ${className}` : ""}`}>
      {children}
    </div>
  );
}
