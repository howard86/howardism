import { SITE_NAME } from "@/app/constants";
import { DomainDot } from "@/components/howardism/domain-dot";
import JsonLd from "@/components/json-ld";
import { env } from "@/config/env";
import { formatDateShort } from "@/utils/time";

import { PlatePage } from "./_shell/plate-page";
import { DOMAIN_META, DOMAIN_ORDER } from "./articles/domain-meta";
import {
  domainIssueStats,
  latestActivityMs,
  recentSources,
  sortByActivity,
} from "./articles/release-view";
import {
  type ArticleDomain,
  type ArticleEntity,
  getArticlesGroupedByDomain,
  getDomainCounts,
  getDomainLeadSource,
  getDomainSparklines,
  getLatestRelease,
  getNoteActivity,
  getNoteHistory,
  getRecentReleases,
  getVisibleArticles,
  getWikiSources,
  type LatestRelease,
  type Normalise,
  type NoteActivity,
  type WikiSource,
} from "./articles/service";
import { buildWebSite } from "./articles/structured-data";
import { Desk } from "./desk";
import { DomainPlate, type IssueSource } from "./domain-plate";
import { ThisIssue } from "./this-issue";

/** Domains below this note count are listed in the compact tail, not plated. */
const MIN_PLATE_COUNT = 6;
/** With a release history, at most this many touched domains get a plate. */
const MAX_ISSUE_PLATES = 6;
/** Releases the desk draws its recently processed sources from. */
const DESK_RELEASES = 3;
const DESK_RECENT_LIMIT = 24;

const pluralize = (n: number, word: string) =>
  `${n} ${word}${n === 1 ? "" : "s"}`;

interface IssuePlan {
  activity: Record<string, NoteActivity>;
  featured: ArticleDomain[];
  issueSources: Partial<Record<ArticleDomain, IssueSource>>;
  tail: ArticleDomain[];
}

/**
 * With a release history: plate only the domains the latest release touched
 * (top {@link MAX_ISSUE_PLATES} by notes touched, ties by total count); the
 * rest go to the quiet row.
 */
function planIssuePlates({
  latest,
  counts,
  visible,
  articlesByDomain,
  sourceByTitle,
}: {
  articlesByDomain: Record<ArticleDomain, ArticleEntity[]>;
  counts: Record<ArticleDomain, number>;
  latest: LatestRelease;
  sourceByTitle: ReadonlyMap<string, WikiSource>;
  visible: Normalise<ArticleEntity>;
}): IssuePlan {
  const stats = domainIssueStats(latest.entry, (slug) => {
    const meta = visible.entities[slug]?.meta;
    return meta && meta.tag !== "Index" ? meta.domain : undefined;
  });
  const touched = (domain: ArticleDomain) =>
    stats.get(domain)?.slugs.length ?? 0;
  const featured = DOMAIN_ORDER.filter((domain) => stats.has(domain))
    .sort((a, b) => touched(b) - touched(a) || counts[b] - counts[a])
    .slice(0, MAX_ISSUE_PLATES);
  const tail = DOMAIN_ORDER.filter(
    (domain) => counts[domain] > 0 && !featured.includes(domain)
  );
  const issueSources: IssuePlan["issueSources"] = {};
  const activity: IssuePlan["activity"] = {};
  for (const domain of featured) {
    const top = stats.get(domain)?.topSource;
    if (top) {
      const info = sourceByTitle.get(top.title);
      issueSources[domain] = {
        kind: info?.kind ?? "Source",
        title: top.title,
        touched: top.touched,
        url: info?.url,
      };
    }
    for (const entity of articlesByDomain[domain] ?? []) {
      activity[entity.slug] = getNoteActivity(entity.slug);
    }
  }
  return { featured, tail, issueSources, activity };
}

