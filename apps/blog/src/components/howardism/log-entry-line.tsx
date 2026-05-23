import type { ArticleTopic, WikiLogEntry } from "@/app/(blog)/articles/service";

import { TopicDot } from "./topic-dot";

interface LogEntryLineProps {
  entry: WikiLogEntry;
  /** Resolve a referenced article slug to its topic, for the leading dot. */
  slugTopics: Record<string, ArticleTopic | undefined>;
}

/**
 * Inner content of a wiki-log line — topic dot + operation + subject — shared
 * by the home "Currents" and the articles "Operations log". The caller owns
 * the wrapping element and its type scale.
 */
export function LogEntryLine({ entry, slugTopics }: LogEntryLineProps) {
  const topic = entry.refs
    .map((slug) => slugTopics[slug])
    .find((t): t is ArticleTopic => t !== undefined);

  return (
    <>
      {topic && <TopicDot size={6} topic={topic} />}
      <span className="mr-2 font-mono text-[10.5px] text-foreground-subtle uppercase tracking-[0.14em]">
        {entry.operation}
      </span>
      {entry.subject}
    </>
  );
}
