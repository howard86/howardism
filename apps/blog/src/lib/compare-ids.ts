/** Most articles a single comparison can hold. */
export const MAX_COMPARE = 3;

/**
 * Resolve the `?ids=` query value into a clean, ordered slug list for the
 * compare view. Parses the comma-separated value, keeps only currently-known
 * slugs in first-seen order, collapses duplicates, and caps the set at
 * {@link MAX_COMPARE}. Empty or garbage input yields an empty list, so the
 * route never errors on bad input.
 */
export function resolveCompareIds(
  rawIds: string | string[] | undefined,
  knownSlugs: ReadonlySet<string>
): string[] {
  if (!rawIds) {
    return [];
  }
  const raw = Array.isArray(rawIds) ? rawIds.join(",") : rawIds;
  const result: string[] = [];
  for (const part of raw.split(",")) {
    const slug = part.trim();
    if (slug.length === 0 || !knownSlugs.has(slug) || result.includes(slug)) {
      continue;
    }
    result.push(slug);
    if (result.length === MAX_COMPARE) {
      break;
    }
  }
  return result;
}
