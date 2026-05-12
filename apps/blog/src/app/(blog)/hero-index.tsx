import Link from "next/link";

import { formatDate } from "@/utils/time";

import type { ArticleEntity, Normalise } from "./articles/service";

interface HeroIndexProps {
  articles: Normalise<ArticleEntity>;
}

export function HeroIndex({ articles }: HeroIndexProps) {
  const list = articles.ids
    .map((slug) => articles.entities[slug])
    .filter((a): a is NonNullable<typeof a> => a !== undefined);

  return (
    <div
      style={{
        maxWidth: 720,
        margin: "0 auto",
        padding: "48px 16px 0",
      }}
    >
      {/* Masthead */}
      <div
        style={{
          borderTop: "2px solid var(--hw-ink)",
          borderBottom: "1px solid var(--hw-rule)",
          padding: "10px 0",
          marginBottom: 32,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
        }}
      >
        <span
          className="hw-mono"
          style={{
            fontSize: 10,
            color: "var(--hw-ink-3)",
            letterSpacing: "0.08em",
          }}
        >
          HOWARDISM
        </span>
        <span
          className="hw-mono"
          style={{
            fontSize: 10,
            color: "var(--hw-ink-3)",
            letterSpacing: "0.08em",
          }}
        >
          INDEX
        </span>
      </div>

      <h1
        className="hw-display"
        style={{
          fontSize: 24,
          fontWeight: 400,
          color: "var(--hw-ink)",
          marginBottom: 24,
        }}
      >
        Recent writing
      </h1>

      <ol style={{ listStyle: "none", margin: 0, padding: 0 }}>
        {list.map((article, i) => (
          <li
            key={article.slug}
            style={{
              borderTop: "1px solid var(--hw-rule)",
              display: "grid",
              gridTemplateColumns: "2.5rem 1fr",
              gap: "0 16px",
              alignItems: "baseline",
            }}
          >
            <span
              aria-hidden="true"
              className="hw-mono"
              style={{
                fontSize: 11,
                color: "var(--hw-accent)",
                opacity: 0.6,
                paddingTop: 14,
                textAlign: "right",
              }}
            >
              {String(i + 1).padStart(2, "0")}
            </span>
            <Link
              href={`/articles/${article.slug}`}
              style={{
                display: "block",
                padding: "14px 0",
                textDecoration: "none",
                color: "inherit",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  gap: 12,
                }}
              >
                <span
                  className="hw-body"
                  style={{
                    fontSize: 15,
                    fontWeight: 500,
                    color: "var(--hw-ink)",
                  }}
                >
                  {article.meta.title}
                </span>
                <span
                  className="hw-mono"
                  style={{
                    fontSize: 10,
                    color: "var(--hw-ink-3)",
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                  }}
                >
                  {formatDate(article.meta.date)}
                </span>
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 2 }}>
                <span
                  className="hw-chip"
                  style={{ fontSize: 10, padding: "1px 6px" }}
                >
                  {article.meta.tag}
                </span>
                <span
                  className="hw-mono"
                  style={{ fontSize: 10, color: "var(--hw-ink-3)" }}
                >
                  {article.meta.readingTime} min
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}
