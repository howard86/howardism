import { cn } from "@howardism/ui/lib/utils";

import { GRAIN_SVG } from "./grain";

interface HalfDiscProps {
  accent?: string;
  align?: "right" | "left";
  className?: string;
  size?: number;
}

export function HalfDisc({
  size = 380,
  align = "right",
  accent,
  className,
}: HalfDiscProps) {
  const bgAccent = accent ?? "var(--brand)";
  const gradientAnchor = align === "right" ? "100%" : "0%";
  const radiusClass =
    align === "right"
      ? "rounded-t-[999px] rounded-b-none"
      : "rounded-b-[999px] rounded-t-none";
  return (
    <div
      className={cn("relative w-full overflow-hidden", radiusClass, className)}
      data-align={align}
      data-testid="half-disc"
      style={{ maxWidth: size, aspectRatio: "2/1" }}
    >
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(circle at 50% ${gradientAnchor}, oklch(from ${bgAccent} 0.82 0.09 h) 0%, oklch(from ${bgAccent} 0.56 0.15 h) 55%, oklch(from ${bgAccent} 0.38 0.1 h) 100%)`,
        }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-60 mix-blend-overlay"
        style={{ backgroundImage: GRAIN_SVG }}
      />
    </div>
  );
}
