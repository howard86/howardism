import { IndexRow } from "@howardism/design-system";
import type { ComponentProps } from "react";

type Article = ComponentProps<typeof IndexRow>["article"];

const mk = (
  slug: string,
  title: string,
  domain: string,
  readingTime: number,
  date: string,
  tags: string[],
  tag = "Concept"
) =>
  ({
    slug,
    dateMs: Date.parse(date),
    position: 0,
    sourceHash: slug,
    meta: {
      date,
      title,
      description: title,
      readingTime,
      tag,
      domain,
      tags,
      imageAlt: title,
    },
  }) as Article;

const articles = [
  mk(
    "agent-context-files",
    "Agent Context Files",
    "agent-systems",
    12,
    "2026-11-20",
    ["agents", "context-engineering"]
  ),
  mk(
    "benchmark-contamination",
    "Benchmark Contamination and Decontamination",
    "evals-and-benchmarks",
    25,
    "2026-11-14",
    ["evals", "benchmarks", "contamination"]
  ),
  mk(
    "async-rl",
    "Asynchronous RL for LLMs",
    "model-capability-and-training",
    18,
    "2026-11-02",
    ["rl", "training"]
  ),
  mk(
    "harness-noise",
    "Harness Swap vs. Rerun Noise",
    "evals-and-benchmarks",
    9,
    "2026-10-27",
    ["evals"],
    "Essay"
  ),
];
const navigable = new Set(["agents", "evals"]);

export const Comfortable = () => (
  <ol className="m-0 list-none p-0" style={{ width: 760 }}>
    {articles.map((a, i) => (
      <IndexRow
        accent="var(--domain-agent-systems)"
        article={a}
        first={i === 0}
        key={a.slug}
        navigable={navigable}
        ordinal={i + 1}
        prefix="C"
      />
    ))}
  </ol>
);

export const CompactSingleDomain = () => (
  <ol className="m-0 list-none p-0" style={{ width: 760 }}>
    {[articles[1], articles[3]].map((a, i) => (
      <IndexRow
        accent="var(--domain-evals-and-benchmarks)"
        article={a}
        density="compact"
        first={i === 0}
        key={a.slug}
        navigable={navigable}
        ordinal={i + 1}
        showDomain={false}
      />
    ))}
  </ol>
);

export const Bare = () => (
  <ol className="m-0 list-none p-0" style={{ width: 760 }}>
    {articles.slice(0, 2).map((a, i) => (
      <IndexRow
        accent="var(--brand)"
        article={a}
        first={i === 0}
        key={a.slug}
        ordinal={i + 1}
        showChips={false}
        showSave={false}
      />
    ))}
  </ol>
);
