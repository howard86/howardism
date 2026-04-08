import { Button } from "@howardism/ui/components/button";
import Link from "next/link";
import type { ReactNode } from "react";
import type { SVGProps } from "react-html-props";

import { Container } from "@/app/(common)/Container";
import { formatDate } from "@/utils/time";

import type { ArticleMeta } from "../service";

function ArrowLeftIcon(props: SVGProps) {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 16 16" {...props}>
      <path
        d="M7.25 11.25 3.75 8m0 0 3.5-3.25M3.75 8h8.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

interface ArticleLayoutProps {
  children?: ReactNode;
  meta: ArticleMeta;
  nextSlug?: string;
  previousSlug?: string;
}

export function ArticleLayout({
  children,
  meta,
  previousSlug,
  nextSlug,
}: ArticleLayoutProps) {
  return (
    <Container className="mt-16 lg:mt-32">
      <div className="xl:relative">
        <div className="mx-auto max-w-2xl">
          <nav className="mb-8 flex items-center lg:absolute lg:-inset-x-5 lg:mt-2 lg:mb-0 xl:-top-1.5 xl:left-0 xl:mt-0">
            {previousSlug && (
              <Button asChild size="icon-sm" variant="ghost">
                <Link
                  aria-label="Visit previous article"
                  href={`/articles/${previousSlug}`}
                >
                  <ArrowLeftIcon className="w-4 stroke-current" />
                </Link>
              </Button>
            )}
            <span aria-hidden="true" className="flex-1" />
            {nextSlug && (
              <Button asChild size="icon-sm" variant="ghost">
                <Link
                  aria-label="Visit next article"
                  href={`/articles/${nextSlug}`}
                >
                  <ArrowLeftIcon className="w-4 rotate-180 stroke-current" />
                </Link>
              </Button>
            )}
          </nav>
          <article>
            <header className="flex flex-col">
              <h1 className="mt-6 font-bold text-4xl text-neutral tracking-tight sm:text-5xl">
                {meta.title}
              </h1>
              <time
                className="order-first flex items-center text-base text-muted-foreground/70"
                dateTime={meta.date}
              >
                <span className="h-4 w-0.5 rounded-full bg-muted-foreground/30" />
                <span className="ml-3">{formatDate(meta.date)}</span>
              </time>
            </header>
            <div className="prose mt-8">{children}</div>
          </article>
        </div>
      </div>
    </Container>
  );
}
