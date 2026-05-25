import type { Metadata } from "next";
import Link from "next/link";

import { env } from "@/config/env";
import { formatDate } from "@/utils/time";

import { getTranslatedArticleLinks } from "../../articles/render-article";

const ZH_ARTICLES_URL = `${env.NEXT_PUBLIC_DOMAIN_NAME}/zh-TW/articles`;

// On-demand (the [locale] parent is dynamic); cache until redeploy.
export const revalidate = false;

export const metadata: Metadata = {
  title: "文章（繁體中文）",
  description: "由 AI 從英文原文翻譯的文章。",
  alternates: { canonical: ZH_ARTICLES_URL },
  openGraph: { url: ZH_ARTICLES_URL, locale: "zh_TW" },
};

export default async function ZhArticlesIndex() {
  const links = await getTranslatedArticleLinks();
  return (
    <div className="hw-page-enter mx-auto max-w-[720px] px-4 py-16">
      <header className="mb-10 border-border border-b pb-6">
        <p className="font-mono text-[10.5px] text-foreground-subtle uppercase tracking-[0.22em]">
          機器翻譯 · machine-translated
        </p>
        <h1 className="mt-3 font-display font-normal text-[27px] text-foreground leading-[1.25]">
          文章（繁體中文）
        </h1>
        <p className="mt-2 font-body text-muted-foreground text-sm">
          以下文章由 AI 從英文原文翻譯，內容會隨原文更新而重新翻譯。
          <Link
            className="ml-1 underline hover:text-[var(--brand)]"
            href="/articles"
          >
            查看英文版 →
          </Link>
        </p>
      </header>

      <ul className="flex flex-col divide-y divide-border">
        {links.map((article) => (
          <li className="py-5" key={article.slug}>
            <Link
              className="group block no-underline"
              href={`/zh-TW/articles/${article.slug}`}
            >
              <span className="font-mono text-[10.5px] text-foreground-subtle uppercase tracking-[0.18em]">
                {formatDate(article.date)}
              </span>
              <h2 className="mt-1 font-display text-[18px] text-foreground leading-[1.3] transition-colors group-hover:text-[var(--brand)]">
                {article.title}
              </h2>
              <p className="mt-1 font-body text-muted-foreground text-sm leading-[1.6]">
                {article.description}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
