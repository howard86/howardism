/**
 * Link to a subject tag's `/articles/tagged/[tag]` page. The segment is
 * encoded because a few wiki tags carry a `/` (e.g. `type/entity`), which Next
 * prerenders as `%2F` and must be linked the same way to resolve to the single
 * dynamic segment.
 */
export const taggedHref = (tag: string): string =>
  `/articles/tagged/${encodeURIComponent(tag)}`;
