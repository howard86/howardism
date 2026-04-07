import type { CSSProperties } from "react";

interface TriangleProps {
  className?: string;
  style?: CSSProperties;
  zIndex?: string | number;
}

export default function Triangle({ className, style, zIndex }: TriangleProps) {
  return (
    <div
      className={className}
      style={{
        position: "absolute",
        width: 0,
        height: 0,
        borderStyle: "solid",
        borderLeftWidth: "50vw",
        borderLeftColor: "hsl(var(--border))",
        borderBottomWidth: "10vh",
        borderBottomColor: "transparent",
        borderTop: "none",
        borderRight: "none",
        zIndex: zIndex ?? undefined,
        ...style,
      }}
    />
  );
}
