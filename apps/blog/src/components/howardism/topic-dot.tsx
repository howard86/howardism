import type { ArticleTopic } from "@/app/[locale]/(blog)/articles/service";
import { TOPIC_META } from "@/app/[locale]/(blog)/articles/topic-meta";

interface TopicDotProps {
  size?: number;
  topic: ArticleTopic;
}

/** Small color-coded dot marking an article's subject topic. */
export function TopicDot({ topic, size = 7 }: TopicDotProps) {
  return (
    <span
      aria-hidden="true"
      className="mr-2 inline-block shrink-0 rounded-full align-middle"
      style={{
        background: TOPIC_META[topic].color,
        height: size,
        width: size,
      }}
    />
  );
}
