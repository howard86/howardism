/** biome-ignore-all lint/performance/noAwaitInLoops: Filesystem operations are deliberately serialized to bound memory and preserve snapshot/replacement order. */
import { lstat, mkdir, mkdtemp, readdir, rename, rm } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import {
  CONTENT_MANIFESTS,
  type ContentFile,
  ContentLockSchema,
  type ContentRelease,
} from "@howardism/article-contract/manifests/content-release";
import {
  SAMPLE_LOCK_FILE,
  SampleLockSchema,
  type SampleRelease,
} from "@howardism/article-contract/manifests/sample-release";
import { runWithConcurrency } from "../concurrency";
import { BLOG_ROOT, contentPaths } from "./paths";
import { loadRelease } from "./publish";
import { decodeObject, inventory, objectKey, sha256 } from "./release";
import { publicFixtureStore } from "./sample-public";
import { loadSampleRelease, sampleObjectKey } from "./sample-release";
import type { ObjectStore, ReadObjectStore } from "./store";
import { validateSnapshot } from "./validate";
import { withDirectoryLock } from "./workspace";

const INTEGRITY_FAILURE = /integrity|checksum|size limit/;

export function selectProfile(env = process.env): "full" | "sample" {
  if (
    env.VERCEL_ENV &&
    !["production", "preview", "development"].includes(env.VERCEL_ENV) &&
    !env.CONTENT_PROFILE
  ) {
    throw new Error("Unknown deployment context requires CONTENT_PROFILE");
  }
  const selected =
    env.CONTENT_PROFILE ??
    (env.VERCEL_ENV === "production" ? "full" : "sample");
  if (selected !== "full" && selected !== "sample") {
    throw new Error("CONTENT_PROFILE must be full or sample");
  }
  if (env.VERCEL_ENV === "production" && selected !== "full") {
    throw new Error("Production rejects sample content");
  }
  if (env.VERCEL_ENV === "preview" && selected !== "sample") {
    throw new Error(
      "Ordinary Vercel previews require sample content; use a trusted integration environment for full builds"
    );
  }
  return selected;
}

