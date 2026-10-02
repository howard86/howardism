import { digestSchema } from "@howardism/article-contract/manifests/content-release";
import { z } from "zod";
import { loadRelease } from "./publish";
import { sha256 } from "./release";
import { retentionPlan } from "./retention";
import type { MaintenanceStore } from "./store";
import { maintenanceLockPath, withDirectoryLock } from "./workspace";

export const PublicationLedgerSchema = z.strictObject({
  current: digestSchema,
  releases: z
    .array(
      z.strictObject({
        digest: digestSchema,
        publishedAt: z.iso.datetime(),
        rollback: z.boolean().default(false),
        candidate: z.boolean().default(false),
      })
    )
    .min(1),
  gcApproved: z.boolean().default(false),
});
export type PublicationLedger = z.infer<typeof PublicationLedgerSchema>;
export function protectedDigests(
  ledger: PublicationLedger,
  now: Date
): string[] {
  const ordered = [...ledger.releases].sort((a, b) =>
    b.publishedAt.localeCompare(a.publishedAt)
  );
  const cutoff = now.getTime() - 90 * 24 * 60 * 60 * 1000;
  if (!ordered.some((r) => r.digest === ledger.current)) {
    throw new Error("Current release is absent from publication ledger");
  }
  const previous = new Set<string>();
  const protectedSet = new Set<string>([ledger.current]);
  for (const release of ordered) {
    if (
      release.digest !== ledger.current &&
      !release.candidate &&
      previous.size < 10
    ) {
      previous.add(release.digest);
      protectedSet.add(release.digest);
    }
    if (
      Date.parse(release.publishedAt) >= cutoff ||
      release.rollback ||
      release.candidate
    ) {
      protectedSet.add(release.digest);
    }
  }
  return [...protectedSet].sort();
}

export async function planGarbageCollection(
  store: MaintenanceStore,
  ledger: PublicationLedger,
  now = new Date()
) {
  const releases = await Promise.all(
    protectedDigests(ledger, now).map(async (digest) => ({
      digest,
      release: await loadRelease(store, digest),
    }))
  );
  const graceBefore = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  return {
    schemaVersion: 1 as const,
    ledgerSha256: sha256(JSON.stringify(ledger)),
    graceBefore: graceBefore.toISOString(),
    ...retentionPlan(releases, await store.list(), graceBefore),
  };
}

export async function applyGarbageCollection(options: {
  store: MaintenanceStore;
  ledgerPath: string;
  planPath: string;
  approvedPlanSha256: string;
  maintenanceRoot: string;
  publicationFrozen: boolean;
}): Promise<void> {
  if (!options.publicationFrozen) {
    throw new Error(
      "GC requires an explicit publication freeze on every publisher host"
    );
  }
  await withDirectoryLock(
    await maintenanceLockPath(options.maintenanceRoot),
    async () => {
      const ledger = PublicationLedgerSchema.parse(
        await Bun.file(options.ledgerPath).json()
      );
      if (!ledger.gcApproved) {
        throw new Error(
          "G6 retention activation is not approved in the publication ledger"
        );
      }
      const bytes = await Bun.file(options.planPath).text();
      if (sha256(bytes) !== digestSchema.parse(options.approvedPlanSha256)) {
        throw new Error("GC approval digest does not match the reviewed plan");
      }
      const reviewed = JSON.parse(bytes);
      if (
        reviewed.schemaVersion !== 1 ||
        reviewed.ledgerSha256 !== sha256(JSON.stringify(ledger))
      ) {
        throw new Error("GC plan is stale");
      }
      const cutoff = new Date(reviewed.graceBefore);
      if (
        !Number.isFinite(cutoff.getTime()) ||
        cutoff.getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000
      ) {
        throw new Error("GC grace cutoff is invalid");
      }
      const releases = await Promise.all(
        protectedDigests(ledger, new Date()).map(async (digest) => ({
          digest,
          release: await loadRelease(options.store, digest),
        }))
      );
      const fresh = retentionPlan(releases, await options.store.list(), cutoff);
      if (
        JSON.stringify(fresh.retainedReleases) !==
          JSON.stringify(reviewed.retainedReleases) ||
        JSON.stringify(fresh.candidates) !== JSON.stringify(reviewed.candidates)
      ) {
        throw new Error(
          "GC inventory or protected releases changed; regenerate and review the plan"
        );
      }
      // Re-read immediately before deletion; the documented global publication freeze protects other hosts.
      if (
        sha256(
          JSON.stringify(
            PublicationLedgerSchema.parse(
              await Bun.file(options.ledgerPath).json()
            )
          )
        ) !== reviewed.ledgerSha256
      ) {
        throw new Error("Publication ledger changed during GC");
      }
      for (const object of fresh.candidates) {
        // biome-ignore lint/performance/noAwaitInLoops: Keep deletion ordered and stop immediately on a provider failure.
        await options.store.delete(object.key);
      }
      process.stdout.write(
        `${JSON.stringify({ deletedObjects: fresh.candidates.length, deletedBytes: fresh.reclaimableBytes })}\n`
      );
    }
  );
}
