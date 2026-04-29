import Link from "next/link";

interface AvatarProps {
  className?: string;
  href?: string;
  label?: string;
  size?: number;
}

export function Avatar({
  size = 36,
  href = "/",
  className,
  label = "Home",
}: AvatarProps) {
  return (
    <Link
      aria-label={label}
      className={className}
      href={href}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: size,
        height: size,
        borderRadius: "50%",
        background: "var(--hw-accent)",
        color: "var(--hw-paper)",
        fontFamily: "var(--hw-font-display)",
        fontSize: size * 0.45,
        fontWeight: 500,
        flexShrink: 0,
        textDecoration: "none",
        userSelect: "none",
      }}
    >
      H
    </Link>
  );
}
