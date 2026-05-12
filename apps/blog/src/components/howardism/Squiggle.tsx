interface SquiggleProps {
  className?: string;
}

export function Squiggle({ className }: SquiggleProps) {
  return (
    <svg
      aria-hidden="true"
      className={`hw-fade-mask-r${className ? ` ${className}` : ""}`}
      preserveAspectRatio="none"
      style={{
        display: "block",
        width: "100%",
        height: 8,
        color: "var(--hw-rule-2)",
      }}
      viewBox="0 0 200 8"
    >
      <path
        d="M0 4 Q 10 0, 20 4 T 40 4 T 60 4 T 80 4 T 100 4 T 120 4 T 140 4 T 160 4 T 180 4 T 200 4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
      />
    </svg>
  );
}
