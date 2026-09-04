"use client";

import type { ReactNode } from "react";
import { Suspense } from "react";

import { useReaderSpike } from "@/hooks/use-reader-spike";

interface LedeContractWrapperProps {
  children: ReactNode;
  headerSection: ReactNode;
  ledeText: string;
  metaCard: ReactNode;
  metaGrid: ReactNode;
}

function LedeContractContent({
  children,
  headerSection,
  ledeText,
  metaCard,
  metaGrid,
}: LedeContractWrapperProps) {
  const isSpike = useReaderSpike();

  if (!isSpike) {
    return (
      <>
        {headerSection}
        <p className="mt-10 mb-8 border-[var(--article-accent)] border-l-2 pl-4 font-body text-base text-muted-foreground italic leading-[1.65]">
          {ledeText}
        </p>
        {children}
        <div className="space-y-4">
          {metaGrid}
          {metaCard}
        </div>
      </>
    );
  }

  return (
    <>
      {headerSection}
      <p className="mt-10 mb-8 border-[var(--article-accent)] border-l-2 pl-4 font-body text-base text-muted-foreground italic leading-[1.65]">
        {ledeText}
      </p>

      <details className="mb-8">
        <summary className="cursor-pointer rounded-md border border-border bg-card px-4 py-3 font-mono text-[11px] text-foreground-subtle uppercase tracking-[0.1em] transition-colors hover:bg-accent">
          Article Metadata
        </summary>
        <div className="mt-4 space-y-4">
          {metaGrid}
          {metaCard}
        </div>
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
          {props.headerSection}
          <p className="mt-10 mb-8 border-[var(--article-accent)] border-l-2 pl-4 font-body text-base text-muted-foreground italic leading-[1.65]">
            {props.ledeText}
          </p>
          {props.children}
          <div className="space-y-4">
            {props.metaGrid}
            {props.metaCard}
          </div>
        </>
      }
    >
      <LedeContractContent {...props} />
    </Suspense>
  );
}
