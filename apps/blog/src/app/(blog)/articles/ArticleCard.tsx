import { Card, CardCta, CardDescription, CardEyebrow, CardTitle } from "@/app/(common)/Card"
import { formatDate } from "@/utils/time"

import type { ArticleEntity } from "./service"

export default function ArticleCard({ slug, meta }: Omit<ArticleEntity, "position">) {
  return (
    <Card as="article">
      <CardTitle href={`/articles/${slug}`}>{meta.title}</CardTitle>
      <CardEyebrow as="time" dateTime={meta.date} decorate>
        {formatDate(meta.date)}
      </CardEyebrow>
      <CardDescription>{meta.description}</CardDescription>
      <CardCta>Read article</CardCta>
    </Card>
  )
}
