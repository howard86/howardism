import { ARTICLE_DOMAINS, type ArticleDomain } from "./service";

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
 * Display metadata for the nine curated knowledge domains. Order drives the
 * home plate stack. Colors reference the `--domain-*` tokens in `@howardism/ui`.
 * The domains themselves are sourced from the vault's MOC pages by the importer.
 */
export const DOMAIN_META: Record<ArticleDomain, DomainMeta> = {
  "ai-engineering": {
    label: "AI Engineering",
    blurb:
      "Agent harnesses, loops, tooling, and the craft of building with LLMs.",
    color: "var(--domain-ai-engineering)",
    metaDescription:
      "AI Engineering notes — agent harnesses, loops, orchestration, and the craft of building with LLMs from the Howardism wiki.",
  },
  "llm-architecture": {
    label: "LLM Architecture",
    blurb: "Model internals, training, scaling, alignment, and evaluation.",
    color: "var(--domain-llm-architecture)",
    metaDescription:
      "LLM Architecture notes — model internals, training, scaling laws, alignment, and evaluation from the Howardism wiki.",
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
  "governance-workforce": {
    label: "Governance & Workforce",
    blurb: "Policy, workforce shifts, and the economics of AI labor.",
    color: "var(--domain-governance-workforce)",
    metaDescription:
      "Governance & Workforce notes — policy, workforce shifts, and the economics of AI labor from the Howardism wiki.",
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
export const DOMAIN_ORDER = ARTICLE_DOMAINS;

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