async function assertSafeCachePath(
  blogRoot: string,
  cache: string
): Promise<void> {
  for (let path = cache; path !== blogRoot; path = dirname(path)) {
    try {
      const stat = await lstat(path);
      if (!stat.isDirectory() || stat.isSymbolicLink()) {
        throw new Error(`Unsafe content cache directory: ${path}`);
      }
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
  }
}

async function ensureDirectory(path: string): Promise<void> {
  await mkdir(path, { recursive: true });
  const stat = await lstat(path);
  if (!stat.isDirectory() || stat.isSymbolicLink()) {
    throw new Error(`Unsafe materialization directory: ${path}`);
  }
}

async function cachedObject(
  cache: string,
  file: ContentFile,
  store: ReadObjectStore,
  metrics: PreparationMetrics,
  keyForDigest: (digest: string) => string
): Promise<Uint8Array> {
  const path = resolve(cache, file.objectSha256);
  try {
    const stat = await lstat(path);
    if (!stat.isFile() || stat.isSymbolicLink()) {
      throw new Error("Unsafe cache entry");
    }
    if (stat.size === file.storedBytes) {
      const bytes = new Uint8Array(await Bun.file(path).arrayBuffer());
      decodeObject(file, bytes);
      metrics.cacheHits += 1;
      return bytes;
    }
  } catch (error) {
    if (error instanceof Error && INTEGRITY_FAILURE.test(error.message)) {
      metrics.verificationFailures += 1;
    }
    // Missing or corrupt regular cached objects are replaced from the pinned release.
    if (error instanceof Error && error.message === "Unsafe cache entry") {
      throw error;
    }
  }
  metrics.cacheMisses += 1;
  const bytes = await store.get(
    keyForDigest(file.objectSha256),
    file.storedBytes
  );
  decodeObject(file, bytes);
  metrics.downloadedBytes += bytes.length;
  const temp = `${path}.${crypto.randomUUID()}.tmp`;
  try {
    await Bun.write(temp, bytes);
    await rename(temp, path);
  } finally {
    await rm(temp, { force: true });
  }
  return bytes;
}

/** Files with identical bytes (e.g. reused hero art) share one object: fetch and count it once. */
function objectLoader(
  files: ContentFile[],
  cache: string,
  store: ReadObjectStore,
  metrics: PreparationMetrics,
  keyForDigest: (digest: string) => string
): (file: ContentFile) => Promise<Uint8Array> {
  const uses = new Map<string, number>();
  for (const file of files) {
    uses.set(file.objectSha256, (uses.get(file.objectSha256) ?? 0) + 1);
  }
  metrics.requiredObjects = uses.size;
  const shared = new Map<string, Promise<Uint8Array>>();
  return (file) => {
    if ((uses.get(file.objectSha256) ?? 0) < 2) {
      return cachedObject(cache, file, store, metrics, keyForDigest);
    }
    let bytes = shared.get(file.objectSha256);
    if (!bytes) {
      bytes = cachedObject(cache, file, store, metrics, keyForDigest);
      shared.set(file.objectSha256, bytes);
    }
    return bytes;
  };
}

async function evictCache(
  cache: string,
  used: Set<string>,
  budget: number
): Promise<void> {
  const entries = await Promise.all(
    (await readdir(cache)).map(async (name) => ({
      name,
      stat: await lstat(resolve(cache, name)),
    }))
  );
  let total = entries.reduce((bytes, entry) => bytes + entry.stat.size, 0);
  // Unused objects go first; a too-large active corpus may evict used objects after materialization.
  entries.sort(
    (a, b) =>
      Number(used.has(a.name)) - Number(used.has(b.name)) ||
      a.stat.mtimeMs - b.stat.mtimeMs
  );
  for (const entry of entries) {
    if (total <= budget) {
      break;
    }
    if (!entry.stat.isFile() || entry.stat.isSymbolicLink()) {
      throw new Error("Unsafe object cache entry");
    }
    await rm(resolve(cache, entry.name));
    total -= entry.stat.size;
  }
}

export interface PreparationMetrics {
  cacheHits: number;
  cacheMisses: number;
  downloadedBytes: number;
  elapsedMs: number;
  profile: "full" | "sample";
  requiredObjects: number;
  retries: number;
  verificationFailures: number;
}

export interface PrepareOptions {
  blogRoot?: string;
  cacheBudgetBytes?: number;
  concurrency?: number;
  fixtureRoot?: string;
  profile: "full" | "sample";
  report?: (metrics: PreparationMetrics) => void;
  sampleStore?: ReadObjectStore;
  store?: ObjectStore;
}

/** Hold the lock through the consumer so a second preparation cannot replace its input. */
export async function prepareContent<T = void>(
  options: PrepareOptions,
  consumer?: () => Promise<T>
): Promise<T | undefined> {
  const started = performance.now();
  const metrics: PreparationMetrics = {
    profile: options.profile,
    requiredObjects: 0,
    cacheHits: 0,
    cacheMisses: 0,
    downloadedBytes: 0,
    elapsedMs: 0,
    verificationFailures: 0,
    retries: 0,
  };
  const blogRoot = resolve(options.blogRoot ?? BLOG_ROOT);
  const active = contentPaths(resolve(blogRoot, "src"));
  const cache = resolve(blogRoot, ".next/cache/howardism-content");
  const sampleCache = resolve(blogRoot, ".next/cache/howardism-fixtures");
  const concurrency = options.concurrency ?? 8;
  const budget = options.cacheBudgetBytes ?? 512 * 1024 * 1024;
  if (
    !Number.isSafeInteger(concurrency) ||
    concurrency < 1 ||
    concurrency > 32 ||
    !Number.isSafeInteger(budget) ||
    budget < 0
  ) {
    throw new Error("Invalid content concurrency/cache budget");
  }
  await ensureDirectory(blogRoot);
  await assertSafeCachePath(blogRoot, cache);
  await assertSafeCachePath(blogRoot, sampleCache);
  return await withDirectoryLock(
    resolve(blogRoot, ".content-prepare-lock"),
    async () => {
      await rm(resolve(blogRoot, ".content-state.json"), { force: true });
      const temp = await mkdtemp(resolve(blogRoot, ".content-candidate-"));
      const candidate = contentPaths(temp);
      let release: ContentRelease | undefined;
      let sampleRelease: SampleRelease | undefined;
      let releaseSha256: string | undefined;
      let reported = false;
      try {
        await ensureDirectory(candidate.articles);
        await ensureDirectory(candidate.translated);
        await ensureDirectory(candidate.assets);
        await ensureDirectory(candidate.data);
        if (options.profile === "full") {
          const lock = ContentLockSchema.parse(
            await Bun.file(resolve(blogRoot, "content.lock.json")).json()
          );
          if (!options.store) {
            throw new Error("Full preparation requires an R2 object store");
          }
          ({ releaseSha256 } = lock);
          release = await loadRelease(options.store, releaseSha256);
          await ensureDirectory(resolve(blogRoot, ".next"));
          await ensureDirectory(resolve(blogRoot, ".next/cache"));
          await ensureDirectory(cache);
          const { store } = options;
          const load = objectLoader(
            release.files,
            cache,
            store,
            metrics,
            objectKey
          );
          await runWithConcurrency(release.files, concurrency, async (file) => {
            const bytes = await load(file);
            await Bun.write(
              resolve(temp, file.path),
              decodeObject(file, bytes)
            );
          });
        } else {
          ({ sampleRelease, releaseSha256 } = await prepareSampleInput({
            options,
            blogRoot,
            activeRoot: active.root,
            temp,
            cache,
            sampleCache,
            concurrency,
            metrics,
          }));
        }
        await validateSnapshot(temp, options.profile);
        const tree = await Promise.all(
          [
            ...(await inventory(temp)),
            ...(options.profile === "sample" ? ["coverage.json"] : []),
          ].map(async (path) => [
            path,
            sha256(
              new Uint8Array(await Bun.file(resolve(temp, path)).arrayBuffer())
            ),
          ])
        );
        await ensureDirectory(active.root);
        await replaceActiveDirectories(active.root, temp);
        if (options.profile === "sample") {
          await rename(
            resolve(temp, "coverage.json"),
            resolve(active.root, ".content-coverage.json")
          );
        } else {
          await rm(resolve(active.root, ".content-coverage.json"), {
            force: true,
          });
        }
        if (release) {
          await evictCache(
            cache,
            new Set(release.files.map((file) => file.objectSha256)),
            budget
          );
        }
        if (sampleRelease) {
          await evictCache(
            sampleCache,
            new Set(sampleRelease.files.map((file) => file.objectSha256)),
            budget
          );
        }
        await Bun.write(
          resolve(blogRoot, ".content-state.json"),
          `${JSON.stringify({ schemaVersion: 1, profile: options.profile, ...(releaseSha256 ? { releaseSha256 } : {}), materializedTreeSha256: sha256(JSON.stringify(tree)) })}\n`
        );
        metrics.elapsedMs = Math.round(performance.now() - started);
        reportPreparation(options, metrics, releaseSha256);
        reported = true;
        return await consumer?.();
      } catch (error) {
        if (error instanceof Error && INTEGRITY_FAILURE.test(error.message)) {
          metrics.verificationFailures += 1;
        }
        throw error;
      } finally {
        if (!reported) {
          metrics.elapsedMs = Math.round(performance.now() - started);
          reportPreparation(options, metrics, releaseSha256);
        }
        await rm(temp, { recursive: true, force: true });
      }
    }
  );
}

async function replaceActiveDirectories(
  activeRoot: string,
  temp: string
): Promise<void> {
  const content = resolve(activeRoot, "content");
  const data = resolve(activeRoot, "data");
  for (const directory of [content, data]) {
    await checkDestination(directory, "directory");
  }
  for (const name of CONTENT_MANIFESTS) {
    await checkDestination(resolve(data, name), "file");
  }
  await rm(content, { recursive: true, force: true });
  await rename(resolve(temp, "content"), content);
  await ensureDirectory(data);
  // Keep unrelated hand-maintained data files. The preparation lock covers all seven replacements.
  for (const name of CONTENT_MANIFESTS) {
    await rename(resolve(temp, "data", name), resolve(data, name));
  }
}

async function prepareSampleInput(input: {
  options: PrepareOptions;
  blogRoot: string;
  activeRoot: string;
  temp: string;
  cache: string;
  sampleCache: string;
  concurrency: number;
  metrics: PreparationMetrics;
}): Promise<{ sampleRelease?: SampleRelease; releaseSha256?: string }> {
  const {
    options,
    blogRoot,
    activeRoot,
    temp,
    cache,
    sampleCache,
    concurrency,
    metrics,
  } = input;
  // Remove inherited full objects before any sample network operation.
  await assertSafeCachePath(blogRoot, cache);
  await rm(cache, { recursive: true, force: true });
  const sampleLock = await readSampleLock(blogRoot);
  let sampleRelease: SampleRelease | undefined;
  let releaseSha256: string | undefined;
  if (sampleLock) {
    if (options.fixtureRoot) {
      throw new Error("Pinned sample preparation rejects local fixture roots");
    }
    ({ releaseSha256 } = sampleLock);
    const store =
      options.sampleStore ?? publicFixtureStore(sampleLock.publicBaseUrl);
    sampleRelease = await loadSampleRelease(store, releaseSha256);
    await ensureDirectory(resolve(blogRoot, ".next"));
    await ensureDirectory(resolve(blogRoot, ".next/cache"));
    await ensureDirectory(sampleCache);
    const load = objectLoader(
      sampleRelease.files,
      sampleCache,
      store,
      metrics,
      sampleObjectKey
    );
    await runWithConcurrency(sampleRelease.files, concurrency, async (file) => {
      const bytes = await load(file);
      await Bun.write(resolve(temp, file.path), decodeObject(file, bytes));
    });
  } else {
    if (!options.fixtureRoot) {
      throw new Error(
        "Sample preparation requires content.sample.lock.json; explicit fixtureRoot is for offline tests only"
      );
    }
    await copyFixtures(options.fixtureRoot, activeRoot, temp);
  }
  return { sampleRelease, releaseSha256 };
}

async function readSampleLock(blogRoot: string) {
  const path = resolve(blogRoot, SAMPLE_LOCK_FILE);
  try {
    const info = await lstat(path);
    if (!info.isFile() || info.isSymbolicLink()) {
      throw new Error("Unsafe sample lock file");
    }
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "ENOENT"
    ) {
      return;
    }
    throw error;
  }
  return SampleLockSchema.parse(await Bun.file(path).json());
}

