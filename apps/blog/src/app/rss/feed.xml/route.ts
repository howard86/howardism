import { generateFeed } from "../service"

export const dynamic = "force-static"

export async function GET() {
  const feed = await generateFeed()

  return new Response(feed.rss2(), {
    headers: {
      "Content-Type": "application/atom+xml; charset=utf-8",
    },
  })
}
