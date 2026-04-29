import { cn } from "@howardism/ui/lib/utils";
import Link from "next/link";
import type { ReactNode } from "react";

import { DataGrid } from "@/components/howardism/DataGrid";
import { HalfDisc } from "@/components/howardism/HalfDisc";
import { formatDate } from "@/utils/time";

import type { ArticleMeta } from "../service";

interface ArticleLayoutProps {
  children?: ReactNode;
  meta: ArticleMeta;
  nextSlug?: string;
  position?: number;
  previousSlug?: string;
}

export function ArticleLayout({
  children,
  meta,
  previousSlug,
  nextSlug,
  position = 1,
}: ArticleLayoutProps) {
  const plateNumber = String(position).padStart(2, "0");

  return (
    <div
      className="hw-page-enter"
      style={{ maxWidth: 720, margin: "0 auto", padding: "0 16px 80px" }}
    >
      {/* Mini-masthead */}
      <div
        style={{
          position: "relative",
          overflow: "hidden",
          borderTop: "2px solid var(--hw-ink)",
          borderBottom: "1px solid var(--hw-rule)",
          padding: "10px 0 40px",
          marginBottom: 40,
        }}
      >
        {/* Masthead labels */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            marginBottom: 28,
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
            PLATE II · PIECE № {plateNumber}
          </span>
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
        </div>

        {/* Title + DataGrid in a 2-col grid; HalfDisc bleeds right */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr auto",
            gap: "0 32px",
            alignItems: "start",
          }}
        >
          <div>
            <h1
              className="hw-display"
              style={{
                fontSize: 26,
                fontWeight: 400,
                color: "var(--hw-ink)",
                lineHeight: 1.25,
                marginBottom: 20,
              }}
            >
              {meta.title}
            </h1>
            <DataGrid
              maxWidth={280}
              rows={[
                ["Published", formatDate(meta.date)],
                ["Filed", meta.tag],
                ["Reading", `${meta.readingTime} min`],
                ["Author", "Howard Tai"],
              ]}
            />
          </div>

          {/* HalfDisc corner bleed */}
          <div
            aria-hidden="true"
            style={{
              position: "relative",
              marginRight: -16,
              marginTop: -10,
              flexShrink: 0,
            }}
          >
            <HalfDisc align="right" size={140} />
          </div>
        </div>
      </div>

      {/* Italic description lede */}
      <p
        className="hw-body"
        style={{
          fontSize: 16,
          fontStyle: "italic",
          color: "var(--hw-ink-2)",
          marginBottom: 32,
          lineHeight: 1.65,
          borderLeft: "2px solid var(--hw-accent)",
          paddingLeft: 16,
        }}
      >
        {meta.description}
      </p>

      {/* Article prose */}
      <article>
        <div className={cn("hw-prose", meta.dropCap && "hw-drop-cap")}>
          {children}
        </div>

        {/* § end rule */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            margin: "40px 0",
          }}
        >
          <div style={{ flex: 1, height: 1, background: "var(--hw-rule)" }} />
          <span
            className="hw-mono"
            style={{ fontSize: 12, color: "var(--hw-ink-3)" }}
          >
            § end
          </span>
          <div style={{ flex: 1, height: 1, background: "var(--hw-rule)" }} />
        </div>

        {/* Author card */}
        <div
          className="hw-card"
          style={{ padding: "20px 24px", marginBottom: 48 }}
        >
          <div className="hw-eyebrow" style={{ marginBottom: 8, fontSize: 10 }}>
            About the author
          </div>
          <p
            className="hw-body"
            style={{ fontSize: 13, color: "var(--hw-ink-2)", margin: 0 }}
          >
            Howard Tai is a software engineer and amateur diver based in
            Singapore. He writes about engineering, mathematics, and the
            occasional ocean adventure.
          </p>
        </div>

        {/* Bracketed prev/next nav */}
        {(previousSlug ?? nextSlug) && (
          <nav
            aria-label="Article navigation"
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 16,
            }}
          >
            <div>
              {previousSlug && (
                <Link
                  href={`/articles/${previousSlug}`}
                  style={{
                    fontFamily: "var(--hw-font-mono)",
                    fontSize: 12,
                    color: "var(--hw-accent)",
                    textDecoration: "none",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <span aria-hidden="true">[←]</span>
                  <span>Previous</span>
                </Link>
              )}
            </div>
            <div>
              {nextSlug && (
                <Link
                  href={`/articles/${nextSlug}`}
                  style={{
                    fontFamily: "var(--hw-font-mono)",
                    fontSize: 12,
                    color: "var(--hw-accent)",
                    textDecoration: "none",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <span>Next</span>
                  <span aria-hidden="true">[→]</span>
                </Link>
              )}
            </div>
          </nav>
        )}
      </article>
    </div>
  );
}
