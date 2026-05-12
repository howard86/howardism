import { cn } from "@howardism/ui/lib/utils";
import type { DivProps } from "react-html-props";

export const OuterContainer = ({
  className,
  children,
  ref,
  ...props
}: DivProps) => (
  <div className={cn("sm:px-8", className)} ref={ref} {...props}>
    <div className="mx-auto max-w-7xl lg:px-8">{children}</div>
  </div>
);

export const InnerContainer = ({
  className,
  children,
  ref,
  ...props
}: DivProps) => (
  <div
    className={cn("relative px-4 sm:px-8 lg:px-12", className)}
    ref={ref}
    {...props}
  >
    <div className="mx-auto max-w-2xl lg:max-w-5xl">{children}</div>
  </div>
);

export const Container = ({ children, ref, ...props }: DivProps) => (
  <OuterContainer ref={ref} {...props}>
    <InnerContainer>{children}</InnerContainer>
  </OuterContainer>
);
