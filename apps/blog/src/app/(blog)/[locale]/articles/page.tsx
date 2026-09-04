import type { Metadata } from "next";
import Link from "next/link";

import { env } from "@/config/env";
import { formatDateShort } from "@/utils/time";

import { PlatePage } from "../../_shell/plate-page";
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
    <PlatePage
      headerChildren={
        <p className="mt-6 max-w-[680px] font-body text-[clamp(16px,2.2vw,18px)] text-muted-foreground leading-[1.55]">
          以下文章由 AI 從英文原文翻譯，內容會隨原文更新而重新翻譯。
          <Link
            className="ml-1.5 text-foreground underline underline-offset-4 transition-colors hover:text-brand"
            href="/articles"
          >
            查看英文版 →
          </Link>
        </p>
      }
      headerData={[
        ["Pieces", String(links.length)],
        ["Locale", "zh-TW"],
        ["Format", "Machine-translated"],
      ]}
      plate="articles"
      title="文章，"
      titleAccent="繁體中文。"
      width="read"
    >
      <ol className="m-0 mt-8 list-none p-0">
        {links.map((article, i) => (
          <li
            className="grid grid-cols-[auto_1fr] items-baseline gap-x-4 py-4"
            key={article.slug}
            style={{
              borderTop:
                i === 0 ? "2px solid var(--brand)" : "1px solid var(--border)",
            }}
          >
            <span
              className="font-display font-light text-[24px] leading-[0.9] tracking-[-0.03em] sm:text-[28px]"
              style={{ color: "var(--brand)" }}
            >
              {String(i + 1).padStart(2, "0")}
            </span>

            <div className="min-w-0">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
                <Link
                  className="font-display font-medium text-[19px] text-foreground leading-[1.2] tracking-[-0.012em] no-underline transition-colors hover:text-brand"
                  href={`/zh-TW/articles/${article.slug}`}
                >
                  {article.title}
                </Link>
                <span className="shrink-0 font-mono text-[10.5px] text-foreground-subtle uppercase tabular-nums tracking-[0.12em]">
                  <time dateTime={article.date}>
                    {formatDateShort(article.date)}
                  </time>
                </span>
              </div>
              {article.description && (
                <p className="mt-1.5 font-body text-muted-foreground text-sm leading-[1.6]">
                  {article.description}
                </p>
              )}
            </div>
          </li>
        ))}
      </ol>
    </PlatePage>
  );
}
