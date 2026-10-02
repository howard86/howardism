import { afterAll, afterEach, beforeAll, expect, test } from "bun:test";
import { cp, lstat, mkdir, mkdtemp, rm, symlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import {
  ContentReleaseSchema,
  contentPathSchema,
} from "@howardism/article-contract/manifests/content-release";
import { packCandidate } from "../content/pack";
import { contentPaths, REPO_ROOT } from "../content/paths";
import { prepareContent, selectProfile } from "../content/prepare";
import { articleChanges, publishContent } from "../content/publish";
import {
  decodeObject,
  inventory,
  objectKey,
  packageRelease,
  releaseKey,
  sha256,
} from "../content/release";
import { retentionPlan } from "../content/retention";
import type { ObjectStore } from "../content/store";
import {
  exportBaseline,
  maintenanceLockPath,
  withDirectoryLock,
} from "../content/workspace";
import { buildIndex } from "../search-index";
import { createTestContent } from "./content-test-fixture";

let fixtures: string;
beforeAll(async () => {
  fixtures = await mkdtemp(resolve(tmpdir(), "content-shared-test-"));
  await createTestContent(fixtures);
});
afterAll(async () => {
  await rm(fixtures, { recursive: true, force: true });
});
const temps: string[] = [];
afterEach(async () => {
  await Promise.all(
    temps.splice(0).map((path) => rm(path, { recursive: true, force: true }))
  );
});
async function temp(): Promise<string> {
  const path = await mkdtemp(resolve(tmpdir(), "content-release-test-"));
  temps.push(path);
  return path;
}
function memoryStore() {
  const objects = new Map<string, Uint8Array>();
  const reads: string[] = [];
  const writes: string[] = [];
  const store: ObjectStore = {
    get(key, maxBytes) {
      reads.push(key);
      const bytes = objects.get(key);
      if (!bytes || bytes.length > maxBytes) {
        throw new Error(`Missing/oversized: ${key}`);
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
      const existing = objects.get(key);
      if (existing && sha256(existing) !== sha256(bytes)) {
        throw new Error("Immutable conflict");
      }
      if (!existing) {
        writes.push(key);
        objects.set(key, bytes);
      }
      return Promise.resolve();
    },
  };
  return { store, objects, reads, writes };
}
async function seeded() {
  const remote = memoryStore();
  const packaged = await packageRelease(fixtures);
  for (const [digest, bytes] of packaged.objects) {
    remote.objects.set(objectKey(digest), bytes);
  }
  remote.objects.set(releaseKey(packaged.digest), packaged.bytes);
  const blogRoot = await temp();
  await Bun.write(
    resolve(blogRoot, "content.lock.json"),
    JSON.stringify({ schemaVersion: 1, releaseSha256: packaged.digest })
  );
  return { ...packaged, ...remote, blogRoot };
}

test("release packing is deterministic and restores every exact file", async () => {
  const first = await packageRelease(fixtures);
  const second = await packageRelease(fixtures);
  expect(first.digest).toBe(second.digest);
  for (const file of first.release.files) {
    expect(
      decodeObject(
        file,
        first.objects.get(file.objectSha256) ?? new Uint8Array()
      )
    ).toEqual(
      new Uint8Array(await Bun.file(resolve(fixtures, file.path)).arrayBuffer())
    );
  }
});

test("reject unsafe paths, duplicate destinations, false counts, sample and unsupported release schemas", async () => {
  for (const path of [
    "../secret",
    "/tmp/x",
    "content/articles/../x.mdx",
    "content/articles/a.mdx/evil",
    "content\\articles\\x.mdx",
    "data/credentials.json",
  ]) {
    expect(contentPathSchema.safeParse(path).success).toBe(false);
  }
  const { release } = await packageRelease(fixtures);
  for (const mutation of [
    { ...release, profile: "sample" },
    { ...release, schemaVersion: 2 },
    { ...release, files: [...release.files, release.files[0]] },
    { ...release, counts: { ...release.counts, assets: 0 } },
  ]) {
    expect(ContentReleaseSchema.safeParse(mutation).success).toBe(false);
  }
});

test("reject symlinks and corrupted stored or decoded content", async () => {
  const root = await temp();
  await cp(fixtures, root, { recursive: true });
  await symlink("/etc/passwd", resolve(root, "content/articles/evil.mdx"));
  await expect(inventory(root)).rejects.toThrow("Symlink");
  const { release, objects } = await packageRelease(fixtures);
  const [file] = release.files;
  expect(() => decodeObject(file, new Uint8Array([1, 2]))).toThrow(
    "Stored integrity"
  );
  expect(() =>
    decodeObject(
      { ...file, decodedSha256: "a".repeat(64) },
      objects.get(file.objectSha256) ?? new Uint8Array()
    )
  ).toThrow("Decoded integrity");
});

test("cold, warm and corrupted-cache preparation use exact pinned content without per-object HEAD", async () => {
  const remote = await seeded();
  await prepareContent({
    profile: "full",
    blogRoot: remote.blogRoot,
    store: {
      ...remote.store,
      head: () => {
        throw new Error("preparation must not HEAD");
      },
    },
  });
  const coldReads = remote.reads.filter((key) =>
    key.startsWith("objects/")
  ).length;
  expect(coldReads).toBe(remote.release.files.length);
  const state = await Bun.file(
    resolve(remote.blogRoot, ".content-state.json")
  ).text();
  await Bun.write(
    resolve(remote.blogRoot, "src/content/articles/obsolete.mdx"),
    "obsolete"
  );
  remote.reads.length = 0;
  await prepareContent({
    profile: "full",
    blogRoot: remote.blogRoot,
    store: remote.store,
  });
  expect(remote.reads).toEqual([releaseKey(remote.digest)]);
  expect(
    await Bun.file(resolve(remote.blogRoot, ".content-state.json")).text()
  ).toBe(state);
  expect(
    await Bun.file(
      resolve(remote.blogRoot, "src/content/articles/obsolete.mdx")
    ).exists()
  ).toBe(false);
  const cached = resolve(
    remote.blogRoot,
    ".next/cache/howardism-content",
    remote.release.files[0].objectSha256
  );
  await Bun.write(cached, "broken");
  remote.reads.length = 0;
  await prepareContent({
    profile: "full",
    blogRoot: remote.blogRoot,
    store: remote.store,
  });
  expect(remote.reads.filter((key) => key.startsWith("objects/"))).toHaveLength(
    1
  );
  for (const file of remote.release.files) {
    expect(
      sha256(
        new Uint8Array(
          await Bun.file(
            resolve(remote.blogRoot, "src", file.path)
          ).arrayBuffer()
        )
      )
    ).toBe(file.decodedSha256);
  }
});

test("files sharing identical bytes are fetched once and counted once, cold or warm", async () => {
  const root = await temp();
  await cp(fixtures, root, { recursive: true });
  const [first, second] = (await inventory(root)).filter((path) =>
    path.startsWith("content/assets/")
  );
  await Bun.write(resolve(root, second), Bun.file(resolve(root, first)));
  const packaged = await packageRelease(root);
  const distinct = new Set(packaged.release.files.map((f) => f.objectSha256));
  expect(distinct.size).toBeLessThan(packaged.release.files.length);
  const remote = memoryStore();
  for (const [digest, bytes] of packaged.objects) {
    remote.objects.set(objectKey(digest), bytes);
  }
  remote.objects.set(releaseKey(packaged.digest), packaged.bytes);
  const blogRoot = await temp();
  await Bun.write(
    resolve(blogRoot, "content.lock.json"),
    JSON.stringify({ schemaVersion: 1, releaseSha256: packaged.digest })
  );
  const reports: {
    cacheHits: number;
    cacheMisses: number;
    requiredObjects: number;
  }[] = [];
  for (let run = 0; run < 2; run += 1) {
    // biome-ignore lint/performance/noAwaitInLoops: the warm run must follow the cold run
    await prepareContent({
      profile: "full",
      blogRoot,
      store: remote.store,
      concurrency: 8,
      report: (report) => reports.push({ ...report }),
    });
  }
  expect(reports[0]).toMatchObject({
    requiredObjects: distinct.size,
    cacheMisses: distinct.size,
    cacheHits: 0,
  });
  expect(reports[1]).toMatchObject({
    requiredObjects: distinct.size,
    cacheMisses: 0,
    cacheHits: distinct.size,
  });
  expect(remote.reads.filter((key) => key.startsWith("objects/"))).toHaveLength(
    distinct.size
  );
  expect(await Bun.file(resolve(blogRoot, "src", second)).bytes()).toEqual(
    await Bun.file(resolve(root, first)).bytes()
  );
});

test("failed preparation leaves old active files and no ready state; no sample fallback", async () => {
  const remote = await seeded();
  await mkdir(resolve(remote.blogRoot, "src/content/articles"), {
    recursive: true,
  });
  await Bun.write(
    resolve(remote.blogRoot, "src/content/articles/old.mdx"),
    "old"
  );
  remote.objects.delete(objectKey(remote.release.files[0].objectSha256));
  await expect(
    prepareContent({
      profile: "full",
      blogRoot: remote.blogRoot,
      store: remote.store,
    })
  ).rejects.toThrow("Missing");
  expect(
    await Bun.file(
      resolve(remote.blogRoot, "src/content/articles/old.mdx")
    ).text()
  ).toBe("old");
  expect(
    await Bun.file(resolve(remote.blogRoot, ".content-state.json")).exists()
  ).toBe(false);
});

test("sample preparation is offline, purges inherited cache and holds the lock through consumers", async () => {
  const blogRoot = await temp();
  await Bun.write(
    resolve(blogRoot, ".next/cache/howardism-content/inherited"),
    "production"
  );
  await prepareContent(
    { profile: "sample", fixtureRoot: fixtures, blogRoot },
    async () => {
      expect(
        (await lstat(resolve(blogRoot, ".content-prepare-lock"))).isDirectory()
      ).toBe(true);
      await expect(
        prepareContent({ profile: "sample", fixtureRoot: fixtures, blogRoot })
      ).rejects.toThrow("locked");
    }
  );
  expect(
    await Bun.file(
      resolve(blogRoot, ".next/cache/howardism-content/inherited")
    ).exists()
  ).toBe(false);
  expect(
    (await Bun.file(resolve(blogRoot, ".content-state.json")).json()).profile
  ).toBe("sample");
});

test("publisher is idempotent and uploads the manifest last; failed publication creates no release", async () => {
  const root = await temp();
  await cp(fixtures, root, { recursive: true });
  await rm(resolve(root, "coverage.json"));
  const remote = memoryStore();
  const digest = await publishContent({
    root,
    store: remote.store,
    initial: true,
  });
  expect(remote.writes.at(-1)).toBe(releaseKey(digest));
  const writes = remote.writes.length;
  expect(
    await publishContent({ root, store: remote.store, baseDigest: digest })
  ).toBe(digest);
  expect(remote.writes.length).toBe(writes);
  const failed = memoryStore();
  await expect(
    publishContent({
      root,
      initial: true,
      store: {
        ...failed.store,
        putIfAbsent: () => {
          throw new Error("upload failed");
        },
      },
    })
  ).rejects.toThrow("upload failed");
  expect(
    [...failed.objects.keys()].some((key) => key.startsWith("releases/"))
  ).toBe(false);
});

test("profiles fail closed and authoring publication requires explicit roots and bases", async () => {
  expect(selectProfile({})).toBe("sample");
  expect(selectProfile({ VERCEL_ENV: "production" })).toBe("full");
  expect(() =>
    selectProfile({ VERCEL_ENV: "production", CONTENT_PROFILE: "sample" })
  ).toThrow("Production");
  expect(() =>
    selectProfile({ VERCEL_ENV: "preview", CONTENT_PROFILE: "full" })
  ).toThrow("preview");
  const { store } = memoryStore();
  await expect(
    publishContent({ root: REPO_ROOT, store, initial: true })
  ).rejects.toThrow("outside");
  await expect(publishContent({ root: await temp(), store })).rejects.toThrow(
    "base release"
  );
});

test("release diff and retention protect retained and rollback objects and grace-period uploads", async () => {
  const { release, digest } = await packageRelease(fixtures);
  const modified = {
    ...release,
    files: release.files.filter((f) => !f.path.startsWith("content/articles/")),
  };
  expect(articleChanges(release, modified).en.removed.length).toBe(
    release.counts.articlesByLocale.en
  );
  const key = objectKey(release.files[0].objectSha256);
  const orphan = objectKey("a".repeat(64));
  const young = objectKey("b".repeat(64));
  const plan = retentionPlan(
    [{ digest, release }],
    [
      { key, bytes: 1, modifiedAt: "2025-01-01" },
      { key: orphan, bytes: 2, modifiedAt: "2025-01-01" },
      { key: young, bytes: 3, modifiedAt: "2026-09-30" },
    ],
    new Date("2026-09-01")
  );
  expect(plan.candidates.map((o) => o.key)).toEqual([orphan]);
  expect(plan.reclaimableBytes).toBe(2);
});

test("redirected search indexes read only the supplied article directory", async () => {
  const root = await temp();
  await Bun.write(
    resolve(root, "only.mdx"),
    "---\ntitle: Isolated\ndescription: Isolated source\ntag: test\n---\nBody"
  );
  const index = await buildIndex(
    "2026-10-01",
    { generatedOn: "2026-10-01", backlinks: {}, related: {} },
    root
  );
  expect(index.entries.map((entry) => entry.slug)).toEqual(["only"]);
  expect(contentPaths(root).articles).toBe(resolve(root, "content/articles"));
});

test("corrupt pinned manifests fail before consuming input and cannot select another release", async () => {
  const remote = await seeded();
  remote.objects.set(releaseKey(remote.digest), new Uint8Array([1, 2, 3]));
  let consumed = false;
  await expect(
    prepareContent(
      { profile: "full", blogRoot: remote.blogRoot, store: remote.store },
      () => {
        consumed = true;
        return Promise.resolve();
      }
    )
  ).rejects.toThrow("checksum");
  expect(consumed).toBe(false);
});

test("sample/full transitions leave no stale content and respect cache budgets", async () => {
  const remote = await seeded();
  await prepareContent({
    profile: "full",
    blogRoot: remote.blogRoot,
    store: remote.store,
    cacheBudgetBytes: 0,
  });
  const cache = resolve(remote.blogRoot, ".next/cache/howardism-content");
  expect(
    await Bun.file(
      resolve(cache, remote.release.files[0].objectSha256)
    ).exists()
  ).toBe(false);
  await Bun.write(
    resolve(remote.blogRoot, "src/data/manual.json"),
    '{"keep":true}'
  );
  await prepareContent({
    profile: "sample",
    blogRoot: remote.blogRoot,
    fixtureRoot: fixtures,
  });
  expect(
    await Bun.file(resolve(remote.blogRoot, "src/data/manual.json")).json()
  ).toEqual({ keep: true });
  await prepareContent({
    profile: "full",
    blogRoot: remote.blogRoot,
    store: remote.store,
  });
  expect(
    (await Bun.file(resolve(remote.blogRoot, ".content-state.json")).json())
      .releaseSha256
  ).toBe(remote.digest);
});

test("an English change and a translation change fetch only their changed objects", async () => {
  const remote = await seeded();
  await prepareContent({
    profile: "full",
    blogRoot: remote.blogRoot,
    store: remote.store,
  });
  const root = await temp();
  await cp(fixtures, root, { recursive: true });
  for (const directory of ["articles", "articles-zh-TW"]) {
    const path = resolve(root, `content/${directory}/test-agent-security.mdx`);
    const source = await Bun.file(path).text();
    // A harmless transport-only trailing newline leaves translation surface hashes intact.
    await Bun.write(path, `${source}\n`);
    const changed = await packageRelease(root);
    for (const [digest, bytes] of changed.objects) {
      remote.objects.set(objectKey(digest), bytes);
    }
    remote.objects.set(releaseKey(changed.digest), changed.bytes);
    await Bun.write(
      resolve(remote.blogRoot, "content.lock.json"),
      JSON.stringify({ schemaVersion: 1, releaseSha256: changed.digest })
    );
    remote.reads.length = 0;
    await prepareContent({
      profile: "full",
      blogRoot: remote.blogRoot,
      store: remote.store,
    });
    expect(
      remote.reads.filter((key) => key.startsWith("objects/"))
    ).toHaveLength(1);
  }
});

test("both profiles reject a linked cache ancestor before changing external cache", async () => {
  const remote = await seeded();
  const outside = await temp();
  await Bun.write(resolve(outside, "cache/howardism-content/keep"), "private");
  await symlink(outside, resolve(remote.blogRoot, ".next"));
  for (const profile of ["sample", "full"] as const) {
    await expect(
      prepareContent({
        profile,
        blogRoot: remote.blogRoot,
        fixtureRoot: fixtures,
        store: remote.store,
      })
    ).rejects.toThrow("Unsafe content cache directory");
    expect(
      await Bun.file(resolve(outside, "cache/howardism-content/keep")).text()
    ).toBe("private");
  }
});

test("prepared sample provenance blocks export, packing and publication", async () => {
  const blogRoot = await temp();
  await prepareContent({ profile: "sample", blogRoot, fixtureRoot: fixtures });
  const root = resolve(blogRoot, "src");
  expect(await Bun.file(resolve(root, ".content-coverage.json")).exists()).toBe(
    true
  );
  const destination = resolve(await temp(), "candidate");
  const remote = memoryStore();
  await expect(exportBaseline(root, destination)).rejects.toThrow(
    "Sample content"
  );
  await expect(packCandidate(root, destination)).rejects.toThrow(
    "Sample content"
  );
  await expect(
    publishContent({ root, store: remote.store, initial: true })
  ).rejects.toThrow("Sample content");
  expect(remote.writes).toEqual([]);
  expect(await Bun.file(destination).exists()).toBe(false);
});

test("packed publication checks frozen digest under the shared maintenance lock before uploads", async () => {
  const root = await temp();
  await cp(fixtures, root, { recursive: true });
  await rm(resolve(root, "coverage.json"));
  const maintenanceRoot = await temp();
  const remote = memoryStore();
  await expect(
    publishContent({
      root,
      store: remote.store,
      initial: true,
      expectedDigest: "a".repeat(64),
    })
  ).rejects.toThrow("maintenance root");
  await expect(
    publishContent({
      root,
      store: remote.store,
      initial: true,
      expectedDigest: "a".repeat(64),
      maintenanceRoot,
    })
  ).rejects.toThrow("Packed candidate changed");
  expect(remote.writes).toEqual([]);
  const alias = resolve(await temp(), "alias");
  await symlink(maintenanceRoot, alias);
  const lock = await maintenanceLockPath(`${alias}/`);
  expect(lock).toBe(await maintenanceLockPath(maintenanceRoot));
  await withDirectoryLock(lock, async () => {
    await expect(
      publishContent({
        root,
        store: remote.store,
        initial: true,
        maintenanceRoot,
      })
    ).rejects.toThrow("locked");
  });
  expect(remote.writes).toEqual([]);
});
