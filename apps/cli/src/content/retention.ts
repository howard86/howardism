const STORED_KEY =
  /^(?:objects\/v1\/sha256\/[a-f0-9]{2}\/[a-f0-9]{64}|releases\/v1\/[a-f0-9]{64}\.json)$/;

import type { ContentRelease } from "@howardism/article-contract/manifests/content-release";
import { objectKey, releaseKey } from "./release";

/** Mark only. Deletion requires a separately reviewed complete bucket inventory. */
export function retentionPlan(
  releases: { digest: string; release: ContentRelease }[],
  inventory: { key: string; modifiedAt: string; bytes: number }[],
  graceBefore: Date
) {
  if (!(releases.length && Number.isFinite(graceBefore.getTime()))) {
    throw new Error(
      "Retention needs retained releases and a valid grace cutoff"
    );
  }
  const keep = new Set<string>();
  for (const { digest, release } of releases) {
    keep.add(releaseKey(digest));
    for (const file of release.files) {
      keep.add(objectKey(file.objectSha256));
    }
  }
  const candidates = inventory.filter(
    (object) =>
      !keep.has(object.key) &&
      STORED_KEY.test(object.key) &&
      new Date(object.modifiedAt) < graceBefore
  );
  return {
    retainedReleases: releases.map((r) => r.digest),
    candidates,
    reclaimableBytes: candidates.reduce(
      (bytes, object) => bytes + object.bytes,
      0
    ),
  };
}
