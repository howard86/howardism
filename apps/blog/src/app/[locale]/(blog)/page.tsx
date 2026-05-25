import { getTranslations } from "next-intl/server";

import { DiscPageHeader } from "@/components/howardism/disc-page-header";
import { formatDateShort } from "@/utils/time";

import {
  type ArticleTopic,
  getArticlesByTopic,
  getTopicCounts,
  getTopicLeadSource,
  getTopicSparklines,
  getVisibleArticles,
  getWikiLog,
  getWikiSources,
} from "./articles/service";
import { TOPIC_ORDER } from "./articles/topic-meta";
import { Currents } from "./currents";
import { Desk } from "./desk";
import { TopicPlate } from "./topic-plate";

const CURRENTS_LIMIT = 12;

export default async function Home() {
  const [t, counts, sparklines, visible, leadSources, topicArticles] =
    await Promise.all([
      getTranslations("Home"),
      getTopicCounts(),
      getTopicSparklines(),
      getVisibleArticles(),
      Promise.all(
        TOPIC_ORDER.map(
          async (topic) => [topic, await getTopicLeadSource(topic)] as const
        )
      ),
      Promise.all(
        TOPIC_ORDER.map(
          async (topic) => [topic, await getArticlesByTopic(topic)] as const
        )
      ),
    ]);

  const leadSourceByTopic = Object.fromEntries(leadSources);
  const articlesByTopic = Object.fromEntries(topicArticles);

  const total = Object.values(counts).reduce((sum, n) => sum + n, 0);
  const sourceCount = getWikiSources().length;
  const newestDate = visible.entities[visible.ids[0]]?.meta.date;

  const slugTopics: Record<string, ArticleTopic | undefined> = {};
  for (const id of visible.ids) {
    slugTopics[id] = visible.entities[id]?.meta.topic;
  }

  const lastFiled = newestDate
    ? t("lastFiled", { date: formatDateShort(newestDate) })
    : "";

  return (
    <div className="hw-page-enter mx-auto max-w-[1320px]">
      <div className="px-[clamp(20px,5vw,56px)]">
        <DiscPageHeader
          data={[
            ["Curator", t("curator")],
            ["Issue", t("issue", { total })],
            ["Cadence", t("cadence")],
            ["Based", t("based")],
            ["Contact", t("contact")],
          ]}
          number="00"
          plate={t("plate")}
          title={t("title")}
          titleAccent={t("titleAccent")}
          volume={t("volume")}
        >
          <p className="mt-6 max-w-[760px] font-body text-[clamp(16px,2.2vw,18.5px)] text-muted-foreground leading-[1.55]">
            {t("intro", { total, sourceCount, lastFiled })}
          </p>
        </DiscPageHeader>
      </div>

      <Currents entries={getWikiLog(CURRENTS_LIMIT)} slugTopics={slugTopics} />

      {TOPIC_ORDER.map((topic, index) => (
        <TopicPlate
          articles={articlesByTopic[topic] ?? []}
          bars={sparklines[topic]}
          count={counts[topic]}
          index={index}
          key={topic}
          leadSource={leadSourceByTopic[topic]}
          topic={topic}
        />
      ))}

      <Desk sources={getWikiSources()} />
    </div>
  );
}
