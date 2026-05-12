import { Ph } from "./Ph";

interface PhotoCardProps {
  aspect?: string;
  caption?: string;
  className?: string;
  label: string;
  src?: string;
  tape?: boolean;
  tone?: number;
}

export function PhotoCard({
  label,
  aspect = "4/3",
  tape,
  caption,
  tone = 0,
  className,
}: PhotoCardProps) {
  return (
    <figure
      className={`hw-photo-card${className ? ` ${className}` : ""}`}
      style={{ margin: 0 }}
    >
      {tape && <div aria-hidden="true" className="hw-tape" />}
      <Ph aspect={aspect} label={label} tone={tone} />
      {caption && (
        <figcaption
          className="hw-mono"
          style={{
            padding: "8px 10px",
            fontSize: 10.5,
            color: "var(--hw-ink-3)",
            textAlign: "center",
            letterSpacing: "0.1em",
          }}
        >
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
