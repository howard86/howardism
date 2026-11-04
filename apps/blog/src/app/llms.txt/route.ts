import { WIKI_DOMAINS } from "@howardism/article-contract";

import { DOMAIN_META } from "@/app/(blog)/articles/domain-meta";
import { getVisibleArticles } from "@/app/(blog)/articles/service";
import { SITE_DESCRIPTION, SITE_NAME } from "@/app/constants";
import { env } from "@/config/env";

export const dynamic = "force-static";

/** Article kinds (`meta.tag`) listed under `## Optional`. */
const OPTIONAL_KINDS: ReadonlySet<string> = new Set(["Entity", "Index"]);

const NOTE_MAX = 120;
const FIRST_SENTENCE = /^.*?[.!?](?=\s|$)/s;

/** First sentence of `description`, cut to ~120 chars; "" when empty. */
function note(description: string | undefined): string {
  const text = (description ?? "").replace(/\s+/g, " ").trim();
  if (!text) {
    return "";
  }
  const sentence = FIRST_SENTENCE.exec(text)?.[0] ?? text;
  const clipped =
    sentence.length > NOTE_MAX
      ? `${sentence.slice(0, NOTE_MAX - 1).trimEnd()}…`
      : sentence;
  return `: ${clipped}`;
}

/**
 * llms.txt (https://llmstxt.org/): a markdown map of the site for agentic
 * browsers — an H1, a one-line summary, then `##` sections grouping visible
 * articles by knowledge domain as `- [Title](url): short note`. Entity and
 * Index pages go under `## Optional`, which agents may skip for a shorter
 * context.
 */
export async function GET() {
  const visible = await getVisibleArticles();
  const baseUrl = env.NEXT_PUBLIC_DOMAIN_NAME;

  const linesByDomain = new Map<string, string[]>();
  const optionalByDomain = new Map<string, string[]>();
  for (const slug of visible.ids) {
    const entity = visible.entities[slug];
    const domain = entity?.meta.domain;
    if (!(entity && domain)) {
      continue;
    }
    const line = `- [${entity.meta.title}](${baseUrl}/articles/${slug})${note(entity.meta.description)}`;
    const target = OPTIONAL_KINDS.has(entity.meta.tag)
      ? optionalByDomain
      : linesByDomain;
    const lines = target.get(domain);
    if (lines) {
      lines.push(line);
    } else {
      target.set(domain, [line]);
    }
  }

  // Every visible article must get a link here, including one filed under
  // `syntheses` — that domain isn't browsable (see DOMAIN_ORDER), but its
  // articles still exist and llms.txt is a completeness map, not a nav menu.
  const sections = WIKI_DOMAINS.filter((domain) => linesByDomain.has(domain))
    .map((domain) => {
      const lines = linesByDomain.get(domain);
      return `## ${DOMAIN_META[domain].label}\n\n${lines?.join("\n")}`;
    })
    .join("\n\n");

  const optional = WIKI_DOMAINS.filter((domain) => optionalByDomain.has(domain))
    .map((domain) => optionalByDomain.get(domain)?.join("\n"))
    .join("\n");

  const body = `# ${SITE_NAME}

> ${SITE_DESCRIPTION}

Articles-only blog. Notes are organized into knowledge domains below; the full index is at ${baseUrl}/articles.

- [Sitemap](${baseUrl}/sitemap.xml)
- [RSS feed](${baseUrl}/rss/feed.xml)
- [JSON feed](${baseUrl}/rss/feed.json)

${sections}

## Optional

${optional}
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
