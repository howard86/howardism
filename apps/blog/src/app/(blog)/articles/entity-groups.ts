import type { EntityType } from "@howardism/article-contract";

import type { ArticleEntity } from "./service";

export interface EntityGroup {
  articles: ArticleEntity[];
  /** Display heading; `undefined` for the trailing ungrouped bucket. */
  label: string | undefined;
  /** The discriminant. Branch on this, never on `label` — that's display copy. */
  type: EntityType | undefined;
}

const ENTITY_TYPE_LABELS: Record<EntityType, string> = {
  person: "People",
  organization: "Organizations",
  software: "Software",
  model: "Models",
  document: "Documents",
};

/**
 * Group Entity-tagged articles by their vault-sourced `entityType`, ordered
 * by member count descending so the taxonomy self-corrects as the vault
 * grows. Within a group, articles sort alphabetically by title — except
 * `model`, which sorts by date descending, since the model lineup reads as a
 * timeline rather than a glossary. Articles with no `entityType` render in a
 * trailing, unlabeled group so nothing silently drops off the page.
 */
export function groupEntityArticles(
  articles: readonly ArticleEntity[]
): EntityGroup[] {
  const byType = new Map<EntityType, ArticleEntity[]>();
  const untyped: ArticleEntity[] = [];

  for (const article of articles) {
    const type = article.meta.entityType;
    if (!type) {
      untyped.push(article);
      continue;
    }
    const bucket = byType.get(type);
    if (bucket) {
      bucket.push(article);
    } else {
      byType.set(type, [article]);
    }
  }

  const groups: EntityGroup[] = [...byType.entries()]
    .map(([type, members]) => ({
      type,
      label: ENTITY_TYPE_LABELS[type],
      articles: sortGroup(type, members),
    }))
    .sort((a, b) => b.articles.length - a.articles.length);

  if (untyped.length > 0) {
    groups.push({
      type: undefined,
      label: undefined,
      articles: sortByTitle(untyped),
    });
  }

  return groups;
}

/** Screen-reader caption for a single group's list. */
export function describeEntityGroup(group: EntityGroup): string {
  if (!group.type) {
    return "Entities with no recorded type, alphabetical.";
  }
  return group.type === "model"
    ? `${group.label}, newest first.`
    : `${group.label}, alphabetical.`;
}

function sortGroup(
  type: EntityType,
  members: ArticleEntity[]
): ArticleEntity[] {
  return type === "model" ? sortByDateDesc(members) : sortByTitle(members);
}

function sortByTitle(members: ArticleEntity[]): ArticleEntity[] {
  return [...members].sort((a, b) => a.meta.title.localeCompare(b.meta.title));
}

function sortByDateDesc(members: ArticleEntity[]): ArticleEntity[] {
  return [...members].sort(
    (a, b) => new Date(b.meta.date).valueOf() - new Date(a.meta.date).valueOf()
  );
}
