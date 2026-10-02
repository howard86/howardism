/** biome-ignore-all lint/performance/noAwaitInLoops: Filesystem operations are deliberately serialized to bound memory and preserve snapshot/replacement order. */
import { cp, lstat, mkdir, mkdtemp, realpath, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, dirname, resolve, sep } from "node:path";
import { contentPaths, REPO_ROOT } from "./paths";
import { packageRelease } from "./release";

export function requireAuthoringRoot(root: string): string {
  const path = resolve(root);
  if (path === REPO_ROOT || path.startsWith(`${REPO_ROOT}${sep}`)) {
    throw new Error(
      "Full authoring workspace must be outside the application repository"
    );
  }
  return path;
}

async function canonicalPath(
  path: string,
  missing: string[] = []
): Promise<string> {
  try {
    return resolve(await realpath(path), ...missing);
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
    const parent = dirname(path);
    if (parent === path) {
      throw error;
    }
    return await canonicalPath(parent, [basename(path), ...missing]);
  }
}

export async function maintenanceLockPath(root: string): Promise<string> {
  const canonical = await canonicalPath(requireAuthoringRoot(root));
  return `${requireAuthoringRoot(canonical)}.maintenance-lock`;
}

export async function assertFullContentRoot(root: string): Promise<void> {
  for (const marker of ["coverage.json", ".content-coverage.json"]) {
    try {
      await lstat(resolve(root, marker));
      throw new Error(
        `Sample content cannot be used as a full release: ${marker}`
      );
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

export async function withDirectoryLock<T>(
  path: string,
  operation: () => Promise<T>
): Promise<T> {
  await mkdir(dirname(path), { recursive: true });
  try {
    await mkdir(path);
  } catch (error) {
    throw new Error(
      `Content workspace is locked: ${path}. Verify no process is using it before removing a stale lock.`,
      { cause: error }
    );
  }
  try {
    return await operation();
  } finally {
    await rm(path, { recursive: true, force: true });
  }
}

/** Copy exact bytes; detect authoring changes during the copy. */
export async function withSnapshot<T>(
  root: string,
  operation: (snapshot: string) => Promise<T>
): Promise<T> {
  const temp = await mkdtemp(resolve(tmpdir(), "howardism-content-"));
  try {
    await assertFullContentRoot(root);
    const before = await packageRelease(root);
    const snapshot = resolve(temp, "snapshot");
    await mkdir(snapshot);
    for (const name of ["content", "data"]) {
      await cp(resolve(root, name), resolve(snapshot, name), {
        recursive: true,
        dereference: false,
      });
    }
    await assertFullContentRoot(root);
    const [copied, after] = await Promise.all([
      packageRelease(snapshot),
      packageRelease(root),
    ]);
    if (before.digest !== copied.digest || before.digest !== after.digest) {
      throw new Error(
        "Authoring content changed while snapshotting; stop writers and retry"
      );
    }
    return await operation(snapshot);
  } finally {
    await rm(temp, { recursive: true, force: true });
  }
}

export async function exportBaseline(
  source: string,
  destination: string
): Promise<void> {
  requireAuthoringRoot(destination);
  await assertFullContentRoot(source);
  const dest = resolve(destination);
  try {
    await lstat(dest);
    throw new Error("Export destination already exists");
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
  await withSnapshot(source, async (snapshot) => {
    await mkdir(dest, { recursive: true });
    for (const name of ["content", "data"]) {
      await cp(resolve(snapshot, name), resolve(dest, name), {
        recursive: true,
      });
    }
    const packaged = await packageRelease(dest);
    await Bun.write(
      `${dest}.inventory.json`,
      `${JSON.stringify({ releaseSha256: packaged.digest, files: packaged.release.files }, null, 2)}\n`
    );
  });
}

export const localContentRoot = (): string => contentPaths().root;
