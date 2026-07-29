import type { OpenQuestion } from "@howardism/article-contract/manifests/open-questions";

/**
 * The buckets the `/questions` worklist filters by: the vault's four `#oq/*`
 * triage tags, plus the two states the tags cannot express — a bullet the vault
 * never tagged, and a question it has since settled.
 */
export type TriageBucket =
  | "now"
  | "source"
  | "wait"
  | "note"
  | "untriaged"
  | "resolved";

export interface TriageMeta {
  /** Marginal code stamped on the line; empty means the line carries none. */
  code: string;
  label: string;
  /**
   * Ink for the code and the tally rule. One red for the answerable bucket,
   * the ink ramp for the parked ones, verdigris for the settled counterweight.
   */
  tone: string;
}

export const TRIAGE_META: Record<TriageBucket, TriageMeta> = {
  now: { code: "Now", label: "Answerable now", tone: "var(--brand)" },
  source: {
    code: "Source",
    label: "Needs a source",
    tone: "var(--foreground)",
  },
  wait: {
    code: "Wait",
    label: "Awaiting the event",
    tone: "var(--muted-foreground)",
  },
  note: {
    code: "Note",
    label: "Unfiled note",
    tone: "var(--foreground-subtle)",
  },
  untriaged: { code: "", label: "Untriaged", tone: "var(--foreground-subtle)" },
  resolved: { code: "Resolved", label: "Resolved", tone: "var(--brand-2)" },
};

/** Display order of the buckets, live work first and settled work last. */
export const TRIAGE_ORDER: TriageBucket[] = [
  "now",
  "source",
  "wait",
  "note",
  "untriaged",
  "resolved",
];

/** An untagged bullet is recorded as untriaged rather than guessed into a tag. */
export const bucketOf = (question: OpenQuestion): TriageBucket =>
  question.kind ?? "untriaged";
