import { Database } from "bun:sqlite";
import { cp, lstat, mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { sha256 } from "./release";
import { requireAuthoringRoot } from "./workspace";

/** Consistent SQLite snapshots include committed WAL contents, without copying live WAL files. */
export async function backupLocalState(
  cliRoot: string,
  destination: string
): Promise<void> {
  requireAuthoringRoot(destination);
  try {
    await lstat(destination);
    throw new Error("Local-state backup destination already exists");
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
  await mkdir(destination, { recursive: true });
  const inventory: { name: string; bytes: number; sha256: string }[] = [];
  for (const name of [
    ".translate-glossary.db",
    ".translate-tracking.db",
    ".translate-glossary.json",
  ]) {
    const source = resolve(cliRoot, name);
    // biome-ignore lint/performance/noAwaitInLoops: Back up the small, fixed set of independent local stores in order.
    if (!(await Bun.file(source).exists())) {
      continue;
    }
    if (name.endsWith(".db")) {
      const database = new Database(source, { readonly: true });
      try {
        await Bun.write(resolve(destination, name), database.serialize());
      } finally {
        database.close();
      }
    } else {
      await cp(source, resolve(destination, name));
    }
    const bytes = new Uint8Array(
      await Bun.file(resolve(destination, name)).arrayBuffer()
    );
    inventory.push({ name, bytes: bytes.length, sha256: sha256(bytes) });
  }
  await Bun.write(
    resolve(destination, "inventory.json"),
    `${JSON.stringify(inventory, null, 2)}\n`
  );
}
