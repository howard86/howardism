import { surfaceHash, verbatimDiffers } from "../surface.ts";

/**
 * Per-slug freshness verdict, derived purely from text + the recorded hash:
 * - `missing`       — no output file yet.
 * - `fresh`         — surface hash matches the recorded hash and verbatim
 *                     fields agree; nothing to do.
 * - `stale`         — translatable surface changed (or never recorded);
 *                     needs a paid re-translation.
 * - `verbatim-drift`— surface unchanged but a copy-verbatim scalar drifted;
 *                     fixable by a cheap frontmatter re-sync, no engine.
 * - `orphan`        — output exists but the source is gone.
 */
export type TranslationStatus =
  | "missing"
  | "fresh"
  | "stale"
  | "verbatim-drift"
  | "orphan";

export interface ClassifyArgs {
  /** Raw output MDX, or null when no translation has been written. */
  outputText: string | null;
  /** Recorded translatable-surface hash from translations.json, or null. */
  recordedHash: string | null;
  /** Raw source MDX, or null when the source file no longer exists. */
  sourceText: string | null;
}

/** Pure classifier — no IO, so the state machine is unit-testable directly. */
export function classifyArticle(args: ClassifyArgs): TranslationStatus {
  const { sourceText, outputText, recordedHash } = args;
  if (sourceText === null) {
    return "orphan";
  }
  if (outputText === null) {
    return "missing";
  }
  if (recordedHash === null || recordedHash !== surfaceHash(sourceText)) {
    return "stale";
  }
  if (verbatimDiffers(sourceText, outputText)) {
    return "verbatim-drift";
  }
  return "fresh";
}

/** States that mean "out of date" — `translate --check` fails the build on these. */
export const ACTIONABLE_STATUSES: readonly TranslationStatus[] = [
  "missing",
  "stale",
  "verbatim-drift",
  "orphan",
];
