import { generateFeed } from "../service";

export const dynamic = "force-static";

interface JsonFeed1Author {
  avatar?: string;
  name?: string;
  url?: string;
}

interface JsonFeed1Item {
  author?: JsonFeed1Author;
  content_html?: string;
  [key: string]: unknown;
}

interface JsonFeed1 {
  author?: JsonFeed1Author;
  items: JsonFeed1Item[];
  version: string;
  [key: string]: unknown;
}

/**
 * The `feed` package only writes JSON Feed 1: singular `author`, and a
 * `summary` only when an item also has `content`. Items here carry just the
 * plain-text description, so it becomes `summary` + `content_text`.
 */
function toJsonFeed11(json: string): string {
  const {
    author,
    items,
    version: _version,
    ...rest
  } = JSON.parse(json) as JsonFeed1;

  return JSON.stringify(
    {
      version: "https://jsonfeed.org/version/1.1",
      ...rest,
      language: "en",
      ...(author && { authors: [author] }),
      items: items.map(({ author: itemAuthor, content_html, ...item }) => ({
        ...item,
        ...(content_html && {
          summary: content_html,
          content_text: content_html,
        }),
        ...(itemAuthor && { authors: [itemAuthor] }),
      })),
    },
    null,
    4
  );
}

export async function GET() {
  const feed = await generateFeed();

  return new Response(toJsonFeed11(feed.json1()), {
    headers: {
      "Content-Type": "application/feed+json; charset=utf-8",
    },
  });
}
