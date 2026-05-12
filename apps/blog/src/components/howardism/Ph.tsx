interface PhProps {
  aspect?: string;
  className?: string;
  label: string;
  meta?: string;
  tone?: number;
}

const PALETTES = [
  "oklch(from var(--hw-accent) l c h / 0.12)",
  "oklch(from var(--hw-accent-2) l c h / 0.12)",
  "oklch(0.7 0.04 220 / 0.14)",
  "oklch(0.7 0.06 120 / 0.14)",
  "oklch(0.7 0.07 40 / 0.14)",
] as const;

export function Ph({
  label,
  aspect = "4/3",
  tone = 0,
  meta,
  className,
}: PhProps) {
  const stripe = PALETTES[tone % PALETTES.length];
  return (
    <div
      className={`hw-ph${className ? ` ${className}` : ""}`}
      data-aspect={aspect}
      data-testid="ph"
      data-tone={tone}
      style={{
        aspectRatio: aspect,
        background: `repeating-linear-gradient(135deg, ${stripe} 0 10px, transparent 10px 20px), var(--hw-bg-2)`,
        width: "100%",
        flexDirection: "column",
        gap: 4,
      }}
    >
      <span>{label}</span>
      {meta && (
        <span
          style={{
            fontSize: 10,
            opacity: 0.7,
            letterSpacing: "0.06em",
          }}
        >
          {meta}
        </span>
      )}
    </div>
  );
}
