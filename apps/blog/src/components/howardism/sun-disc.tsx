interface SunDiscProps {
  accent?: string;
  className?: string;
  number?: string;
  plate?: string;
  size?: number;
}

const LABEL_CLASS =
  "whitespace-nowrap font-mono text-[10px] text-foreground-subtle uppercase tracking-[0.18em]";

const SPHERE_RADIUS = 99.2;
const PARALLEL_OFFSET = 40;
const PARALLEL_RADIUS = 91;
const PARALLEL_DEPTH = 11;
const EQUATOR_DEPTH = 12;
const MERIDIAN_COUNT = 6;
const ROTATION_DURATION_S = 30;
const AXIAL_TILT_DEG = 23.5;

export function SunDisc({
  size = 420,
  plate = "Plate I · Surface",
  number = "01",
  accent,
  className,
}: SunDiscProps) {
  const stroke = accent ?? "var(--brand)";
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
      <svg
        aria-hidden="true"
        className="absolute inset-0 h-full w-full"
        style={{
          transform: `rotate(-${AXIAL_TILT_DEG}deg)`,
          transformOrigin: "center",
        }}
        viewBox="-100 -100 200 200"
      >
        <title>Wireframe globe</title>
        <g fill="none" stroke={stroke} strokeLinecap="round">
          <circle
            cx={0}
            cy={0}
            opacity={0.7}
            r={SPHERE_RADIUS}
            strokeWidth={1}
          />
          <g opacity={0.5} strokeWidth={0.8}>
            <ellipse cx={0} cy={0} rx={SPHERE_RADIUS} ry={EQUATOR_DEPTH} />
            <ellipse
              cx={0}
              cy={-PARALLEL_OFFSET}
              rx={PARALLEL_RADIUS}
              ry={PARALLEL_DEPTH}
            />
            <ellipse
              cx={0}
              cy={PARALLEL_OFFSET}
              rx={PARALLEL_RADIUS}
              ry={PARALLEL_DEPTH}
            />
            {Array.from({ length: MERIDIAN_COUNT }).map((_, i) => (
              <ellipse
                className="hw-disc-meridian"
                cx={0}
                cy={0}
                // biome-ignore lint/suspicious/noArrayIndexKey: stable static count
                key={i}
                rx={SPHERE_RADIUS}
                ry={SPHERE_RADIUS}
                style={{
                  animationDelay: `-${(i * ROTATION_DURATION_S) / MERIDIAN_COUNT}s`,
                }}
              />
            ))}
          </g>
        </g>
      </svg>
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
