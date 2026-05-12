interface HalfDiscProps {
  accent?: string;
  align?: "right" | "left";
  className?: string;
  size?: number;
}

const GRAIN_SVG =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.7' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.22 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")";

export function HalfDisc({
  size = 380,
  align = "right",
  accent,
  className,
}: HalfDiscProps) {
  const bgAccent = accent ?? "var(--hw-accent)";
  const gradientAnchor = align === "right" ? "100%" : "0%";
  const borderRadius =
    align === "right" ? "999px 999px 0 0" : "0 0 999px 999px";
  return (
    <div
      className={className}
      data-align={align}
      data-testid="half-disc"
      style={{
        position: "relative",
        width: "100%",
        maxWidth: size,
        aspectRatio: "2/1",
        overflow: "hidden",
        borderRadius,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(circle at 50% ${gradientAnchor}, oklch(from ${bgAccent} 0.82 0.09 h) 0%, oklch(from ${bgAccent} 0.56 0.15 h) 55%, oklch(from ${bgAccent} 0.38 0.1 h) 100%)`,
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: GRAIN_SVG,
          mixBlendMode: "overlay",
          opacity: 0.6,
        }}
      />
    </div>
  );
}
