import { Card, CardCta, CardDescription, CardEyebrow, CardTitle } from "@/components/template/Card"
import { ArticleEntity } from "@/services/article"
import { formatDate } from "@/utils/time"

export default function ArticleCard({ slug, meta }: ArticleEntity) {
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
