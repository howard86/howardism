/** biome-ignore-all lint/performance/noAwaitInLoops: Traverse deployable output serially to bound open files and memory. */
import { createHash } from "node:crypto";
import { lstat, readdir, readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { parseArgs } from "node:util";
import {
  ContentBuildMarkerSchema,
  ContentLockSchema,
} from "@howardism/article-contract/manifests/content-release";
import { file } from "bun";

const LOG_LINES = /\r?\n/;
const DIGEST = /^[a-f0-9]{64}$/;

interface PreparationRecord {
  contentPreparation: {
    profile: string;
    requiredObjects: number;
    cacheHits: number;
    cacheMisses: number;
    downloadedBytes: number;
    verificationFailures: number;
  };
  releaseSha256: string;
}

export function preparationFromLog(log: string): PreparationRecord {
  const records: PreparationRecord[] = [];
  for (const line of log.split(LOG_LINES)) {
    const jsonStart = line.indexOf('{"contentPreparation":');
    if (jsonStart < 0) {
      continue;
    }
    try {
      const record = JSON.parse(line.slice(jsonStart)) as unknown;
      records.push(validatePreparationRecord(record));
    } catch (error) {
      throw new Error("Malformed content preparation receipt", {
        cause: error,
      });
    }
  }
  if (records.length !== 1) {
    throw new Error(
      `Expected one content preparation receipt, found ${records.length}`
    );
  }
  return records[0];
}

function validatePreparationRecord(input: unknown): PreparationRecord {
  if (!input || typeof input !== "object") {
    throw new Error("Preparation receipt must be an object");
  }
  const record = input as Partial<PreparationRecord>;
  const metrics = record.contentPreparation;
  if (!(metrics && DIGEST.test(record.releaseSha256 ?? ""))) {
    throw new Error("Preparation receipt is missing release identity");
  }
  if (metrics.profile !== "full") {
    throw new Error("Preparation receipt must be full profile");
  }
  for (const value of [
    metrics.requiredObjects,
    metrics.cacheHits,
    metrics.cacheMisses,
    metrics.downloadedBytes,
    metrics.verificationFailures,
  ]) {
    if (!Number.isSafeInteger(value) || value < 0) {
      throw new Error("Preparation receipt contains an invalid metric");
    }
  }
  return record as PreparationRecord;
}

export function verifyBuildPair(
  cold: PreparationRecord,
  warm: PreparationRecord,
  coldMarkerInput: unknown,
  markerInput: unknown,
  lockInput: unknown,
  expectedCommit: string
) {
  const coldMarker = ContentBuildMarkerSchema.parse(coldMarkerInput);
  const marker = ContentBuildMarkerSchema.parse(markerInput);
  const lock = ContentLockSchema.parse(lockInput);
  if (
    cold.contentPreparation.profile !== "full" ||
    warm.contentPreparation.profile !== "full" ||
    cold.releaseSha256 !== lock.releaseSha256 ||
    warm.releaseSha256 !== lock.releaseSha256 ||
    marker.releaseSha256 !== lock.releaseSha256 ||
    marker.applicationCommit !== expectedCommit ||
    JSON.stringify(coldMarker) !== JSON.stringify(marker)
  ) {
    throw new Error(
      "Cold/warm receipts and marker do not match the pinned full build"
    );
  }
  if (
    cold.contentPreparation.requiredObjects < 1 ||
    cold.contentPreparation.cacheMisses < 1 ||
    cold.contentPreparation.cacheHits !== 0 ||
    cold.contentPreparation.cacheMisses !==
      cold.contentPreparation.requiredObjects ||
    cold.contentPreparation.downloadedBytes < 1 ||
    cold.contentPreparation.verificationFailures > 0
  ) {
    throw new Error("Cold build did not reconstruct a clean full release");
  }
  if (
    warm.contentPreparation.requiredObjects !==
      cold.contentPreparation.requiredObjects ||
    warm.contentPreparation.cacheMisses !== 0 ||
    warm.contentPreparation.cacheHits !==
      warm.contentPreparation.requiredObjects ||
    warm.contentPreparation.downloadedBytes !== 0 ||
    warm.contentPreparation.verificationFailures > 0
  ) {
    throw new Error("Warm build downloaded content or failed verification");
  }
  return {
    schemaVersion: 1,
    applicationCommit: marker.applicationCommit,
    profile: marker.profile,
    releaseSha256: marker.releaseSha256,
    materializedTreeSha256: marker.materializedTreeSha256,
    cold: cold.contentPreparation,
    warm: warm.contentPreparation,
  };
}

const BANNED_CODE = [
  "@aws-sdk/client-s3",
  "r2.cloudflarestorage.com",
  "apps/cli/src/content/r2",
  "apps/cli/src/content/publish",
];

export function scanBuildBytes(bytes: Uint8Array, secrets: string[]): void {
  const content = Buffer.from(bytes);
  for (const secret of secrets) {
    if (secret.length < 8) {
      throw new Error("Credential too short for meaningful output scan");
    }
    if (content.includes(Buffer.from(secret))) {
      throw new Error("Credential found in deployable output");
    }
  }
  for (const signature of BANNED_CODE) {
    if (content.includes(Buffer.from(signature))) {
      throw new Error(
        `Publication tooling found in deployable output: ${signature}`
      );
    }
  }
}

export async function scanBuildOutput(
  roots: string[],
  secrets: string[]
): Promise<number> {
  let scanned = 0;
  const visit = async (path: string): Promise<void> => {
    const info = await lstat(path);
    if (info.isSymbolicLink()) {
      throw new Error("Symlink found in deployable output");
    }
    if (info.isDirectory()) {
      for (const child of await readdir(path)) {
        await visit(join(path, child));
      }
      return;
    }
    if (!info.isFile()) {
      throw new Error("Unsupported deployable output entry");
    }
    scanBuildBytes(await readFile(path), secrets);
    scanned += 1;
  };
  for (const root of roots) {
    await visit(root);
  }
  if (scanned === 0) {
    throw new Error("No deployable output was scanned");
  }
  return scanned;
}

async function main(): Promise<void> {
  const { values } = parseArgs({
    options: {
      "cold-log": { type: "string" },
      "warm-log": { type: "string" },
      "cold-marker": { type: "string" },
      "blog-root": { type: "string" },
      commit: { type: "string" },
      output: { type: "string" },
    },
  });
  if (
    !(
      values["cold-log"] &&
      values["warm-log"] &&
      values["cold-marker"] &&
      values["blog-root"] &&
      values.commit &&
      values.output
    )
  ) {
    throw new Error(
      "Require --cold-log --warm-log --cold-marker --blog-root --commit --output"
    );
  }
  const blogRoot = resolve(values["blog-root"]);
  const [coldLog, warmLog, coldMarker, marker, lock] = await Promise.all([
    readFile(values["cold-log"], "utf8"),
    readFile(values["warm-log"], "utf8"),
    file(values["cold-marker"]).json(),
    file(join(blogRoot, "public/.well-known/howardism-content.json")).json(),
    file(join(blogRoot, "content.lock.json")).json(),
  ]);
  const receipt = verifyBuildPair(
    preparationFromLog(coldLog),
    preparationFromLog(warmLog),
    coldMarker,
    marker,
    lock,
    values.commit
  );
  const accessKey = process.env.R2_ACCESS_KEY_ID;
  const secretKey = process.env.R2_SECRET_ACCESS_KEY;
  if (!(accessKey && secretKey)) {
    throw new Error("R2 credentials required for output scan");
  }
  const scannedFiles = await scanBuildOutput(
    [
      join(blogRoot, ".next/server"),
      join(blogRoot, ".next/static"),
      join(blogRoot, "public"),
    ],
    [accessKey, secretKey]
  );
  const summary = { ...receipt, scannedFiles };
  await file(values.output).write(`${JSON.stringify(summary, null, 2)}\n`);
  process.stdout.write(
    `${JSON.stringify({ evidenceSha256: createHash("sha256").update(JSON.stringify(summary)).digest("hex"), ...summary })}\n`
  );
}

if (import.meta.main) {
  await main();
}
