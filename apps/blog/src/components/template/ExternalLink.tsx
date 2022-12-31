import { ChildrenProps } from "react";
import { AProps } from "react-html-props";

export default function ExternalLink({ children, ...props }: AProps & ChildrenProps) {
  return (
    <a target="_blank" rel="noreferrer" {...props}>
      {children}
    </a>
  );
}
