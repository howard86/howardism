import { expect, test } from "bun:test";
import { gzipSync } from "node:zlib";
import { decodeObject, sha256 } from "../content/release";

test("compressed objects cannot expand beyond the manifest's decoded bound", () => {
  const compressed = gzipSync(new Uint8Array(4096));
  let failure: unknown;
  try {
    decodeObject(
      {
        path: "content/articles/bounded.mdx",
        encoding: "gzip",
        storedBytes: compressed.length,
        objectSha256: sha256(compressed),
        decodedBytes: 32,
        decodedSha256: sha256(new Uint8Array(32)),
      },
      compressed
    );
  } catch (error) {
    failure = error;
  }
  expect(failure).toBeInstanceOf(RangeError);
  expect(failure).toHaveProperty("code", "ERR_BUFFER_TOO_LARGE");
});
