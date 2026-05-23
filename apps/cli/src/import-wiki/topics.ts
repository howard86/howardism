/**
 * Curated subject-topic taxonomy for the blog's home "plate stack".
 *
 * The wiki uses ~100 granular, free-form `tags`. The public blog groups work
 * into five stable subject buckets. `deriveTopic` scores a note's tags against
 * each bucket and picks the strongest; ties break by `TOPIC_PRIORITY` so a note
 * that is *about* something technical still lands in its technical bucket even
 * when it also carries a categorical `entity`/`org` tag.
 *
 * The `@howardism/article-contract` package is the source of truth for the
 * `WikiTopic` union and `WIKI_TOPICS` array. This file owns only the
 * derivation logic that maps wiki tags → topics.
 */
import { WIKI_TOPICS, type WikiTopic } from "@howardism/article-contract";

/**
 * Tie-break order (earlier wins). The categorical `orgs` bucket is last so an
 * entity note about, say, Claude Code lands in `harness`, while a pure
 * person/lab note (no technical tags) still falls through to `orgs`.
 */
const TOPIC_PRIORITY: readonly WikiTopic[] = [
  "interaction",
  "alignment",
  "harness",
  "architecture",
  "orgs",
];

/**
 * Bucket → owned wiki tags. Tags absent here contribute no score; a note with
 * no matching tag falls back to `FALLBACK_TOPIC`.
 */
const TOPIC_TAGS: Record<WikiTopic, readonly string[]> = {
  interaction: [
    "human-ai-collaboration",
    "multimodal",
    "interface",
    "interactivity",
    "interaction",
    "full-duplex",
    "real-time",
    "audio",
    "video",
    "speech",
    "ai-coworking",
    "cowork",
    "cognitive-load",
    "accountability",
  ],
  architecture: [
    "llm-architecture",
    "architecture",
    "training",
    "midtraining",
    "model-spec",
    "scaling-laws",
    "inverse-scaling",
    "inference",
    "synthetic-data",
    "sft",
    "model",
    "llm-model",
    "llm-capabilities",
    "generalization",
    "empirical",
    "evaluation",
    "llm-evaluation",
    "principle",
  ],
  harness: [
    "agent-engineering",
    "agent-runtime",
    "agent-orchestration",
    "agents",
    "orchestration",
    "claude-code",
    "codex",
    "cli-agent",
    "developer-workflow",
    "prompt-engineering",
    "prompting",
    "harness",
    "automation",
    "optimization",
    "model-routing",
    "context-management",
    "planning",
    "workflow-design",
    "software-design",
    "software-development",
    "ai-coding",
    "permissions",
    "integration",
    "protocol",
    "messaging-platform",
    "skills-development",
    "debugging",
    "methodology",
    "process",
  ],
  alignment: [
    "alignment",
    "rlhf",
    "safety",
    "agent-safety",
    "chain-of-thought",
    "interpretability",
    "monitoring",
    "misalignment",
    "belief-modification",
    "governance",
    "llm-character",
    "vulnerability-research",
    "cybersecurity",
    "exploit-development",
  ],
  orgs: [
    "entity",
    "org",
    "anthropic",
    "openai",
    "ai-lab",
    "nous-research",
    "ai",
    "person",
    "alignment-researcher",
    "business-strategy",
    "moats",
    "workforce",
    "hr",
    "career",
    "product-management",
    "product",
    "ai-adoption",
    "ai-economy",
    "software-economics",
    "macro",
    "history",
    "generalists",
    "team-design",
    "org-design",
    "ai-tools",
  ],
};

const FALLBACK_TOPIC: WikiTopic = "architecture";

const TAG_TO_TOPIC: Map<string, WikiTopic> = (() => {
  const map = new Map<string, WikiTopic>();
  for (const topic of WIKI_TOPICS) {
    for (const tag of TOPIC_TAGS[topic]) {
      // First bucket to claim a tag keeps it; the lists are disjoint by design.
      if (!map.has(tag)) {
        map.set(tag, topic);
      }
    }
  }
  return map;
})();

/**
 * Resolve a note's subject topic from its (lower-cased) wiki tags. Scores each
 * bucket by matched tags, picks the highest, breaks ties by `TOPIC_PRIORITY`,
 * and falls back to `FALLBACK_TOPIC` when nothing matches.
 */
export function deriveTopic(tags: readonly string[] | undefined): WikiTopic {
  if (!tags || tags.length === 0) {
    return FALLBACK_TOPIC;
  }

  const scores = new Map<WikiTopic, number>();
  for (const rawTag of tags) {
    const tag = rawTag.trim().toLowerCase();
    const topic = TAG_TO_TOPIC.get(tag);
    if (topic) {
      scores.set(topic, (scores.get(topic) ?? 0) + 1);
    }
  }

  if (scores.size === 0) {
    return FALLBACK_TOPIC;
  }

  let best: WikiTopic = FALLBACK_TOPIC;
  let bestScore = -1;
  for (const topic of TOPIC_PRIORITY) {
    const score = scores.get(topic) ?? 0;
    if (score > bestScore) {
      best = topic;
      bestScore = score;
    }
  }
  return best;
}
