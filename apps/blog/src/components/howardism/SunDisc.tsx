interface SunDiscProps {
  accent?: string;
  className?: string;
  number?: string;
  plate?: string;
  size?: number;
}

const GRAIN_SVG =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.7' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.22 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")";

export function SunDisc({
  size = 420,
  plate = "Plate I · Surface",
  number = "01",
  accent,
  className,
}: SunDiscProps) {
  const bgAccent = accent ?? "var(--hw-accent)";
  return (
    <div
      className={className}
      data-testid="sun-disc"
      style={{
        position: "relative",
        width: "100%",
        maxWidth: size,
        aspectRatio: "1/1",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          background: `radial-gradient(circle at 35% 30%, oklch(from ${bgAccent} 0.82 0.09 h) 0%, oklch(from ${bgAccent} 0.56 0.15 h) 55%, oklch(from ${bgAccent} 0.38 0.1 h) 100%)`,
          boxShadow: `0 40px 80px -30px oklch(from ${bgAccent} 0.4 0.14 h / 0.45), inset 0 -20px 60px oklch(from ${bgAccent} 0.3 0.1 h / 0.35)`,
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          backgroundImage: GRAIN_SVG,
          mixBlendMode: "overlay",
          opacity: 0.6,
        }}
      />
      {number && (
        <div
          className="hw-mono"
          style={{ position: "absolute", top: "-12px", left: "-12px" }}
        >
          <span
            style={{
              fontSize: 10,
              color: "var(--hw-ink-3)",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
            }}
          >
            {number}
          </span>
        </div>
      )}
      {plate && (
        <div
          className="hw-mono"
          style={{ position: "absolute", bottom: "-8px", right: "6px" }}
        >
          <span
            style={{
              fontSize: 10,
              color: "var(--hw-ink-3)",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
            }}
          >
            {plate}
          </span>
        </div>
      )}
    </div>
  );
}
