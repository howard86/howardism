import { cn } from "@howardism/ui/lib/utils";

interface PhProps {
  aspect?: string;
  className?: string;
  label: string;
  meta?: string;
  tone?: number;
}

const PALETTES = [
  "oklch(from var(--brand) l c h / 0.12)",
  "oklch(from var(--brand-2) l c h / 0.12)",
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
      className={cn(
        "flex w-full flex-col items-center justify-center gap-1 rounded-lg border border-border font-mono text-[11px] text-foreground-subtle uppercase tracking-[0.12em]",
        className
      )}
      data-aspect={aspect}
      data-testid="ph"
      data-tone={tone}
      style={{
        aspectRatio: aspect,
        background: `repeating-linear-gradient(135deg, ${stripe} 0 10px, transparent 10px 20px), var(--background-2)`,
      }}
    >
      <span>{label}</span>
      {meta && (
        <span className="text-[10px] tracking-[0.06em] opacity-70">{meta}</span>
      )}
    </div>
  );
}