async function copyFixtures(
  fixtureRoot: string,
  activeRoot: string,
  temp: string
): Promise<void> {
  const source = resolve(fixtureRoot);
  if (source === activeRoot) {
    throw new Error("Fixtures and active content must be separate");
  }
  for (const path of await inventory(source)) {
    await Bun.write(
      resolve(temp, path),
      await Bun.file(resolve(source, path)).arrayBuffer()
    );
  }
  await Bun.write(
    resolve(temp, "coverage.json"),
    await Bun.file(resolve(source, "coverage.json")).arrayBuffer()
  );
}

function reportPreparation(
  options: PrepareOptions,
  metrics: PreparationMetrics,
  releaseSha256: string | undefined
): void {
  metrics.retries =
    options.store?.metrics?.retries ??
    options.sampleStore?.metrics?.retries ??
    0;
  if (options.report) {
    options.report(metrics);
  } else {
    process.stdout.write(
      `${JSON.stringify({ contentPreparation: metrics, ...(releaseSha256 ? { releaseSha256 } : {}) })}\n`
    );
  }
}

async function checkDestination(
  path: string,
  kind: "file" | "directory"
): Promise<void> {
  try {
    const info = await lstat(path);
    const valid = kind === "file" ? info.isFile() : info.isDirectory();
    if (!valid || info.isSymbolicLink()) {
      throw new Error(`Unsafe active destination: ${path}`);
    }
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
}
