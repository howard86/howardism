import { describe, expect, it } from "bun:test";

import { rewriteWikilinks } from "../import-wiki/transform.ts";
import {
  extractInternalSlugs,
  extractLinkOccurrences,
  extractRawSlugs,
  stripToText,
  tokenizeWikilinks,
} from "../import-wiki/wikilink.ts";

// Public article-body leaks observed on 2026-10-21. Code spans are
// reconstructed from rendered <code> elements; source wraps are retained.
const LIVE_ALIASES = [
  {
    article: "acceleration-whiplash",
    target: "follow-up-fixes-on-agent-prs",
    label: "Takerngsaksiri et al. (arXiv 2609.26847, `empirical`)",
  },
  {
    article: "agent-vendor-heterogeneity",
    target: "follow-up-fixes-on-agent-prs",
    label: "Takerngsaksiri, Duong & Barnett (arXiv 2609.26847, `empirical`)",
  },
  {
    article: "agentic-prompt-injection",
    target: "agent-context-files",
    label: "`CLAUDE.md`",
  },
  {
    article: "ai-accelerated-offense",
    target: "raw/aisi-kimi-k3-cyber-assessment",
    label: "UK AISI and US CAISI's joint\nassessment",
  },
  {
    article: "autonomous-defense",
    target: "telemetry-vs-survey-measurement",
    label: "DX's\nState of AI Impact",
  },
  {
    article: "autonomous-defense",
    target: "derivedhuman-review-real-control-or-rubber-stamp",
    label: "The\noversight synthesis",
  },
  {
    article: "caisi",
    target: "uk-ai-security-institute",
    label: "UK AI Security\nInstitute",
  },
  {
    article: "cognitive-capability-profiling",
    target: "raw/cognitive-capability-profiles-ai-task-suitability",
    label: "arXiv\n2608.25623",
  },
  {
    article: "compute-controlled-benchmarking",
    target: "raw/optstop-bayesian-optimal-stopping-llm-evaluations",
    label: "`optstop`",
  },
  {
    article: "context-advantage-over-taste",
    target: "agent-context-files",
    label: "`CLAUDE.md` and `AGENTS.md`",
  },
  {
    article: "evals-as-product-spec",
    target: "ai-assisted-error-analysis",
    label: "Shreya Shankar's\nerror-analysis workflow",
  },
  {
    article: "evaluation-horizon-vs-release-cadence",
    target: "navier-stokes-ai-claim",
    label:
      "a claimed resolution of the Navier–Stokes\nMillennium Prize problem",
  },
  {
    article: "frontiermath-erdos-benchmark",
    target: "navier-stokes-ai-claim",
    label: "OpenAI's\nNavier–Stokes announcement",
  },
  {
    article: "group-relative-policy-optimization",
    target: "staleness-learning-rate-scaling",
    label: "`Sη` for whether, `Tη` for when",
  },
  {
    article: "llm-driven-vulnerability-research",
    target: "raw/trailofbits-goal-patch-the-planet",
    label:
      "Trail of Bits' account of using Codex's `/goal` during Patch the Planet",
  },
  {
    article: "logical-vs-intelligible-proof",
    target: "navier-stokes-ai-claim",
    label: "OpenAI's Navier–Stokes\nannouncement",
  },
  {
    article: "measuring-beyond-accuracy-saturation",
    target: "adaptive-stopping-in-evaluation-sampling",
    label: "AISI's `optstop`",
  },
  {
    article: "measuring-beyond-accuracy-saturation",
    target: "raw/atlas-adaptive-testing-llm-evaluation",
    label: "Li, Tang, … Chawla,\nNotre Dame, arXiv 2511.04689",
  },
  {
    article: "memory-and-context-poisoning",
    target: "agent-context-files",
    label: "`CLAUDE.md` / `AGENTS.md` / `core/behaviors.md` / `knowledge/*.md`",
  },
  {
    article: "memory-poisoning-numbers-conditioned-on-the-write",
    target: "agent-context-files",
    label: "`CLAUDE.md`-class files",
  },
  {
    article: "risk-tiered-auto-approval",
    target: "raw/claude-accenture-pilot-to-production",
    label: "Deploying AI from pilot\nto production",
  },
  {
    article: "trained-calibration",
    target: "verbalized-confidence-judge-scoring",
    label: "Hsiao (Cisco, arXiv 2609.10996, 2026-09-10, `empirical`)",
  },
];

describe("published wikilink aliases", () => {
  for (const { article, target, label } of LIVE_ALIASES) {
    it(`resolves ${article}: ${target}`, () => {
      const source = `[[${target}|${label}]]`;
      const raw = target.startsWith("raw/");
      const slug = raw ? target.slice(4) : target;
      const href = raw ? `https://example.com/${slug}` : `/articles/${slug}`;
      const known = new Map([[slug, "Article title"]]);
      const rawIndex = new Map([
        [slug, { slug, title: "Source title", url: href }],
      ]);
      expect(rewriteWikilinks(source, known, rawIndex)).toEqual({
        body: `[${label}](${href})`,
        hasInternalLink: !raw,
        unresolved: [],
      });
      expect(rewriteWikilinks(source, new Map())).toEqual({
        body: label,
        hasInternalLink: false,
        unresolved: raw ? [] : [slug],
      });
      expect(stripToText(source)).toBe(label);
      expect(tokenizeWikilinks(source)).toHaveLength(1);
      expect(extractInternalSlugs(source)).toEqual(raw ? [] : [slug]);
      expect(extractRawSlugs(source)).toEqual(raw ? [slug] : []);
      expect(
        extractLinkOccurrences(source).map(({ slug: linked }) => linked)
      ).toEqual(raw ? [] : [slug]);
    });
  }

  it("keeps pipes and markdown punctuation inside code labels", () => {
    const label = "`a | b` / ``path/* with `ticks` ``";
    const source = `[[known\\|${label}]]`;
    expect(rewriteWikilinks(source, new Map([["known", "Known"]])).body).toBe(
      `[${label}](/articles/known)`
    );
  });

  it("does not turn quoted aliases into links or graph edges", () => {
    const source = [
      "`` [[known|`code`]] ``",
      "```md",
      "[[known|`code`]]",
      "```",
      "~~~md",
      "[[known|`code`]]",
      "~~~",
    ].join("\n");
    expect(rewriteWikilinks(source, new Map([["known", "Known"]])).body).toBe(
      source
    );
    expect(tokenizeWikilinks(source)).toEqual([]);
    expect(extractLinkOccurrences(source)).toEqual([]);
  });

  it("records code-labelled links and readable backlink context", () => {
    const source =
      "This sufficiently long prose explains why [[known|`CLAUDE.md` and `AGENTS.md`]] matter for agent context.";
    expect(extractLinkOccurrences(source)).toEqual([
      {
        slug: "known",
        count: 1,
        context:
          "This sufficiently long prose explains why CLAUDE.md and AGENTS.md matter for agent context.",
      },
    ]);
  });

  it("does not let truncated targets or aliases consume later links", () => {
    for (const truncated of ["[[truncated", "[[truncated|label"]) {
      const source = `${truncated}\n[[known|real link]]`;
      expect(rewriteWikilinks(source, new Map([["known", "Known"]])).body).toBe(
        `${truncated}\n[real link](/articles/known)`
      );
    }
    expect(tokenizeWikilinks("[[truncated|label\n\nclosing prose]]")).toEqual(
      []
    );
  });
});
