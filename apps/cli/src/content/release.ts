/** biome-ignore-all lint/performance/noAwaitInLoops: Filesystem operations are deliberately serialized to bound memory and preserve snapshot/replacement order. */
import { createHash } from "node:crypto";
import { lstat, readdir } from "node:fs/promises";
import { join } from "node:path";
import { gunzipSync, gzipSync } from "node:zlib";
import {
  type ContentFile,
  ContentReleaseSchema,
  contentPathSchema,
  MAX_FILE_BYTES,
} from "@howardism/article-contract/manifests/content-release";

export const sha256 = (bytes: Uint8Array | string): string =>
  createHash("sha256").update(bytes).digest("hex");
export const objectKey = (digest: string): string =>
  `objects/v1/sha256/${digest.slice(0, 2)}/${digest}`;
export const releaseKey = (digest: string): string =>
  `releases/v1/${digest}.json`;

/** Reject links and unknown files rather than following them out of a snapshot. */
export async function inventory(root: string, prefix = ""): Promise<string[]> {
  const info = await lstat(join(root, prefix));
  if (!info.isDirectory() || info.isSymbolicLink()) {
    throw new Error(`Unsafe content directory: ${prefix}`);
  }
  const paths: string[] = [];
  for (const entry of (prefix
    ? await readdir(join(root, prefix))
    : ["content", "data"]
  ).sort()) {
    const path = prefix ? `${prefix}/${entry}` : entry;
    const stat = await lstat(join(root, path));
    if (stat.isSymbolicLink()) {
      throw new Error(`Symlink forbidden: ${path}`);
    }
    if (stat.isDirectory()) {
      paths.push(...(await inventory(root, path)));
    } else if (stat.isFile()) {
      contentPathSchema.parse(path);
      if (stat.size > MAX_FILE_BYTES) {
        throw new Error(`Oversized content file: ${path}`);
      }
      paths.push(path);
    } else {
      throw new Error(`Unsupported file: ${path}`);
    }
  }
  return paths.sort();
}

export async function packageRelease(root: string) {
  const files: ContentFile[] = [];
  const objects = new Map<string, Uint8Array>();
  for (const path of await inventory(root)) {
    const decoded = new Uint8Array(
      await Bun.file(join(root, path)).arrayBuffer()
    );
    const encoding =
      path.endsWith(".mdx") || path.endsWith(".json") ? "gzip" : "identity";
    const stored =
      encoding === "gzip" ? gzipSync(decoded, { level: 9 }) : decoded;
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
  const release = ContentReleaseSchema.parse({
    schemaVersion: 1,
    profile: "full",
    exporterVersion: "1",
    files,
    counts: {
      articlesByLocale: {
        en: files.filter((f) => f.path.startsWith("content/articles/")).length,
        "zh-TW": files.filter((f) =>
          f.path.startsWith("content/articles-zh-TW/")
        ).length,
      },
      assets: files.filter((f) => f.path.startsWith("content/assets/")).length,
    },
  });
  const bytes = Buffer.from(`${JSON.stringify(release)}\n`);
  return { release, bytes, digest: sha256(bytes), objects };
}

export function decodeObject(file: ContentFile, bytes: Uint8Array): Uint8Array {
  if (
    bytes.length !== file.storedBytes ||
    sha256(bytes) !== file.objectSha256
  ) {
    throw new Error(`Stored integrity failure: ${file.path}`);
  }
  const decoded =
    file.encoding === "gzip"
      ? gunzipSync(bytes, { maxOutputLength: file.decodedBytes })
      : bytes;
  if (
    decoded.length !== file.decodedBytes ||
    sha256(decoded) !== file.decodedSha256
  ) {
    throw new Error(`Decoded integrity failure: ${file.path}`);
  }
  return decoded;
}
