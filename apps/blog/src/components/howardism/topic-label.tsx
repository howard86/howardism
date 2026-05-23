import type { ArticleTopic } from "@/app/(blog)/articles/service";
import { TOPIC_META } from "@/app/(blog)/articles/topic-meta";

import { TopicDot } from "./topic-dot";

interface TopicLabelProps {
  size?: number;
  topic: ArticleTopic;
}

/** A topic's color dot followed by its label — the standard inline topic marker. */
export function TopicLabel({ topic, size = 6 }: TopicLabelProps) {
  return (
    <>
      <TopicDot size={size} topic={topic} />
      {TOPIC_META[topic].label}
    </>
  );
}
