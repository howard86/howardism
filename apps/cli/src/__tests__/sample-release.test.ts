import { afterAll, afterEach, beforeAll, expect, test } from "bun:test";
import { cp, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import {
  SAMPLE_LOCK_FILE,
  SampleLockSchema,
  SampleReleaseSchema,
} from "@howardism/article-contract/manifests/sample-release";
import { prepareContent } from "../content/prepare";
import { publishContent } from "../content/publish";
import { fixtureR2Store, PUBLIC_FIXTURE_BUCKET, r2Store } from "../content/r2";
import { sha256 } from "../content/release";
import {
  type PublicFetcher,
  publicFixtureStore,
} from "../content/sample-public";
import { packSample, publishSample } from "../content/sample-publish";
import {
  loadSampleRelease,
  packageSampleRelease,
  sampleObjectKey,
  sampleReleaseKey,
} from "../content/sample-release";
import type { ObjectStore } from "../content/store";
import { createTestContent } from "./content-test-fixture";

const publicBaseUrl = "https://fixtures.example.test";
const publicAddresses = () =>
  Promise.resolve(["104.18.50.34", "2606:4700::6812:3222"]);
const temps: string[] = [];
let source: string;
beforeAll(async () => {
  source = await mkdtemp(resolve(tmpdir(), "sample-source-test-"));
  await createTestContent(source);
});
afterAll(async () => {
  await rm(source, { recursive: true, force: true });
});
afterEach(async () => {
  await Promise.all(
    temps.splice(0).map((path) => rm(path, { recursive: true, force: true }))
  );
});
async function temp(): Promise<string> {
  const path = await mkdtemp(resolve(tmpdir(), "sample-release-test-"));
  temps.push(path);
  return path;
}
function memoryStore(bucket: string) {
  const objects = new Map<string, Uint8Array>();
  const writes: string[] = [];
  const store: ObjectStore = {
    bucket,
    get(key, maxBytes) {
      const bytes = objects.get(key);
      if (!bytes || bytes.length > maxBytes) {
        throw new Error(`Missing or oversized: ${key}`);
      }
      return Promise.resolve(bytes);
    },
    head(key) {
      const bytes = objects.get(key);
      return Promise.resolve(
        bytes ? { bytes: bytes.length, sha256: sha256(bytes) } : null
      );
    },
    putIfAbsent(key, bytes) {
      if (!objects.has(key)) {
        objects.set(key, bytes);
        writes.push(key);
      }
      return Promise.resolve();
    },
  };
  return { store, objects, writes };
}
async function seeded() {
  const packaged = await packageSampleRelease(source);
  const objects = new Map<string, Uint8Array>();
  for (const [digest, bytes] of packaged.objects) {
    objects.set(sampleObjectKey(digest), bytes);
  }
  objects.set(sampleReleaseKey(packaged.digest), packaged.bytes);
  return { ...packaged, objects };
}
function publicMock(objects: Map<string, Uint8Array>, reads: string[]) {
  const fetcher: PublicFetcher = (input) => {
    const url = new URL(String(input));
    const key = url.pathname.slice(1);
    reads.push(key);
    const bytes = objects.get(key);
    return Promise.resolve(
      bytes
        ? new Response(bytes, {
            status: 200,
            headers: { "content-length": String(bytes.length) },
          })
        : new Response("missing", { status: 404 })
    );
  };
  return publicFixtureStore(publicBaseUrl, fetcher, 1000, publicAddresses);
}
async function writeLock(blogRoot: string, digest: string): Promise<void> {
  await Bun.write(
    resolve(blogRoot, SAMPLE_LOCK_FILE),
    `${JSON.stringify({ schemaVersion: 1, profile: "sample", releaseSha256: digest, publicBaseUrl })}\n`
  );
}

test("sample manifest is separate, bounded, and covers its declared coverage file", async () => {
  const first = await packageSampleRelease(source);
  const second = await packageSampleRelease(source);
  expect(first.digest).toBe(second.digest);
  expect(first.release.profile).toBe("sample");
  expect(
    first.release.files.some((file) => file.path === "coverage.json")
  ).toBe(true);
  const oversized = {
    ...first.release,
    files: first.release.files.map((file, index) =>
      index < 3 ? { ...file, storedBytes: 64 * 1024 * 1024 } : file
    ),
  };
  expect(SampleReleaseSchema.safeParse(oversized).success).toBe(false);
  expect(
    SampleReleaseSchema.safeParse({ ...first.release, profile: "full" }).success
  ).toBe(false);
  expect(
    SampleLockSchema.safeParse({
      schemaVersion: 1,
      profile: "sample",
      releaseSha256: first.digest,
      publicBaseUrl: "https://localhost.",
    }).success
  ).toBe(false);
  expect(
    SampleLockSchema.safeParse({
      schemaVersion: 1,
      profile: "sample",
      releaseSha256: first.digest,
      publicBaseUrl: "https://x.localhost.",
    }).success
  ).toBe(false);
});

test("missing sample pin fails closed unless a fixture root is explicitly injected", async () => {
  const blogRoot = await temp();
  await expect(
    prepareContent({ profile: "sample", blogRoot, report: () => undefined })
  ).rejects.toThrow("requires content.sample.lock.json");
  expect(
    await Bun.file(resolve(blogRoot, ".content-state.json")).exists()
  ).toBe(false);
  await prepareContent({
    profile: "sample",
    blogRoot,
    fixtureRoot: source,
    report: () => undefined,
  });
  expect(
    (await Bun.file(resolve(blogRoot, ".content-state.json")).json()).profile
  ).toBe("sample");
});

test("pinned public sample downloads cold, reuses warm cache, and purges inherited full cache", async () => {
  const remote = await seeded();
  const blogRoot = await temp();
  await writeLock(blogRoot, remote.digest);
  await Bun.write(
    resolve(blogRoot, ".next/cache/howardism-content/inherited"),
    "private"
  );
  const reads: string[] = [];
  const sampleStore = publicMock(remote.objects, reads);
  await prepareContent({
    profile: "sample",
    blogRoot,
    sampleStore,
    report: () => undefined,
  });
  expect(reads).toContain(sampleReleaseKey(remote.digest));
  expect(reads.some((key) => key.startsWith("fixtures/v1/objects/"))).toBe(
    true
  );
  expect(
    await Bun.file(
      resolve(blogRoot, ".next/cache/howardism-content/inherited")
    ).exists()
  ).toBe(false);
  expect(
    await Bun.file(resolve(blogRoot, "src/.content-coverage.json")).text()
  ).toBe(await Bun.file(resolve(source, "coverage.json")).text());
  expect(
    (await Bun.file(resolve(blogRoot, ".content-state.json")).json())
      .releaseSha256
  ).toBe(remote.digest);
  reads.length = 0;
  await prepareContent({
    profile: "sample",
    blogRoot,
    sampleStore,
    report: () => undefined,
  });
  expect(reads).toEqual([sampleReleaseKey(remote.digest)]);
  await expect(
    prepareContent({
      profile: "sample",
      blogRoot,
      sampleStore,
      fixtureRoot: source,
      report: () => undefined,
    })
  ).rejects.toThrow("rejects local fixture roots");
});

test("bad public manifest, profile, object and coverage fail closed without fallback", async () => {
  const remote = await seeded();
  const blogRoot = await temp();
  const reads: string[] = [];
  await writeLock(blogRoot, remote.digest);
  remote.objects.set(
    sampleReleaseKey(remote.digest),
    new Uint8Array([1, 2, 3])
  );
  await expect(
    prepareContent({
      profile: "sample",
      blogRoot,
      sampleStore: publicMock(remote.objects, reads),
      report: () => undefined,
    })
  ).rejects.toThrow("checksum");
  expect(
    await Bun.file(resolve(blogRoot, ".content-state.json")).exists()
  ).toBe(false);
  const fullProfile = Buffer.from(
    `${JSON.stringify({ ...remote.release, profile: "full" })}\n`
  );
  const fullDigest = sha256(fullProfile);
  remote.objects.set(sampleReleaseKey(fullDigest), fullProfile);
  await writeLock(blogRoot, fullDigest);
  await expect(
    prepareContent({
      profile: "sample",
      blogRoot,
      sampleStore: publicMock(remote.objects, reads),
      report: () => undefined,
    })
  ).rejects.toThrow();
  const valid = await seeded();
  const [file] = valid.release.files;
  valid.objects.set(
    sampleObjectKey(file.objectSha256),
    new Uint8Array([1, 2, 3])
  );
  await writeLock(blogRoot, valid.digest);
  await expect(
    prepareContent({
      profile: "sample",
      blogRoot,
      sampleStore: publicMock(valid.objects, reads),
      report: () => undefined,
    })
  ).rejects.toThrow("Stored integrity");
  const malformed = await temp();
  await cp(source, malformed, { recursive: true });
  await Bun.write(
    resolve(malformed, "coverage.json"),
    JSON.stringify({
      schemaVersion: 1,
      slugs: [],
      domains: [],
      locales: ["en", "zh-TW"],
      articleBodyLinks: "production",
    })
  );
  const destination = resolve(await temp(), "pack");
  await expect(packSample(malformed, destination)).rejects.toThrow("coverage");
  expect(await Bun.file(destination).exists()).toBe(false);
});

test("public reader rejects unsafe hosts, keys, redirects, errors, oversize and timeout", async () => {
  const key = sampleReleaseKey("a".repeat(64));
  for (const host of [
    "https://localhost.",
    "https://metadata.google.internal.",
    "https://127.0.0.1",
    "https://[::1]",
    "https://user:pass@fixtures.example.test",
    "https://fixtures.example.test/?x=1",
  ]) {
    expect(() => publicFixtureStore(host)).toThrow();
  }
  const calls: string[] = [];
  const fetcher: PublicFetcher = (input) => {
    calls.push(String(input));
    return Promise.resolve(
      new Response("redirect", {
        status: 302,
        headers: { location: "https://other.example/" },
      })
    );
  };
  const store = publicFixtureStore(
    publicBaseUrl,
    fetcher,
    1000,
    publicAddresses
  );
  await expect(store.get("../secret", 100)).rejects.toThrow("Unsafe");
  await expect(store.get(key, 100)).rejects.toThrow("redirect");
  expect(calls).toHaveLength(1);
  const privateDns = publicFixtureStore(publicBaseUrl, fetcher, 1000, () =>
    Promise.resolve(["127.0.0.1"])
  );
  await expect(privateDns.get(key, 100)).rejects.toThrow("private");
  expect(calls).toHaveLength(1);
  const notFound = publicFixtureStore(
    publicBaseUrl,
    async () => new Response("no", { status: 404 }),
    1000,
    publicAddresses
  );
  await expect(notFound.get(key, 100)).rejects.toThrow("HTTP 404");
  const oversized = publicFixtureStore(
    publicBaseUrl,
    async () =>
      new Response("too big", { headers: { "content-length": "1000" } }),
    1000,
    publicAddresses
  );
  await expect(oversized.get(key, 1)).rejects.toThrow("exceeds limit");
  const streaming = publicFixtureStore(
    publicBaseUrl,
    async () => new Response("stream exceeds"),
    1000,
    publicAddresses
  );
  await expect(streaming.get(key, 2)).rejects.toThrow("exceeds limit");
  const hanging = publicFixtureStore(
    publicBaseUrl,
    () => new Promise(() => undefined),
    5,
    publicAddresses
  );
  await expect(hanging.get(key, 100)).rejects.toThrow("timed out");
  const publicReader = publicFixtureStore(
    publicBaseUrl,
    async () => new Response("ok"),
    1000,
    publicAddresses
  );
  expect(await publicReader.get(key, 100)).toEqual(Buffer.from("ok"));
});

test("fixture publication requires matching bucket, uploads manifest last, and full paths reject samples", async () => {
  const fixture = memoryStore(PUBLIC_FIXTURE_BUCKET);
  const digest = await publishSample({
    root: source,
    bucket: PUBLIC_FIXTURE_BUCKET,
    store: fixture.store,
  });
  expect(fixture.writes.at(-1)).toBe(sampleReleaseKey(digest));
  expect((await loadSampleRelease(fixture.store, digest)).profile).toBe(
    "sample"
  );
  const writes = fixture.writes.length;
  expect(
    await publishSample({
      root: source,
      bucket: PUBLIC_FIXTURE_BUCKET,
      store: fixture.store,
    })
  ).toBe(digest);
  expect(fixture.writes).toHaveLength(writes);
  await expect(
    publishSample({ root: source, bucket: "private", store: fixture.store })
  ).rejects.toThrow("matching fixture bucket");
  await expect(
    publishContent({ root: source, store: fixture.store, initial: true })
  ).rejects.toThrow("Sample content");
  expect(() =>
    r2Store({ R2_BUCKET: PUBLIC_FIXTURE_BUCKET } as NodeJS.ProcessEnv)
  ).toThrow("public fixture bucket");
});

test("sample pack refuses a mislabeled full corpus before writing public bytes", async () => {
  const root = await temp();
  await cp(source, root, { recursive: true });
  for (let index = 0; index < 33; index += 1) {
    await Bun.write(
      resolve(root, `content/articles/extra-${index}.mdx`),
      "---\ntitle: Extra\n---\nBody"
    );
    await Bun.write(
      resolve(root, `content/articles-zh-TW/extra-${index}.mdx`),
      "---\ntitle: Extra\n---\nBody"
    );
  }
  const destination = resolve(await temp(), "pack");
  await expect(packSample(root, destination)).rejects.toThrow(
    "bounded bilingual fixture limits"
  );
  expect(await Bun.file(destination).exists()).toBe(false);
});

test("fixture credentials expose no maintenance API and reject full-content keys", () => {
  const fixture = fixtureR2Store(PUBLIC_FIXTURE_BUCKET, {
    R2_ACCOUNT_ID: "a".repeat(32),
    R2_BUCKET: "private-content",
    R2_FIXTURE_ACCESS_KEY_ID: "fixture-key",
    R2_FIXTURE_SECRET_ACCESS_KEY: "fixture-secret",
  });
  expect("delete" in fixture).toBe(false);
  expect("list" in fixture).toBe(false);
  expect(() =>
    fixture.get(`objects/v1/sha256/aa/${"a".repeat(64)}`, 100)
  ).toThrow("namespace");
  expect(() => fixture.head(`releases/v1/${"a".repeat(64)}.json`)).toThrow(
    "namespace"
  );
  expect(() =>
    fixture.putIfAbsent("coverage.json", new Uint8Array([1]))
  ).toThrow("namespace");
});
