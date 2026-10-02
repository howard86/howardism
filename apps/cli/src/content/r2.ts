const ACCOUNT_ID = /^[a-f0-9]{32}$/;
const FIXTURE_KEY =
  /^fixtures\/v1\/(?:objects\/sha256\/([a-f0-9]{2})\/([a-f0-9]{64})|releases\/([a-f0-9]{64})\.json)$/;

function assertFixtureKey(key: string): void {
  const match = FIXTURE_KEY.exec(key);
  if (!match || (match[2] && match[1] !== match[2].slice(0, 2))) {
    throw new Error(
      "Fixture store rejects keys outside its hash-derived namespace"
    );
  }
}

import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
  S3ServiceException,
} from "@aws-sdk/client-s3";
import { sha256 } from "./release";
import type { MaintenanceStore, ObjectStore, StoredObject } from "./store";

export const PUBLIC_FIXTURE_BUCKET = "howardism-content-fixtures";

export function r2Store(env = process.env): MaintenanceStore {
  if (
    env.R2_BUCKET === PUBLIC_FIXTURE_BUCKET ||
    (env.R2_FIXTURE_BUCKET && env.R2_BUCKET === env.R2_FIXTURE_BUCKET)
  ) {
    throw new Error(
      "Private full-content R2 store cannot use the public fixture bucket"
    );
  }
  return createR2Store(env);
}

function createR2Store(env: NodeJS.ProcessEnv): MaintenanceStore {
  const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET } =
    env;
  if (
    !(R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY && R2_BUCKET)
  ) {
    throw new Error(
      "R2_ACCOUNT_ID, R2_BUCKET, R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY are required"
    );
  }
  if (!ACCOUNT_ID.test(R2_ACCOUNT_ID)) {
    throw new Error("Invalid R2 account ID");
  }
  const metrics = { retries: 0 };
  const client = new S3Client({
    region: "auto",
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
    maxAttempts: 3,
  });
  const get = async (key: string, maxBytes: number): Promise<Uint8Array> => {
    const response = await client.send(
      new GetObjectCommand({ Bucket: R2_BUCKET, Key: key }),
      { abortSignal: AbortSignal.timeout(120_000) }
    );
    metrics.retries += Math.max(0, (response.$metadata.attempts ?? 1) - 1);
    if (!response.Body || (response.ContentLength ?? 0) > maxBytes) {
      throw new Error(`Oversized or empty R2 object: ${key}`);
    }
    const chunks: Uint8Array[] = [];
    let size = 0;
    for await (const chunk of response.Body.transformToWebStream()) {
      size += chunk.length;
      if (size > maxBytes) {
        throw new Error(`R2 object exceeds limit: ${key}`);
      }
      chunks.push(chunk);
    }
    return Buffer.concat(chunks);
  };
  const head = async (key: string) => {
    try {
      const response = await client.send(
        new HeadObjectCommand({ Bucket: R2_BUCKET, Key: key }),
        { abortSignal: AbortSignal.timeout(30_000) }
      );
      return {
        bytes: response.ContentLength ?? -1,
        sha256: response.Metadata?.sha256 ?? "",
      };
    } catch (error) {
      if (
        error instanceof S3ServiceException &&
        error.$metadata.httpStatusCode === 404
      ) {
        return null;
      }
      throw error;
    }
  };
  return {
    bucket: R2_BUCKET,
    metrics,
    async list() {
      const objects: StoredObject[] = [];
      let token: string | undefined;
      do {
        // biome-ignore lint/performance/noAwaitInLoops: Pagination depends on the previous continuation token.
        const response = await client.send(
          new ListObjectsV2Command({
            Bucket: R2_BUCKET,
            ContinuationToken: token,
          }),
          { abortSignal: AbortSignal.timeout(30_000) }
        );
        for (const object of response.Contents ?? []) {
          if (
            !(object.Key && object.LastModified) ||
            object.Size === undefined
          ) {
            throw new Error("Incomplete R2 inventory");
          }
          objects.push({
            key: object.Key,
            modifiedAt: object.LastModified.toISOString(),
            bytes: object.Size,
          });
        }
        if (response.IsTruncated && !response.NextContinuationToken) {
          throw new Error("R2 inventory pagination failed");
        }
        token = response.NextContinuationToken;
      } while (token);
      return objects.sort((a, b) => a.key.localeCompare(b.key));
    },
    async delete(key) {
      await client.send(
        new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: key }),
        { abortSignal: AbortSignal.timeout(30_000) }
      );
    },
    head,
    get,
    async putIfAbsent(key, bytes) {
      const existing = await head(key);
      if (existing) {
        if (
          existing.bytes !== bytes.length ||
          existing.sha256 !== sha256(bytes)
        ) {
          throw new Error(`Immutable object conflict: ${key}`);
        }
        return;
      }
      try {
        await client.send(
          new PutObjectCommand({
            Bucket: R2_BUCKET,
            Key: key,
            Body: bytes,
            IfNoneMatch: "*",
            Metadata: { sha256: sha256(bytes) },
          }),
          { abortSignal: AbortSignal.timeout(120_000) }
        );
      } catch (error) {
        if (
          !(error instanceof S3ServiceException) ||
          error.$metadata.httpStatusCode !== 412
        ) {
          throw error;
        }
        const racedObject = await get(key, bytes.length);
        if (sha256(racedObject) !== sha256(bytes)) {
          throw new Error(`Immutable object conflict: ${key}`, {
            cause: error,
          });
        }
      }
    },
  };
}

/** Fixture writes require a separate named bucket and separate fixture-only credentials. */
export function fixtureR2Store(bucket: string, env = process.env): ObjectStore {
  if (
    bucket !== (env.R2_FIXTURE_BUCKET ?? PUBLIC_FIXTURE_BUCKET) ||
    bucket === env.R2_BUCKET
  ) {
    throw new Error(
      "Fixture bucket must be explicit and distinct from the private full-content bucket"
    );
  }
  if (!(env.R2_FIXTURE_ACCESS_KEY_ID && env.R2_FIXTURE_SECRET_ACCESS_KEY)) {
    throw new Error(
      "Fixture publication requires R2_FIXTURE_ACCESS_KEY_ID and R2_FIXTURE_SECRET_ACCESS_KEY"
    );
  }
  const store = createR2Store({
    ...env,
    R2_BUCKET: bucket,
    R2_ACCESS_KEY_ID: env.R2_FIXTURE_ACCESS_KEY_ID,
    R2_SECRET_ACCESS_KEY: env.R2_FIXTURE_SECRET_ACCESS_KEY,
  });
  return {
    bucket,
    get: (key, maxBytes) => {
      assertFixtureKey(key);
      return store.get(key, maxBytes);
    },
    head: (key) => {
      assertFixtureKey(key);
      return store.head(key);
    },
    putIfAbsent: (key, bytes) => {
      assertFixtureKey(key);
      return store.putIfAbsent(key, bytes);
    },
    metrics: store.metrics,
  };
}
