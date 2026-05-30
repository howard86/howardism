import { DiscPageHeader } from "@/components/howardism/disc-page-header";
import { DomainDot } from "@/components/howardism/domain-dot";
import { formatDateShort } from "@/utils/time";

import { DOMAIN_META, DOMAIN_ORDER } from "./articles/domain-meta";
import {
  type ArticleDomain,
  getArticlesByDomain,
  getDomainCounts,
  getDomainLeadSource,
  getDomainSparklines,
  getVisibleArticles,
  getWikiSources,
} from "./articles/service";
import { Desk } from "./desk";
import { DomainPlate } from "./domain-plate";

/** Domains below this note count are listed in the compact tail, not plated. */
const MIN_PLATE_COUNT = 6;

export default async function Home() {
  const [counts, sparklines, visible, leadSources, domainArticles] =
    await Promise.all([
      getDomainCounts(),
      getDomainSparklines(),
      getVisibleArticles(),
      Promise.all(
        DOMAIN_ORDER.map(
          async (domain) => [domain, await getDomainLeadSource(domain)] as const
        )
      ),
      Promise.all(
        DOMAIN_ORDER.map(
          async (domain) => [domain, await getArticlesByDomain(domain)] as const
        )
      ),
    ]);

  const leadSourceByDomain = Object.fromEntries(leadSources);
  const articlesByDomain = Object.fromEntries(domainArticles);

  const total = Object.values(counts).reduce((sum, n) => sum + n, 0);
  const sourceCount = getWikiSources().length;
  const newestDate = visible.entities[visible.ids[0]]?.meta.date;

  const featured = DOMAIN_ORDER.filter(
    (domain) => counts[domain] >= MIN_PLATE_COUNT
  );
  const tail = DOMAIN_ORDER.filter(
    (domain) => counts[domain] > 0 && counts[domain] < MIN_PLATE_COUNT
  );

  return (
    <div className="hw-page-enter mx-auto max-w-[1320px]">
      <div className="px-[clamp(20px,5vw,56px)]">
        <DiscPageHeader
          data={[
            ["Curator", "Howard Tai"],
            ["Issue", `Vol. 03 · no. ${total}`],
            ["Cadence", "Batched, not scheduled"],
            ["Based", "Taiwan, 23°N"],
            ["Contact", "howard@howardism.dev"],
          ]}
          number="00"
          plate="Masthead"
          title="A wiki, set"
          titleAccent="in plates."
          volume="Howardism · Vol. 03"
        >
          <p className="mt-6 max-w-[760px] font-body text-[clamp(16px,2.2vw,18.5px)] text-muted-foreground leading-[1.55]">
            Working notes on interaction-era AI, kept publicly. Each plate is a
            domain; each domain carries its brightest notes and the source
            I&apos;m currently digesting. {total} notes across {sourceCount}{" "}
            sources
            {newestDate ? `, last filed ${formatDateShort(newestDate)}` : ""}.
            Updated whenever a batch finishes — not on a schedule.
          </p>
        </DiscPageHeader>
      </div>

      {featured.map((domain, index) => (
        <DomainPlate
          articles={articlesByDomain[domain] ?? []}
          bars={sparklines[domain]}
          count={counts[domain]}
          domain={domain}
          index={index}
          key={domain}
          leadSource={leadSourceByDomain[domain]}
        />
      ))}

      {tail.length > 0 && <DomainTail counts={counts} domains={tail} />}

      <Desk sources={getWikiSources()} />
    </div>
  );
}

/** Compact row for small domains that don't warrant a full plate. */
function DomainTail({
  domains,
  counts,
}: {
  counts: Record<ArticleDomain, number>;
  domains: ArticleDomain[];
}) {
  return (
    <section className="border-border border-b px-[clamp(20px,5vw,56px)] py-9">
      <div className="font-medium font-mono text-[10.5px] text-foreground-subtle uppercase tracking-[0.22em]">
        Also in the wiki
      </div>
      <ul className="mt-4 flex flex-wrap gap-x-8 gap-y-3">
        {domains.map((domain) => (
          <li key={domain}>
            <a
              className="inline-flex items-baseline font-display text-[20px] text-foreground no-underline transition-colors hover:text-brand"
              href={`/articles/domain/${domain}`}
            >
              <DomainDot domain={domain} size={7} />
              {DOMAIN_META[domain].label}
              <span className="ml-2 font-mono text-[11px] text-foreground-subtle tracking-[0.12em]">
                {counts[domain]}
              </span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
