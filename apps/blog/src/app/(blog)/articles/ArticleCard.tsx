import {
  Card,
  CardCta,
  CardDescription,
  CardEyebrow,
  CardTitle,
} from "@/app/(common)/Card";
import { formatDate } from "@/utils/time";

import type { ArticleEntity } from "./service";

export default function ArticleCard({
  slug,
  meta,
}: Omit<ArticleEntity, "position">) {
  return (
    <Card as="article">
      <CardTitle href={`/articles/${slug}`}>{meta.title}</CardTitle>
      <CardEyebrow as="time" dateTime={meta.date} decorate>
        {formatDate(meta.date)}
      </CardEyebrow>
      <div
        style={{
          display: "flex",
          gap: 8,
          alignItems: "center",
          marginTop: 4,
          marginBottom: 4,
        }}
      >
        <span className="hw-chip" style={{ fontSize: 10, padding: "2px 8px" }}>
          {meta.tag}
        </span>
        <span
          className="hw-mono"
          style={{ fontSize: 10, color: "var(--hw-ink-3)" }}
        >
          {meta.readingTime} min read
        </span>
      </div>
      <CardDescription>{meta.description}</CardDescription>
      <CardCta>Read article</CardCta>
    </Card>
  );
}
