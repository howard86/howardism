"use client";

import type { ReactNode } from "react";
import { Suspense } from "react";

import { useReaderSpike } from "@/hooks/use-reader-spike";

interface LedeContractWrapperProps {
  children: ReactNode;
  description: string;
  metaCard: ReactNode;
  title: string;
}

function LedeContractContent({
  children,
  metaCard,
  title,
  description,
}: LedeContractWrapperProps) {
  const isSpike = useReaderSpike();

  if (!isSpike) {
    return (
      <>
        {children}
        {metaCard}
      </>
    );
  }

  return (
    <>
      <div className="mb-10">
        <h1 className="mb-4 font-display font-semibold text-3xl text-foreground leading-tight tracking-tight sm:text-4xl">
          {title}
        </h1>
        <p className="border-[var(--article-accent)] border-l-2 pl-4 font-body text-base text-muted-foreground italic leading-[1.65]">
          {description}
        </p>
      </div>

      <details className="mb-8">
        <summary className="cursor-pointer rounded-md border border-border bg-card px-4 py-3 font-mono text-[11px] text-foreground-subtle uppercase tracking-[0.1em] transition-colors hover:bg-accent">
          Article Metadata
        </summary>
        <div className="mt-4">{metaCard}</div>
      </details>

      {children}
    </>
  );
}

export function LedeContractWrapper(props: LedeContractWrapperProps) {
  return (
    <Suspense
      fallback={
        <>
          {props.children}
          {props.metaCard}
        </>
      }
    >
      <LedeContractContent {...props} />
    </Suspense>
  );
}
