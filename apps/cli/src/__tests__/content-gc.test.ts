import { expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { runWithConcurrency } from "../concurrency";
import {
  applyGarbageCollection,
  type PublicationLedger,
  planGarbageCollection,
  protectedDigests,
} from "../content/gc";
import {
  objectKey,
  packageRelease,
  releaseKey,
  sha256,
} from "../content/release";
import type { MaintenanceStore, StoredObject } from "../content/store";
import { createTestContent } from "./content-test-fixture";

test("failed workers settle before the concurrency pool rejects", async () => {
  let finished = false;
  await expect(
    runWithConcurrency([0, 1, 2], 2, async (value) => {
      if (value === 0) {
        await Bun.sleep(1);
        throw new Error("failed");
      }
      await Bun.sleep(10);
      finished = true;
      return value;
    })
  ).rejects.toThrow("failed");
  expect(finished).toBe(true);
});

test("GC protects current, recent, ten previous, explicit rollback and candidates", () => {
  const releases = Array.from({ length: 15 }, (_, index) => ({
    digest: index.toString(16).padStart(64, "0"),
    publishedAt: `2025-01-${String(20 - index).padStart(2, "0")}T00:00:00.000Z`,
    rollback: index === 14,
    candidate: index === 13,
  }));
  const ledger: PublicationLedger = {
    current: releases[0].digest,
    releases,
    gcApproved: false,
  };
  const protectedSet = new Set(
    protectedDigests(ledger, new Date("2026-10-01"))
  );
  expect(protectedSet.size).toBe(13);
  expect(protectedSet.has(releases[12].digest)).toBe(false);
  expect(protectedSet.has(releases[14].digest)).toBe(true);
});

test("GC is review-gated and rejects stale inventory before any deletion", async () => {
  const root = await mkdtemp(resolve(tmpdir(), "content-gc-test-"));
  try {
    const fixture = resolve(root, "fixture");
    await createTestContent(fixture);
    const packaged = await packageRelease(fixture);
    const orphan = objectKey("a".repeat(64));
    let inventory: StoredObject[] = [
      { key: orphan, bytes: 1, modifiedAt: "2025-01-01T00:00:00.000Z" },
    ];
    const deleted: string[] = [];
    const store: MaintenanceStore = {
      get: () => Promise.resolve(packaged.bytes),
      head: () => Promise.resolve(null),
      putIfAbsent: () => Promise.resolve(),
      list: () => Promise.resolve(inventory),
      delete: (key) => {
        deleted.push(key);
        return Promise.resolve();
      },
    };
    const ledger: PublicationLedger = {
      current: packaged.digest,
      releases: [
        {
          digest: packaged.digest,
          publishedAt: "2026-01-01T00:00:00.000Z",
          rollback: false,
          candidate: false,
        },
      ],
      gcApproved: true,
    };
    const ledgerPath = resolve(root, "ledger.json");
    const planPath = resolve(root, "plan.json");
    await Bun.write(ledgerPath, JSON.stringify(ledger));
    const plan = await planGarbageCollection(
      store,
      ledger,
      new Date("2026-09-01")
    );
    const bytes = `${JSON.stringify(plan, null, 2)}\n`;
    await Bun.write(planPath, bytes);
    const options = {
      store,
      ledgerPath,
      planPath,
      approvedPlanSha256: sha256(bytes),
      maintenanceRoot: resolve(root, "authoring"),
      publicationFrozen: true,
    };
    await expect(
      applyGarbageCollection({ ...options, publicationFrozen: false })
    ).rejects.toThrow("freeze");
    inventory = [
      ...inventory,
      {
        key: objectKey("b".repeat(64)),
        bytes: 2,
        modifiedAt: "2025-01-01T00:00:00.000Z",
      },
    ];
    await expect(applyGarbageCollection(options)).rejects.toThrow("changed");
    expect(deleted).toEqual([]);
    inventory = inventory.slice(0, 1);
    await applyGarbageCollection(options);
    expect(deleted).toEqual([orphan]);
    expect(deleted).not.toContain(releaseKey(packaged.digest));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("GC retains ten distinct previous digests despite repeated publications", () => {
  const current = "f".repeat(64);
  const previous = Array.from({ length: 12 }, (_, index) =>
    index.toString(16).padStart(64, "0")
  );
  const ledger: PublicationLedger = {
    current,
    gcApproved: false,
    releases: [
      ...Array.from({ length: 11 }, (_, index) => ({
        digest: current,
        publishedAt: new Date(Date.UTC(2025, 0, 31 - index)).toISOString(),
        rollback: false,
        candidate: false,
      })),
      ...previous.map((digest, index) => ({
        digest,
        publishedAt: new Date(Date.UTC(2025, 0, 20 - index)).toISOString(),
        rollback: false,
        candidate: false,
      })),
    ],
  };
  const retained = protectedDigests(ledger, new Date("2026-10-01"));
  expect(retained).toContain(current);
  expect(
    previous.slice(0, 10).every((digest) => retained.includes(digest))
  ).toBe(true);
  expect(retained).not.toContain(previous[10]);
});

test("GC candidate rows do not displace ten previous approved releases", () => {
  const current = "f".repeat(64);
  const candidates = Array.from({ length: 11 }, (_, index) =>
    `c${index.toString(16)}`.padEnd(64, "0")
  );
  const previous = Array.from({ length: 11 }, (_, index) =>
    `a${index.toString(16)}`.padEnd(64, "0")
  );
  const ledger: PublicationLedger = {
    current,
    gcApproved: false,
    releases: [
      {
        digest: current,
        publishedAt: "2025-02-01T00:00:00.000Z",
        candidate: false,
        rollback: false,
      },
      ...candidates.map((digest, index) => ({
        digest,
        publishedAt: new Date(Date.UTC(2025, 0, 31 - index)).toISOString(),
        candidate: true,
        rollback: false,
      })),
      ...previous.map((digest, index) => ({
        digest,
        publishedAt: new Date(Date.UTC(2025, 0, 20 - index)).toISOString(),
        candidate: false,
        rollback: false,
      })),
    ],
  };
  const retained = protectedDigests(ledger, new Date("2026-10-01"));
  expect(candidates.every((digest) => retained.includes(digest))).toBe(true);
  expect(
    previous.slice(0, 10).every((digest) => retained.includes(digest))
  ).toBe(true);
  expect(retained).not.toContain(previous[10]);
});
