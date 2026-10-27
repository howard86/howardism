import {
  ContentLockSchema,
  type ContentRelease,
  ContentReleaseSchema,
  digestSchema,
} from "@howardism/article-contract/manifests/content-release";
import { runWithConcurrency } from "../concurrency";
import { objectKey, packageRelease, releaseKey, sha256 } from "./release";
import type { ObjectStore } from "./store";
import { validateSnapshot } from "./validate";
import {
  assertFullContentRoot,
  maintenanceLockPath,
  requireAuthoringRoot,
  withDirectoryLock,
  withSnapshot,
} from "./workspace";

export async function loadRelease(
  store: ObjectStore,
  digest: string
): Promise<ContentRelease> {
  ContentLockSchema.parse({ schemaVersion: 1, releaseSha256: digest });
  const bytes = await store.get(releaseKey(digest), 32 * 1024 * 1024);
  if (sha256(bytes) !== digest) {
    throw new Error("Release manifest checksum mismatch");
  }
  return ContentReleaseSchema.parse(
    JSON.parse(Buffer.from(bytes).toString("utf8"))
  );
}

async function putVerifiedObject(
  store: ObjectStore,
  digest: string,
  bytes: Uint8Array
): Promise<void> {
  const result = await store.putIfAbsent(objectKey(digest), bytes);
  if (result) {
    if (result.sha256 !== digest || result.bytes !== bytes.length) {
      throw new Error(`Uploaded object failed verification: ${digest}`);
    }
    return;
  }
  const remote = await store.head(objectKey(digest));
  if (remote?.sha256 !== digest || remote.bytes !== bytes.length) {
    throw new Error(`Uploaded object failed verification: ${digest}`);
  }
}

function assertDeletionThreshold(
  base: ContentRelease,
  changes: ReturnType<typeof articleChanges>,
  allowLargeDeletion: boolean
): void {
  for (const [locale, change] of Object.entries(changes)) {
    const threshold = Math.max(
      3,
      Math.floor(base.counts.articlesByLocale[locale as "en" | "zh-TW"] * 0.1)
    );
    if (change.removed.length > threshold && !allowLargeDeletion) {
      throw new Error(
        `Large deletion in ${locale}; review changes and use --allow-large-deletion explicitly`
      );
    }
  }
}

function publishConcurrency(): number {
  const concurrency = Number(process.env.CONTENT_DOWNLOAD_CONCURRENCY ?? 16);
  if (
    !Number.isSafeInteger(concurrency) ||
    concurrency < 1 ||
    concurrency > 32
  ) {
    throw new Error("Invalid content concurrency");
  }
  return concurrency;
}

export function articleChanges(
  base: ContentRelease,
  candidate: ContentRelease
) {
  const changes: Record<
    string,
    { added: string[]; changed: string[]; removed: string[] }
  > = {};
  for (const [locale, prefix] of [
    ["en", "content/articles/"],
    ["zh-TW", "content/articles-zh-TW/"],
  ]) {
    const before = new Map(
      base.files
        .filter((f) => f.path.startsWith(prefix))
        .map((f) => [f.path, f.decodedSha256])
    );
    const after = new Map(
      candidate.files
        .filter((f) => f.path.startsWith(prefix))
        .map((f) => [f.path, f.decodedSha256])
    );
    changes[locale] = {
      added: [...after.keys()].filter((path) => !before.has(path)),
      changed: [...after.keys()].filter(
        (path) => before.has(path) && before.get(path) !== after.get(path)
      ),
      removed: [...before.keys()].filter((path) => !after.has(path)),
    };
  }
  return changes;
}

export async function publishContent(options: {
  root: string;
  profile?: "full" | "sample";
  store: ObjectStore;
  baseDigest?: string;
  initial?: boolean;
  allowLargeDeletion?: boolean;
  expectedDigest?: string;
  maintenanceRoot?: string;
}): Promise<string> {
  const root = requireAuthoringRoot(options.root);
  await assertFullContentRoot(root);
  if (options.expectedDigest !== undefined && !options.maintenanceRoot) {
    throw new Error("Packed candidates require a shared maintenance root");
  }
  if (options.expectedDigest !== undefined) {
    digestSchema.parse(options.expectedDigest);
  }
  if (options.profile === "sample") {
    throw new Error("Publisher rejects CONTENT_PROFILE=sample");
  }
  if (!(options.baseDigest || options.initial)) {
    throw new Error("Publishing requires a base release or explicit --initial");
  }
  return await withDirectoryLock(
    await maintenanceLockPath(options.maintenanceRoot ?? root),
    async () =>
      await withSnapshot(root, async (snapshot) => {
        await validateSnapshot(snapshot, "full");
        const packaged = await packageRelease(snapshot);
        if (
          options.expectedDigest !== undefined &&
          packaged.digest !== options.expectedDigest
        ) {
          throw new Error("Packed candidate changed before publication");
        }
        if (options.baseDigest) {
          const base = await loadRelease(options.store, options.baseDigest);
          const changes = articleChanges(base, packaged.release);
          process.stdout.write(`${JSON.stringify(changes, null, 2)}\n`);
          assertDeletionThreshold(
            base,
            changes,
            options.allowLargeDeletion ?? false
          );
        }
        await runWithConcurrency(
          [...packaged.objects.entries()],
          publishConcurrency(),
          async ([digest, bytes]) =>
            await putVerifiedObject(options.store, digest, bytes)
        );
        await options.store.putIfAbsent(
          releaseKey(packaged.digest),
          packaged.bytes
        );
        await loadRelease(options.store, packaged.digest);
        return packaged.digest;
      })
  );
}
