import { WIKI_DOMAINS } from "@howardism/article-contract";

import { DOMAIN_META } from "@/app/(blog)/articles/domain-meta";
import { getVisibleArticles } from "@/app/(blog)/articles/service";
import { SITE_DESCRIPTION, SITE_NAME } from "@/app/constants";
import { env } from "@/config/env";

export const dynamic = "force-static";

/**
 * llms.txt (https://llmstxt.org/): a markdown map of the site for agentic
 * browsers — an H1, a one-line summary, then `##` sections grouping every
 * visible article by knowledge domain as `- [Title](url): description`.
 */
export async function GET() {
  const visible = await getVisibleArticles();
  const baseUrl = env.NEXT_PUBLIC_DOMAIN_NAME;

  const linesByDomain = new Map<string, string[]>();
  for (const slug of visible.ids) {
    const entity = visible.entities[slug];
    const domain = entity?.meta.domain;
    if (!(entity && domain)) {
      continue;
    }
    const line = `- [${entity.meta.title}](${baseUrl}/articles/${slug}): ${entity.meta.description}`;
    const lines = linesByDomain.get(domain);
    if (lines) {
      lines.push(line);
    } else {
      linesByDomain.set(domain, [line]);
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

  const body = `# ${SITE_NAME}

> ${SITE_DESCRIPTION}

Articles-only blog. Notes are organized into knowledge domains below; the full index is at ${baseUrl}/articles.

${sections}
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