export default async function Home() {
  const [
    counts,
    sparklines,
    visible,
    leadSources,
    articlesByDomain,
    latest,
    recentReleases,
  ] = await Promise.all([
    getDomainCounts(),
    getDomainSparklines(),
    getVisibleArticles(),
    Promise.all(
      DOMAIN_ORDER.map(
        async (domain) => [domain, await getDomainLeadSource(domain)] as const
      )
    ),
    getArticlesGroupedByDomain(),
    getLatestRelease(),
    getRecentReleases(DESK_RELEASES),
  ]);

  const leadSourceByDomain = Object.fromEntries(leadSources);

  const total = Object.values(counts).reduce((sum, n) => sum + n, 0);
  const sourceCount = getWikiSources().length;
  const newestDate = visible.entities[visible.ids[0]]?.meta.date;

  const wikiSources = getWikiSources();
  const sourceByTitle = new Map(wikiSources.map((s) => [s.title, s]));

  const plan = latest
    ? planIssuePlates({
        latest,
        counts,
        visible,
        articlesByDomain,
        sourceByTitle,
      })
    : {
        featured: DOMAIN_ORDER.filter(
          (domain) => counts[domain] >= MIN_PLATE_COUNT
        ),
        tail: DOMAIN_ORDER.filter(
          (domain) => counts[domain] > 0 && counts[domain] < MIN_PLATE_COUNT
        ),
        issueSources: {} as Partial<Record<ArticleDomain, IssueSource>>,
        activity: {} as Record<string, NoteActivity>,
      };
  const { featured, tail, issueSources, activity } = plan;

  const notesFor = (domain: ArticleDomain) => {
    const articles = articlesByDomain[domain] ?? [];
    return latest
      ? sortByActivity(articles, (entity) =>
          latestActivityMs(entity.meta.date, getNoteHistory(entity.slug))
        )
      : articles;
  };

  const isVisible = (slug: string) => visible.entities[slug] !== undefined;
  const recent = latest
    ? recentSources(recentReleases, isVisible, DESK_RECENT_LIMIT).map(
        ({ title, no, touched }) => ({
          no,
          touched,
          source: sourceByTitle.get(title) ?? { title, kind: "Source" },
        })
      )
    : undefined;

  const intro = latest ? (
    <p className="mt-6 max-w-[760px] font-body text-[clamp(16px,2.2vw,18.5px)] text-muted-foreground leading-[1.55]">
      Working notes on interaction-era AI, kept publicly. A release lands when a
      batch of sources is finished. Most of the work is revision: each source
      adds about one note and rewrites a dozen that it touches.
    </p>
  ) : (
    <p className="mt-6 max-w-[760px] font-body text-[clamp(16px,2.2vw,18.5px)] text-muted-foreground leading-[1.55]">
      Working notes on interaction-era AI, kept publicly. Each plate is a
      domain; each domain carries its brightest notes and the source I&apos;m
      currently digesting. {total} notes across {sourceCount} sources
      {newestDate ? `, last filed ${formatDateShort(newestDate)}` : ""}. Updated
      whenever a batch finishes — not on a schedule.
    </p>
  );

  const figures = latest ? (
    <div className="mt-6 flex flex-wrap items-baseline gap-x-8 gap-y-2">
      {(
        [
          [latest.newSlugs.length, "new"],
          [latest.revisedSlugs.length, "revised"],
        ] as const
      ).map(([n, label]) => (
        <span
          className="font-display font-light text-[clamp(44px,7vw,64px)] text-brand leading-none tracking-[-0.03em]"
          key={label}
        >
          {n}
          <small className="ml-2 font-medium font-mono text-[11px] text-foreground-subtle uppercase tracking-[0.18em]">
            {label}
          </small>
        </span>
      ))}
      <span className="font-mono text-[11px] text-foreground-subtle uppercase tracking-[0.14em]">
        Released {formatDateShort(latest.entry.date)}
        {latest.prevDate ? ` · since ${formatDateShort(latest.prevDate)}` : ""}
      </span>
    </div>
  ) : undefined;

  const headerData: [string, string][] = latest
    ? [
        [
          "Answered",
          `${pluralize(latest.entry.resolved.length, "question")} this issue`,
        ],
        ["Curator", "Howard Tai"],
        ["Cadence", "Batched, not scheduled"],
        ["Based", "Taiwan, 23°N"],
      ]
    : [
        ["Curator", "Howard Tai"],
        ["Issue", `Vol. 03 · no. ${total}`],
        ["Cadence", "Batched, not scheduled"],
        ["Based", "Taiwan, 23°N"],
        ["Contact", "howard@howardism.dev"],
      ];

  return (
    <PlatePage
      bleed
      eyebrowEnd={
        latest ? `Release · ${formatDateShort(latest.entry.date)}` : undefined
      }
      figures={figures}
      headerChildren={intro}
      headerData={headerData}
      plate="home"
      title="A wiki, set"
      titleAccent="in plates."
      width="wide"
    >
      <JsonLd
        data={buildWebSite({
          siteName: SITE_NAME,
          siteUrl: env.NEXT_PUBLIC_DOMAIN_NAME,
        })}
      />
      {latest ? (
        <ThisIssue
          entities={visible.entities}
          release={latest}
          sources={sourceByTitle}
        />
      ) : null}
      {featured.map((domain, index) => (
        <DomainPlate
          activity={activity}
          articles={notesFor(domain)}
          bars={sparklines[domain]}
          count={counts[domain]}
          domain={domain}
          index={index}
          issueSource={issueSources[domain]}
          key={domain}
          leadSource={leadSourceByDomain[domain]}
        />
      ))}

      {tail.length > 0 && (
        <DomainTail
          counts={counts}
          domains={tail}
          heading={latest ? "Quiet this issue" : "Also in the wiki"}
        />
      )}

      <Desk recent={recent} recentSpan={DESK_RELEASES} sources={wikiSources} />
    </PlatePage>
  );
}

/** Compact row for small domains that don't warrant a full plate. */
function DomainTail({
  domains,
  counts,
  heading,
}: {
  counts: Record<ArticleDomain, number>;
  domains: ArticleDomain[];
  heading: string;
}) {
  return (
    <section className="border-border border-b px-gutter py-9">
      <div className="font-medium font-mono text-[10.5px] text-foreground-subtle uppercase tracking-[0.22em]">
        {heading}
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
