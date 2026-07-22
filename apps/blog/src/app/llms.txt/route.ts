import { DOMAIN_META, DOMAIN_ORDER } from "@/app/(blog)/articles/domain-meta";
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

  const sections = DOMAIN_ORDER.filter((domain) => linesByDomain.has(domain))
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
