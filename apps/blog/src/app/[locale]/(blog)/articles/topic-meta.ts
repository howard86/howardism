import { ARTICLE_TOPICS, type ArticleTopic } from "./service";

export interface TopicMeta {
  /** Short marketing-y line under the topic headline / on the route page. */
  blurb: string;
  /** CSS color token reference for dots, numerals, and rules. */
  color: string;
  /** Display label. */
  label: string;
  /** Meta-description for `/articles/topic/[topic]` SEO. */
  metaDescription: string;
}

/**
 * Display metadata for the five curated subject topics. Order drives the home
 * plate stack. Colors reference the `--topic-*` tokens in `@howardism/ui`.
 */
export const TOPIC_META: Record<ArticleTopic, TopicMeta> = {
  interaction: {
    label: "Interaction",
    blurb: "Real-time multimodal, full-duplex, and human-AI collaboration.",
    color: "var(--topic-interaction)",
    metaDescription:
      "Interaction notes — real-time multimodal models, full-duplex interfaces, and human-AI collaboration from the Howardism wiki.",
  },
  architecture: {
    label: "Architecture",
    blurb: "Model internals: encoder-free fusion, training, scaling, evals.",
    color: "var(--topic-architecture)",
    metaDescription:
      "Architecture notes — model internals, encoder-free fusion, training, scaling laws, and evaluation from the Howardism wiki.",
  },
  harness: {
    label: "Harness",
    blurb: "Agent loops, tools, orchestration, and Claude Code patterns.",
    color: "var(--topic-harness)",
    metaDescription:
      "Harness notes — agent loops, tools, orchestration, and Claude Code patterns from the Howardism wiki.",
  },
  alignment: {
    label: "Alignment",
    blurb: "RLHF, character, interpretability, and safety case studies.",
    color: "var(--topic-alignment)",
    metaDescription:
      "Alignment notes — RLHF, character training, interpretability, and safety case studies from the Howardism wiki.",
  },
  orgs: {
    label: "Orgs",
    blurb: "Labs, people & products: Anthropic, OpenAI, TML, Claude Code.",
    color: "var(--topic-orgs)",
    metaDescription:
      "Orgs notes — the labs, people, and products shaping AI: Anthropic, OpenAI, Thinking Machines, and more.",
  },
};

/** Topic display order — the canonical list, re-exported for plate consumers. */
export const TOPIC_ORDER = ARTICLE_TOPICS;

/**
 * Resolve a (possibly user-supplied) URL segment to a canonical topic.
 * Returns `null` for unknown slugs so callers can `notFound()`.
 */
export function resolveTopic(rawSlug: string): ArticleTopic | null {
  const slug = rawSlug.toLowerCase();
  return (TOPIC_ORDER as readonly string[]).includes(slug)
    ? (slug as ArticleTopic)
    : null;
}
