import { ArticlesIndexClient } from "./ArticlesIndexClient";
import { getArticles } from "./service";

export default async function ArticlesIndex() {
  const articles = await getArticles();

  const articleList = articles.ids
    .map((slug) => articles.entities[slug])
    .filter((a): a is NonNullable<typeof a> => a !== undefined);

  return (
    <div
      className="hw-page-enter"
      style={{ maxWidth: 720, margin: "0 auto", padding: "48px 16px 80px" }}
    >
      {/* Double-rule masthead */}
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
          ARTICLES
        </span>
      </div>

      {/* Section heading */}
      <h1
        className="hw-display"
        style={{
          fontSize: 28,
          fontWeight: 400,
          color: "var(--hw-ink)",
          marginBottom: 8,
          lineHeight: 1.2,
        }}
      >
        Writing
      </h1>
      <p
        className="hw-body"
        style={{
          fontSize: 14,
          color: "var(--hw-ink-2)",
          marginBottom: 32,
          lineHeight: 1.6,
        }}
      >
        Long-form explorations of software, craft, and the occasional tangent.
      </p>

      <ArticlesIndexClient articles={articleList} />
    </div>
  );
}
