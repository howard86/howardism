// Measures translate/engines.ts's drainStream (see M7): it slices the
// buffer down to the unconsumed remainder on every line (`buffer =
// buffer.slice(newline + 1)`), so each following `indexOf` re-scans a
// buffer that keeps getting re-flattened — O(chunk length × line count).
// Feeds a synthetic 5MB/50k-line JSONL transcript, matching codex's
// `--json` stdout shape, through a ReadableStream in ~64KB pushes.
import { drainStream } from "../src/translate/engines.ts";
import { benchAsync, checksum, log } from "./harness.ts";

const LINE_COUNT = 50_000;
const CHUNK_BYTES = 64 * 1024;

function buildJsonlBytes(): Uint8Array {
  const lines: string[] = [];
  for (let i = 0; i < LINE_COUNT; i += 1) {
    lines.push(
      JSON.stringify({
        type: "turn.completed",
        usage: { input_tokens: i, output_tokens: i % 128 },
      })
    );
  }
  return new TextEncoder().encode(`${lines.join("\n")}\n`);
}

const bytes = buildJsonlBytes();
log(
  `synthetic JSONL: ${LINE_COUNT} lines, ${(bytes.length / 1024 / 1024).toFixed(2)} MB`
);

function makeStream(): ReadableStream<Uint8Array> {
  let offset = 0;
  return new ReadableStream({
    pull(controller) {
      if (offset >= bytes.length) {
        controller.close();
        return;
      }
      controller.enqueue(bytes.slice(offset, offset + CHUNK_BYTES));
      offset += CHUNK_BYTES;
    },
  });
}

const result = await benchAsync("drainStream — 5MB/50k lines", () =>
  drainStream(makeStream())
);

log(`checksum=${checksum(result)} lines=${result.split("\n").length}`);
