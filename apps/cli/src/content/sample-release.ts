/** biome-ignore-all lint/performance/noAwaitInLoops: Release packing reads each bounded fixture file in order. */
import { lstat } from "node:fs/promises";
import { join, resolve } from "node:path";
import { gzipSync } from "node:zlib";
import {
  digestSchema,
  MAX_FILE_BYTES,
} from "@howardism/article-contract/manifests/content-release";
import {
  MAX_SAMPLE_ARTICLES_PER_LOCALE,
  MAX_SAMPLE_ASSETS,
  MAX_SAMPLE_RELEASE_BYTES,
  type SampleFile,
  type SampleRelease,
  SampleReleaseSchema,
} from "@howardism/article-contract/manifests/sample-release";
import { inventory, sha256 } from "./release";
import type { ReadObjectStore } from "./store";

export const sampleObjectKey = (digest: string): string =>
  `fixtures/v1/objects/sha256/${digest.slice(0, 2)}/${digest}`;
export const sampleReleaseKey = (digest: string): string =>
  `fixtures/v1/releases/${digest}.json`;

export async function packageSampleRelease(root: string) {
  const coveragePath = resolve(root, "coverage.json");
  const coverageInfo = await lstat(coveragePath);
  if (!coverageInfo.isFile() || coverageInfo.isSymbolicLink()) {
    throw new Error("Sample coverage must be a regular file");
  }
  const paths = [...(await inventory(root)), "coverage.json"].sort();
  const enCount = paths.filter((path) =>
    path.startsWith("content/articles/")
  ).length;
  const zhCount = paths.filter((path) =>
    path.startsWith("content/articles-zh-TW/")
  ).length;
  const assetCount = paths.filter((path) =>
    path.startsWith("content/assets/")
  ).length;
  if (
    enCount > MAX_SAMPLE_ARTICLES_PER_LOCALE ||
    zhCount > MAX_SAMPLE_ARTICLES_PER_LOCALE ||
    assetCount > MAX_SAMPLE_ASSETS ||
    enCount !== zhCount ||
    paths.length > 256
  ) {
    throw new Error("Sample corpus exceeds bounded bilingual fixture limits");
  }
  let decodedBytes = 0;
  for (const path of paths) {
    const info = await lstat(resolve(root, path));
    if (!info.isFile() || info.isSymbolicLink() || info.size > MAX_FILE_BYTES) {
      throw new Error(`Unsafe or oversized sample file: ${path}`);
    }
    decodedBytes += info.size;
    if (decodedBytes > MAX_SAMPLE_RELEASE_BYTES) {
      throw new Error("Sample corpus exceeds decoded size limit");
    }
  }
  let storedBytes = 0;
  const files: SampleFile[] = [];
  const objects = new Map<string, Uint8Array>();
  for (const path of paths) {
    const decoded = new Uint8Array(
      await Bun.file(join(root, path)).arrayBuffer()
    );
    const encoding =
      path.endsWith(".json") || path.endsWith(".mdx") ? "gzip" : "identity";
    const stored =
      encoding === "gzip" ? gzipSync(decoded, { level: 9 }) : decoded;
    storedBytes += stored.length;
    if (storedBytes > MAX_SAMPLE_RELEASE_BYTES) {
      throw new Error("Sample corpus exceeds stored size limit");
    }
    const digest = sha256(stored);
    objects.set(digest, stored);
    files.push({
      path,
      encoding,
      objectSha256: digest,
      storedBytes: stored.length,
      decodedSha256: sha256(decoded),
      decodedBytes: decoded.length,
    });
  }
  const release: SampleRelease = SampleReleaseSchema.parse({
    schemaVersion: 1,
    profile: "sample",
    exporterVersion: "1",
    files,
    counts: {
      articlesByLocale: {
        en: files.filter((file) => file.path.startsWith("content/articles/"))
          .length,
        "zh-TW": files.filter((file) =>
          file.path.startsWith("content/articles-zh-TW/")
        ).length,
      },
      assets: files.filter((file) => file.path.startsWith("content/assets/"))
        .length,
    },
  });
  const bytes = Buffer.from(`${JSON.stringify(release)}\n`);
  return { release, bytes, digest: sha256(bytes), objects };
}

export async function loadSampleRelease(
  store: ReadObjectStore,
  digest: string
): Promise<SampleRelease> {
  digestSchema.parse(digest);
  const bytes = await store.get(sampleReleaseKey(digest), 1024 * 1024);
  if (sha256(bytes) !== digest) {
    throw new Error("Sample release manifest checksum mismatch");
  }
  return SampleReleaseSchema.parse(
    JSON.parse(Buffer.from(bytes).toString("utf8"))
  );
}
