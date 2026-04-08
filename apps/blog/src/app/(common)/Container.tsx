import { cn } from "@howardism/ui/lib/utils";
import { forwardRef } from "react";
import type { DivPropsWithoutRef } from "react-html-props";

export const OuterContainer = forwardRef<HTMLDivElement, DivPropsWithoutRef>(
  ({ className, children, ...props }, ref) => (
    <div className={cn("sm:px-8", className)} ref={ref} {...props}>
      <div className="mx-auto max-w-7xl lg:px-8">{children}</div>
    </div>
  )
);

export const InnerContainer = forwardRef<HTMLDivElement, DivPropsWithoutRef>(
  ({ className, children, ...props }, ref) => (
    <div
      className={cn("relative px-4 sm:px-8 lg:px-12", className)}
      ref={ref}
      {...props}
    >
      <div className="mx-auto max-w-2xl lg:max-w-5xl">{children}</div>
    </div>
  )
);

export const Container = forwardRef<HTMLDivElement, DivPropsWithoutRef>(
  ({ children, ...props }, ref) => (
    <OuterContainer ref={ref} {...props}>
      <InnerContainer>{children}</InnerContainer>
    </OuterContainer>
  )
);
