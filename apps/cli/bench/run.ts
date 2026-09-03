// Runs every *.bench.ts in this directory, or only those whose file name
// contains the first argument. Usage: bun run bench [filter]
import { readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const dir = dirname(fileURLToPath(import.meta.url));
const filter = process.argv[2] ?? "";
const files = readdirSync(dir)
  .filter((name) => name.endsWith(".bench.ts") && name.includes(filter))
  .sort();

async function runFrom(index: number): Promise<void> {
  const name = files[index];
  if (name === undefined) {
    return;
  }
  process.stdout.write(`\n== ${name}\n`);
  await import(join(dir, name));
  await runFrom(index + 1);
}

await runFrom(0);
