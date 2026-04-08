import { Card as ShadcnCard } from "@howardism/ui/components/card";
import { cn } from "@howardism/ui/lib/utils";
import type { ComponentProps } from "react";

export default function Card({
  className,
  ...props
}: ComponentProps<typeof ShadcnCard>): JSX.Element {
  return (
    <ShadcnCard className={cn("px-4 py-8 md:px-10", className)} {...props} />
  );
}
