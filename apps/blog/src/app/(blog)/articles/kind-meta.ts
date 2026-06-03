import type { TagSectionSlug } from "./tag-sections";

export interface KindMeta {
  /** Accent color token for the kind. */
  color: string;
  /** Single-letter prefix used in the plate numbering (C01, E02, …). */
  prefix: string;
}

/**
 * Per-kind vocabulary — a letter prefix and accent color token — keyed by the
 * lowercase section slug (which matches `WikiTag` lowercased). Shared by the
 * home plate stack and the search palette so both stay in lockstep.
 */
export const KIND_META: Record<TagSectionSlug, KindMeta> = {
  concept: { prefix: "C", color: "var(--brand)" },
  entity: { prefix: "E", color: "var(--domain-entities)" },
  essay: { prefix: "S", color: "var(--domain-syntheses)" },
  index: { prefix: "I", color: "var(--foreground-subtle)" },
};
