import type { ChildrenProps } from "react";
import type { AProps } from "react-html-props";

export default function ExternalLink({
  children,
  ...props
}: AProps & ChildrenProps) {
  return (
    <a rel="noreferrer" target="_blank" {...props}>
      {children}
    </a>
  );
}
