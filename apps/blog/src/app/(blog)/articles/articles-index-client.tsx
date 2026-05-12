"use client";

import Link from "next/link";
import { useState } from "react";

import { formatDate } from "@/utils/time";

import type { ArticleEntity } from "./service";

interface ArticlesIndexClientProps {
  articles: ArticleEntity[];
}

export function ArticlesIndexClient({ articles }: ArticlesIndexClientProps) {
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const tags = Array.from(new Set(articles.map((a) => a.meta.tag))).sort();

  const filtered = activeTag
    ? articles.filter((a) => a.meta.tag === activeTag)
    : articles;

  return (
    <div>
      {/* Tag filter row */}
      <p
        className="hw-mono"
        style={{
          fontSize: 11,
          color: "var(--hw-ink-3)",
          marginBottom: 12,
          display: "flex",
          flexWrap: "wrap",
          gap: "4px 8px",
          alignItems: "center",
        }}
      >
        <span>Filed under</span>
        {tags.map((tag) => {
          const isActive = activeTag === tag;
          return (
            <button
              key={tag}
              onClick={() => setActiveTag(isActive ? null : tag)}
              style={{
                background: "none",
                border: "none",
                padding: "0 0 1px",
                cursor: "pointer",
                fontFamily: "var(--hw-font-mono)",
                fontSize: 11,
                color: isActive ? "var(--hw-accent)" : "var(--hw-ink-3)",
                fontStyle: isActive ? "italic" : "normal",
                borderBottom: isActive
                  ? "1px solid var(--hw-accent)"
                  : "1px solid transparent",
                transition: "color 0.15s, border-color 0.15s",
              }}
              type="button"
            >
              {tag}
            </button>
          );
        })}
        {activeTag && (
          <button
            onClick={() => setActiveTag(null)}
            style={{
              background: "none",
              border: "none",
              padding: 0,
              cursor: "pointer",
              fontFamily: "var(--hw-font-mono)",
              fontSize: 10,
              color: "var(--hw-ink-3)",
            }}
            type="button"
          >
            × all
          </button>
        )}
      </p>

      {/* Numbered article list */}
      <ol
        style={{
          listStyle: "none",
          margin: 0,
          padding: 0,
          display: "flex",
          flexDirection: "column",
          gap: 0,
        }}
      >
        {filtered.map((article, i) => (
          <li
            key={article.slug}
            style={{
              borderTop: "1px solid var(--hw-rule)",
              display: "grid",
              gridTemplateColumns: "3rem 1fr",
              gap: "0 20px",
              alignItems: "baseline",
            }}
          >
            {/* Oversized numeral */}
            <span
              aria-hidden="true"
              className="hw-display"
              style={{
                fontSize: 32,
                fontWeight: 300,
                color: "var(--hw-accent)",
                opacity: 0.55,
                lineHeight: 1,
                paddingTop: 20,
                textAlign: "right",
                userSelect: "none",
              }}
            >
              {String(i + 1).padStart(2, "0")}
            </span>

            {/* Article body */}
            <Link
              className="focus-visible:ring-2 focus-visible:ring-offset-2"
              href={`/articles/${article.slug}`}
              onBlur={(e) => {
                e.currentTarget.style.paddingLeft = "0";
              }}
              onFocus={(e) => {
                e.currentTarget.style.paddingLeft = "4px";
              }}
              onMouseEnter={(e) => {
                if (
                  window.matchMedia("(prefers-reduced-motion: no-preference)")
                    .matches
                ) {
                  e.currentTarget.style.paddingLeft = "4px";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.paddingLeft = "0";
              }}
              style={{
                display: "block",
                padding: "20px 0 20px",
                textDecoration: "none",
                color: "inherit",
                transition: "padding-left 0.2s",
                outline: "none",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: 8,
                  marginBottom: 4,
                }}
              >
                <span
                  className="hw-display"
                  style={{
                    fontSize: 17,
                    fontWeight: 500,
                    color: "var(--hw-ink)",
                    lineHeight: 1.3,
                  }}
                >
                  {article.meta.title}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  gap: 10,
                  alignItems: "center",
                  marginBottom: 6,
                }}
              >
                <span
                  className="hw-mono"
                  style={{ fontSize: 10, color: "var(--hw-ink-3)" }}
                >
                  {formatDate(article.meta.date)}
                </span>
                <span
                  aria-hidden="true"
                  className="hw-mono"
                  style={{ fontSize: 10, color: "var(--hw-ink-3)" }}
                >
                  ·
                </span>
                <span
                  className="hw-mono"
                  style={{ fontSize: 10, color: "var(--hw-ink-3)" }}
                >
                  {article.meta.readingTime} min read
                </span>
                <span
                  className="hw-chip"
                  style={{ fontSize: 10, padding: "2px 8px" }}
                >
                  {article.meta.tag}
                </span>
              </div>
              <p
                className="hw-body"
                style={{
                  fontSize: 14,
                  color: "var(--hw-ink-2)",
                  margin: 0,
                  lineHeight: 1.55,
                }}
              >
                {article.meta.description}
              </p>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}
