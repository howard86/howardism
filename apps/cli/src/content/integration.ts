import { mkdir, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { type PreparationMetrics, prepareContent } from "./prepare";
import { publishContent } from "./publish";
import { r2Store } from "./r2";
import { packageRelease } from "./release";

/** Explicit operator command: writes immutable candidate releases, never pins/deploys/deletes. */
export async function realR2Acceptance(
  root: string,
  baseDigest?: string
): Promise<void> {
  const store = r2Store();
  const releaseSha256 = await publishContent({
    root,
    store,
    baseDigest,
    initial: !baseDigest,
  });
  const second = await publishContent({
    root,
    store,
    baseDigest: releaseSha256,
  });
  if (releaseSha256 !== second) {
    throw new Error("Real-R2 no-op publication changed release identity");
  }
  const scratch = await mkdtemp(resolve(tmpdir(), "howardism-real-r2-"));
  const reports: PreparationMetrics[] = [];
  try {
    await mkdir(resolve(scratch, "src"));
    await Bun.write(
      resolve(scratch, "content.lock.json"),
      JSON.stringify({ schemaVersion: 1, releaseSha256 })
    );
    await prepareContent({
      blogRoot: scratch,
      profile: "full",
      store,
      report: (report) => reports.push({ ...report }),
    });
    const restored = await packageRelease(resolve(scratch, "src"));
    if (restored.digest !== releaseSha256) {
      throw new Error("Real-R2 round trip changed content bytes");
    }
    await prepareContent({
      blogRoot: scratch,
      profile: "full",
      store,
      report: (report) => reports.push({ ...report }),
    });
    if (reports[1].downloadedBytes !== 0 || reports[1].cacheMisses !== 0) {
      throw new Error("Warm preparation fetched content objects");
    }
    const verifiedPrevious = baseDigest ?? releaseSha256;
    await Bun.write(
      resolve(scratch, "content.lock.json"),
      JSON.stringify({ schemaVersion: 1, releaseSha256: verifiedPrevious })
    );
    await prepareContent({ blogRoot: scratch, profile: "full", store });
    process.stdout.write(
      `${JSON.stringify({ realR2Acceptance: "passed", releaseSha256, restoredRelease: verifiedPrevious, reports, deploymentParity: "pending", vercelCache: "pending" }, null, 2)}\n`
    );
  } finally {
    await rm(scratch, { recursive: true, force: true });
  }
}
