import { cp, lstat } from "node:fs/promises";
import { resolve } from "node:path";
import { packageRelease } from "./release";
import { validateSnapshot } from "./validate";
import {
  assertFullContentRoot,
  maintenanceLockPath,
  requireAuthoringRoot,
  withDirectoryLock,
  withSnapshot,
} from "./workspace";

export async function packCandidate(
  root: string,
  destination: string
): Promise<string> {
  requireAuthoringRoot(root);
  await assertFullContentRoot(root);
  requireAuthoringRoot(destination);
  try {
    await lstat(destination);
    throw new Error("Candidate destination already exists");
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
    await maintenanceLockPath(root),
    async () =>
      await withSnapshot(root, async (snapshot) => {
        await validateSnapshot(snapshot, "full");
        const packaged = await packageRelease(snapshot);
        await cp(snapshot, resolve(destination, "snapshot"), {
          recursive: true,
        });
        await Bun.write(resolve(destination, "release.json"), packaged.bytes);
        process.stdout.write(
          `${JSON.stringify({ candidate: resolve(destination), releaseSha256: packaged.digest, files: packaged.release.files.length, storedBytes: [...packaged.objects.values()].reduce((total, bytes) => total + bytes.length, 0) })}\n`
        );
        return packaged.digest;
      })
  );
}
