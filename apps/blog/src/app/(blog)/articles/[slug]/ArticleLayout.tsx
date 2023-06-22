import Link from "next/link"
import type { ReactNode } from "react"
import type { SVGProps } from "react-html-props"

import { Container } from "@/components/template/Container"
import { formatDate } from "@/utils/time"

import type { ArticleMeta } from "../service"

function ArrowLeftIcon(props: SVGProps) {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" {...props}>
      <path
        d="M7.25 11.25 3.75 8m0 0 3.5-3.25M3.75 8h8.5"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

interface ArticleLayoutProps {
  meta: ArticleMeta
  children?: ReactNode
  previousSlug?: string
  nextSlug?: string
}

export function ArticleLayout({ children, meta, previousSlug, nextSlug }: ArticleLayoutProps) {
  return (
    <Container className="mt-16 lg:mt-32">
      <div className="xl:relative">
        <div className="mx-auto max-w-2xl">
          <nav className="mb-8 flex items-center lg:absolute lg:-inset-x-5 lg:mb-0 lg:mt-2 xl:-top-1.5 xl:left-0 xl:mt-0">
            {previousSlug && (
              <Link
                className="btn-brand btn-sm btn-circle btn"
                aria-label="Visit previous article"
                href={`/articles/${previousSlug}`}
              >
                <ArrowLeftIcon className="w-4 stroke-current" />
              </Link>
            )}
            <span aria-hidden="true" className="flex-1" />
            {nextSlug && (
              <Link
                className="btn-brand btn-sm btn-circle btn"
                aria-label="Visit next article"
                href={`/articles/${nextSlug}`}
              >
                <ArrowLeftIcon className="w-4 rotate-180 stroke-current" />
              </Link>
            )}
          </nav>
          <article>
            <header className="flex flex-col">
              <h1 className="mt-6 text-4xl font-bold tracking-tight text-neutral sm:text-5xl">
                {meta.title}
              </h1>
              <time
                dateTime={meta.date}
                className="order-first flex items-center text-base text-base-content/40"
              >
                <span className="h-4 w-0.5 rounded-full bg-base-content/20" />
                <span className="ml-3">{formatDate(meta.date)}</span>
              </time>
            </header>
            <div className="prose mt-8">{children}</div>
          </article>
        </div>
      </div>
    </Container>
  )
}
