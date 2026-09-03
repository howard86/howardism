// Measures apps/blog/src/data/search-index.json's size (see M5/M6) and the
// importer's per-file MDX read loop, serial vs runWithConcurrency (see M5).
import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { gzipSync } from "node:zlib";

import { runWithConcurrency } from "../src/concurrency.ts";
import { ARTICLES_DIR, benchAsync, DATA_DIR, log } from "./harness.ts";

const indexPath = resolve(DATA_DIR, "search-index.json");
const raw = await readFile(indexPath, "utf8");
const gzipped = gzipSync(raw);
log(`search-index.json: raw=${raw.length}B gzip=${gzipped.length}B`);

const filenames = (await readdir(ARTICLES_DIR)).filter((name) =>
  name.endsWith(".mdx")
);

await benchAsync("read loop — serial", async () => {
  const out: string[] = [];
  for (const name of filenames) {
    out.push(await readFile(resolve(ARTICLES_DIR, name), "utf8"));
  }
  return out.length;
});

await benchAsync("read loop — runWithConcurrency(16)", () =>
  runWithConcurrency(filenames, 16, (name) =>
    readFile(resolve(ARTICLES_DIR, name), "utf8")
  )
);
