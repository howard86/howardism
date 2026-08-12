import type { MDXComponents } from "mdx/types";
import Link from "next/link";
import type { AnchorHTMLAttributes, ReactNode } from "react";

import { getArticles } from "@/app/(blog)/articles/service";
import {
  ARTICLES_PREFIX,
  type ArticlePreviewMeta,
  extractArticleSlug,
  InternalLink,
} from "@/components/internal-link";

interface MdxLinkLikeProps
  extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> {
  children?: ReactNode;
  href?: string;
}

const EXTERNAL_HREF_RE = /^https?:\/\//i;

async function ArticleLinkResolver({
  href,
  children,
  ...rest
}: MdxLinkLikeProps) {
  if (typeof href !== "string" || href.length === 0) {
    return <>{children}</>;
  }

  if (EXTERNAL_HREF_RE.test(href)) {
    return (
      <a href={href} rel="noopener noreferrer" target="_blank" {...rest}>
        {children}
      </a>
    );
  }

  if (!href.startsWith(ARTICLES_PREFIX)) {
    return (
      <Link href={href} {...rest}>
        {children}
      </Link>
    );
  }

  const slug = extractArticleSlug(href);
  const previewMeta = slug ? await resolveArticlePreviewMeta(slug) : undefined;

  return (
    <InternalLink href={href} previewMeta={previewMeta} {...rest}>
      {children}
    </InternalLink>
  );
}

async function resolveArticlePreviewMeta(
  slug: string
): Promise<ArticlePreviewMeta | undefined> {
  const articles = await getArticles();
  const meta = articles.entities[slug]?.meta;
  if (!meta) {
    return;
  }
  return {
    description: meta.description,
    tag: meta.tag,
    title: meta.title,
  };
}

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    ...components,
    a: ArticleLinkResolver,
  };
}
