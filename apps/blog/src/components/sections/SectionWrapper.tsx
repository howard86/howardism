import { ReactNode } from "react";
import { DivProps } from "react-html-props";
import clsx from "clsx";

import { Container } from "../layout/Container";

interface SectionWrapperProps extends DivProps {
  tag: string;
  title: string;
  description: string;
  children: ReactNode;
}

export default function SectionWrapper({
  tag,
  title,
  description,
  children,
  className,
  ...props
}: Partial<SectionWrapperProps>) {
  return (
    <Container>
      <section className={clsx("min-h-screen pt-24", className)} {...props}>
        <span className="relative mb-3 capitalize text-teal-600 before:absolute before:top-1/2 before:left-full before:mx-2.5 before:h-px before:w-10 before:-translate-y-1/2 before:bg-teal-600">
          {tag}
        </span>
        <h2 className="mt-1 mb-4 text-4xl font-bold dark:text-white/90">{title}</h2>
        <p className="mb-6 dark:text-white/90">{description}</p>
        {children}
      </section>
    </Container>
  );
}
