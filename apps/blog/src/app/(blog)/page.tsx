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
  const [counts, sparklines, visible, leadSources, topicArticles] =
    await Promise.all([
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
            topic; each topic carries its brightest notes and the source
            I&apos;m currently digesting. {total} notes across {sourceCount}{" "}
            sources
            {newestDate ? `, last filed ${formatDateShort(newestDate)}` : ""}.
            Updated whenever a batch finishes — not on a schedule.
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
