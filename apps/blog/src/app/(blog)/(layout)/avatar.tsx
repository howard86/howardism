import { cn } from "@howardism/ui/lib/utils";

import { InternalLink } from "@/components/internal-link";

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
    <InternalLink
      aria-label={label}
      className={cn(
        "inline-flex flex-shrink-0 select-none items-center justify-center rounded-full bg-brand font-display font-medium text-card",
        className
      )}
      href={href}
      style={{ width: size, height: size, fontSize: size * 0.45 }}
    >
      H
    </InternalLink>
  );
}
