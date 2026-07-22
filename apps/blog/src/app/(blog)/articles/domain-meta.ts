import { WIKI_DOMAINS } from "@howardism/article-contract";

import type { ArticleDomain } from "./service";

export interface DomainMeta {
  /** Short marketing-y line under the domain headline / on the route page. */
  blurb: string;
  /** CSS color token reference for dots, numerals, and rules. */
  color: string;
  /** Display label. */
  label: string;
  /** Meta-description for `/articles/domain/[domain]` SEO. */
  metaDescription: string;
}

/**
 * Display metadata for the fifteen curated knowledge domains. Order drives the
 * home plate stack. Colors reference the `--domain-*` tokens in `@howardism/ui`.
 * The domains themselves are sourced from the vault's MOC pages by the importer.
 */
export const DOMAIN_META: Record<ArticleDomain, DomainMeta> = {
  "agent-systems": {
    label: "Agent Systems",
    blurb:
      "Agent harnesses, loop engineering, and scaffolding for LLM systems.",
    color: "var(--domain-agent-systems)",
    metaDescription:
      "Agent Systems notes — harness engineering, loop design, and the scaffolding patterns behind LLM agents from the Howardism wiki.",
  },
  "agent-security": {
    label: "Agent Security",
    blurb: "Prompt injection, agent identity, and securing autonomous agents.",
    color: "var(--domain-agent-security)",
    metaDescription:
      "Agent Security notes — prompt injection, agent identity, zero trust, and defending autonomous agents from the Howardism wiki.",
  },
  "ai-coding-practice": {
    label: "AI Coding Practice",
    blurb:
      "Workflow, review discipline, and verification practice for AI-native teams.",
    color: "var(--domain-ai-coding-practice)",
    metaDescription:
      "AI Coding Practice notes — workflow, code review, and verification discipline for AI-native engineering teams from the Howardism wiki.",
  },
  "evals-and-benchmarks": {
    label: "Evals & Benchmarks",
    blurb:
      "Benchmark design, contamination, LLM judges, and measuring capability.",
    color: "var(--domain-evals-and-benchmarks)",
    metaDescription:
      "Evals & Benchmarks notes — benchmark design, contamination, LLM-as-judge methods, and measuring real model capability from the Howardism wiki.",
  },
  "model-capability-and-training": {
    label: "Model Capability & Training",
    blurb:
      "Training, scaling laws, test-time compute, and frontier capability.",
    color: "var(--domain-model-capability-and-training)",
    metaDescription:
      "Model Capability & Training notes — training methods, scaling laws, test-time compute, and frontier model capability from the Howardism wiki.",
  },
  "alignment-and-safety": {
    label: "Alignment & Safety",
    blurb: "Alignment training, misalignment evals, and reward hacking.",
    color: "var(--domain-alignment-and-safety)",
    metaDescription:
      "Alignment & Safety notes — alignment fine-tuning, misalignment evals, reward hacking, and model welfare from the Howardism wiki.",
  },
  interpretability: {
    label: "Interpretability",
    blurb: "Reading model internals: activations and the global workspace.",
    color: "var(--domain-interpretability)",
    metaDescription:
      "Interpretability notes — reading model internals, activation monitoring, and the LLM global workspace from the Howardism wiki.",
  },
  "interaction-multimodal": {
    label: "Interaction & Multimodal",
    blurb: "Real-time, multimodal, full-duplex, and human-AI collaboration.",
    color: "var(--domain-interaction-multimodal)",
    metaDescription:
      "Interaction & Multimodal notes — real-time multimodal models, full-duplex interfaces, and human-AI collaboration.",
  },
  "formal-math": {
    label: "Formal Math",
    blurb: "Proof search, Lean, and verifier-driven mathematics.",
    color: "var(--domain-formal-math)",
    metaDescription:
      "Formal Mathematics notes — LLM proof search, Lean verification, and verifier-driven mathematics from the Howardism wiki.",
  },
  "startup-founder": {
    label: "Startup & Founder",
    blurb: "Building AI-native companies: speed, moats, and lifecycle.",
    color: "var(--domain-startup-founder)",
    metaDescription:
      "Startup & Founder notes — building AI-native companies: speed, moats, lifecycle, and discipline from the Howardism wiki.",
  },
  "product-org": {
    label: "Product & Org",
    blurb: "Product cadence, org design, and the AI-native team.",
    color: "var(--domain-product-org)",
    metaDescription:
      "Product & Organization notes — product cadence, org design, and the AI-native team from the Howardism wiki.",
  },
  "ai-economics-and-labor": {
    label: "AI Economics & Labor",
    blurb: "Work, wages, org design, and the economics of AI-driven labor.",
    color: "var(--domain-ai-economics-and-labor)",
    metaDescription:
      "AI Economics & Labor notes — how AI reshapes work, wages, organizations, and the labor market from the Howardism wiki.",
  },
  "superintelligence-trajectory": {
    label: "Superintelligence Trajectory",
    blurb: "Recursive self-improvement, scaling limits, and the path to ASI.",
    color: "var(--domain-superintelligence-trajectory)",
    metaDescription:
      "Superintelligence Trajectory notes — recursive self-improvement, scaling limits, and the pathways from AGI to ASI from the Howardism wiki.",
  },
  entities: {
    label: "Entities",
    blurb: "Profiles of the people, labs, products, and projects.",
    color: "var(--domain-entities)",
    metaDescription:
      "Entity profiles — the people, labs, products, and projects shaping the Howardism notebook.",
  },
  syntheses: {
    label: "Syntheses",
    blurb: "Cross-cutting essays that weave the domains together.",
    color: "var(--domain-syntheses)",
    metaDescription:
      "Syntheses — longer-form, cross-cutting essays that weave multiple domains together from the Howardism wiki.",
  },
};

/** Domain display order — the canonical list, re-exported for plate consumers. */
export const DOMAIN_ORDER = WIKI_DOMAINS;

/**
 * Resolve a (possibly user-supplied) URL segment to a canonical domain.
 * Returns `null` for unknown slugs so callers can `notFound()`.
 */
export function resolveDomain(rawSlug: string): ArticleDomain | null {
  const slug = rawSlug.toLowerCase();
  return (DOMAIN_ORDER as readonly string[]).includes(slug)
    ? (slug as ArticleDomain)
    : null;
}
