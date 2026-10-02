import { mkdtemp, rename, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { ContentLockSchema } from "@howardism/article-contract/manifests/content-release";
import { BLOG_ROOT } from "./paths";
import { prepareContent } from "./prepare";
import type { ObjectStore } from "./store";
import { withDirectoryLock } from "./workspace";

/** Verify every referenced object and application contract before changing the pin. */
export async function pinRelease(
  digest: string,
  store: ObjectStore,
  blogRoot = BLOG_ROOT
): Promise<void> {
  const lock = ContentLockSchema.parse({
    schemaVersion: 1,
    releaseSha256: digest,
  });
  const scratch = await mkdtemp(resolve(tmpdir(), "howardism-pin-"));
  try {
    await Bun.write(
      resolve(scratch, "content.lock.json"),
      `${JSON.stringify(lock)}\n`
    );
    await prepareContent({ blogRoot: scratch, profile: "full", store });
    await withDirectoryLock(
      resolve(blogRoot, ".content-prepare-lock"),
      async () => {
        const temporaryLock = resolve(
          blogRoot,
          `.content-lock-${crypto.randomUUID()}.tmp`
        );
        try {
          await Bun.write(temporaryLock, `${JSON.stringify(lock, null, 2)}\n`);
          await rename(temporaryLock, resolve(blogRoot, "content.lock.json"));
        } finally {
          await rm(temporaryLock, { force: true });
        }
      }
    );
  } finally {
    await rm(scratch, { recursive: true, force: true });
  }
}
