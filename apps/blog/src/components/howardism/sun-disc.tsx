interface SunDiscProps {
  accent?: string;
  className?: string;
  number?: string;
  plate?: string;
  size?: number;
}

const GRAIN_SVG =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.7' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.22 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")";

const LABEL_CLASS =
  "font-mono text-[10px] text-foreground-subtle uppercase tracking-[0.18em]";

export function SunDisc({
  size = 420,
  plate = "Plate I · Surface",
  number = "01",
  accent,
  className,
}: SunDiscProps) {
  const bgAccent = accent ?? "var(--brand)";
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
        className="absolute inset-0 rounded-full"
        style={{
          background: `radial-gradient(circle at 35% 30%, oklch(from ${bgAccent} 0.82 0.09 h) 0%, oklch(from ${bgAccent} 0.56 0.15 h) 55%, oklch(from ${bgAccent} 0.38 0.1 h) 100%)`,
          boxShadow: `0 40px 80px -30px oklch(from ${bgAccent} 0.4 0.14 h / 0.45), inset 0 -20px 60px oklch(from ${bgAccent} 0.3 0.1 h / 0.35)`,
        }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 rounded-full opacity-60 mix-blend-overlay"
        style={{ backgroundImage: GRAIN_SVG }}
      />
      {number && (
        <div className="absolute -top-3 -left-3">
          <span className={LABEL_CLASS}>{number}</span>
        </div>
      )}
      {plate && (
        <div className="absolute right-1.5 -bottom-2">
          <span className={LABEL_CLASS}>{plate}</span>
        </div>
      )}
    </div>
  );
}
