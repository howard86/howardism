import { DOMAIN_ORDER } from "./domain-meta";
import type { ArticleDomain, ArticleEntity } from "./service";

export interface DomainGroup {
  articles: ArticleEntity[];
  domain: ArticleDomain;
}

/**
 * Group articles by their vault-sourced `domain`, ordered by member count
 * descending so new/small domains fall last automatically as the vault
 * grows, tie-broken by `DOMAIN_ORDER`. Articles with no `domain` (the field
 * is optional in the contract) are dropped. Preserves the incoming article
 * order within each group.
 */
export function groupArticlesByDomain(
  articles: readonly ArticleEntity[]
): DomainGroup[] {
  const byDomain = new Map<ArticleDomain, ArticleEntity[]>();

  for (const article of articles) {
    const { domain } = article.meta;
    if (!domain) {
      continue;
    }
    const bucket = byDomain.get(domain);
    if (bucket) {
      bucket.push(article);
    } else {
      byDomain.set(domain, [article]);
    }
  }

  return [...byDomain.entries()]
    .map(([domain, members]) => ({ domain, articles: members }))
    .sort((a, b) => {
      const byCount = b.articles.length - a.articles.length;
      return byCount === 0
        ? DOMAIN_ORDER.indexOf(a.domain) - DOMAIN_ORDER.indexOf(b.domain)
        : byCount;
    });
}
