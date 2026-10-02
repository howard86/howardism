/** biome-ignore-all lint/performance/noAwaitInLoops: Fixture packaging and writes are ordered and bounded. */
import { cp, lstat, mkdir, mkdtemp, rename, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import {
  SAMPLE_LOCK_FILE,
  SampleLockSchema,
} from "@howardism/article-contract/manifests/sample-release";
import { runWithConcurrency } from "../concurrency";
import { BLOG_ROOT } from "./paths";
import { prepareContent } from "./prepare";
import { sha256 } from "./release";
import { publicFixtureStore } from "./sample-public";
import {
  loadSampleRelease,
  packageSampleRelease,
  sampleObjectKey,
  sampleReleaseKey,
} from "./sample-release";
import type { ObjectStore } from "./store";
import { validateSnapshot } from "./validate";
import { withDirectoryLock } from "./workspace";

const sampleMaintenanceLock = (root: string): string =>
  `${resolve(root)}.sample-maintenance-lock`;

/** Freeze content and coverage together so a release cannot mix two fixture revisions. */
async function withSampleSnapshot<T>(
  root: string,
  operation: (snapshot: string) => Promise<T>
): Promise<T> {
  const scratch = await mkdtemp(resolve(tmpdir(), "howardism-sample-"));
  try {
    const before = await packageSampleRelease(root);
    const snapshot = resolve(scratch, "snapshot");
    await mkdir(snapshot);
    for (const name of ["content", "data"]) {
      await cp(resolve(root, name), resolve(snapshot, name), {
        recursive: true,
        dereference: false,
      });
    }
    await cp(
      resolve(root, "coverage.json"),
      resolve(snapshot, "coverage.json"),
      { dereference: false }
    );
    const [copied, after] = await Promise.all([
      packageSampleRelease(snapshot),
      packageSampleRelease(root),
    ]);
    if (before.digest !== copied.digest || before.digest !== after.digest) {
      throw new Error(
        "Sample content changed while snapshotting; stop writers and retry"
      );
    }
    await validateSnapshot(snapshot, "sample");
    return await operation(snapshot);
  } finally {
    await rm(scratch, { recursive: true, force: true });
  }
}

export async function packSample(
  root: string,
  destination: string
): Promise<string> {
  const dest = resolve(destination);
  try {
    await lstat(dest);
    throw new Error("Sample pack destination already exists");
  } catch (error) {
    if (
      !(
        error &&
        typeof error === "object" &&
        "code" in error &&
        error.code === "ENOENT"
      )
    ) {
      throw error;
    }
  }
  return await withDirectoryLock(
    sampleMaintenanceLock(root),
    async () =>
      await withSampleSnapshot(root, async (snapshot) => {
        const packaged = await packageSampleRelease(snapshot);
        await mkdir(dest, { recursive: true });
        for (const [digest, bytes] of packaged.objects) {
          const path = resolve(dest, sampleObjectKey(digest));
          await mkdir(dirname(path), { recursive: true });
          await Bun.write(path, bytes);
        }
        const manifestPath = resolve(dest, sampleReleaseKey(packaged.digest));
        await mkdir(dirname(manifestPath), { recursive: true });
        await Bun.write(manifestPath, packaged.bytes);
        await Bun.write(
          resolve(dest, "pack.json"),
          `${JSON.stringify({ releaseSha256: packaged.digest, manifestKey: sampleReleaseKey(packaged.digest), objectKeys: [...packaged.objects.keys()].map(sampleObjectKey) }, null, 2)}\n`
        );
        return packaged.digest;
      })
  );
}

export async function publishSample(options: {
  root: string;
  store: ObjectStore;
  bucket: string;
}): Promise<string> {
  if (!options.bucket || options.store.bucket !== options.bucket) {
    throw new Error(
      "Fixture publication requires an explicit matching fixture bucket"
    );
  }
  return await withDirectoryLock(
    sampleMaintenanceLock(options.root),
    async () =>
      await withSampleSnapshot(options.root, async (snapshot) => {
        const packaged = await packageSampleRelease(snapshot);
        const putVerified = async (
          key: string,
          bytes: Uint8Array
        ): Promise<void> => {
          const existing = await options.store.head(key);
          if (existing) {
            const remote = await options.store.get(key, bytes.length);
            if (
              remote.length !== bytes.length ||
              sha256(remote) !== sha256(bytes)
            ) {
              throw new Error(`Immutable fixture object conflict: ${key}`);
            }
            return;
          }
          await options.store.putIfAbsent(key, bytes);
          const remote = await options.store.get(key, bytes.length);
          if (
            remote.length !== bytes.length ||
            sha256(remote) !== sha256(bytes)
          ) {
            throw new Error(
              `Uploaded fixture object failed verification: ${key}`
            );
          }
        };
        await runWithConcurrency(
          [...packaged.objects.entries()],
          8,
          async ([digest, bytes]) => {
            await putVerified(sampleObjectKey(digest), bytes);
          }
        );
        await putVerified(sampleReleaseKey(packaged.digest), packaged.bytes);
        await loadSampleRelease(options.store, packaged.digest);
        return packaged.digest;
      })
  );
}

/** Verify public bytes and application semantics before updating the committed sample pin. */
export async function pinSample(
  digest: string,
  publicBaseUrl: string,
  blogRoot = BLOG_ROOT
): Promise<void> {
  const lock = SampleLockSchema.parse({
    schemaVersion: 1,
    profile: "sample",
    releaseSha256: digest,
    publicBaseUrl,
  });
  const scratch = await mkdtemp(resolve(tmpdir(), "howardism-sample-pin-"));
  try {
    await Bun.write(
      resolve(scratch, SAMPLE_LOCK_FILE),
      `${JSON.stringify(lock)}\n`
    );
    await prepareContent({
      profile: "sample",
      blogRoot: scratch,
      sampleStore: publicFixtureStore(lock.publicBaseUrl),
    });
    await withDirectoryLock(
      resolve(blogRoot, ".content-prepare-lock"),
      async () => {
        const temporaryLock = resolve(
          blogRoot,
          `.sample-lock-${crypto.randomUUID()}.tmp`
        );
        try {
          await Bun.write(temporaryLock, `${JSON.stringify(lock, null, 2)}\n`);
          await rename(temporaryLock, resolve(blogRoot, SAMPLE_LOCK_FILE));
        } finally {
          await rm(temporaryLock, { force: true });
        }
      }
    );
  } finally {
    await rm(scratch, { recursive: true, force: true });
  }
}
