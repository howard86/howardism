import { cn } from "@howardism/ui/lib/utils";

interface TagChipProps {
  className?: string;
  tag: string;
}

export function TagChip({ tag, className }: TagChipProps) {
  return (
    <span
      className={cn(
        "font-medium font-mono text-[0.625rem] text-brand uppercase tracking-[0.16em]",
        className
      )}
    >
      {tag}
    </span>
  );
}
