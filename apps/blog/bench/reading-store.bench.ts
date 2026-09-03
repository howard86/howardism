// Measures apps/blog/src/lib/reading-store.ts (see M3): `isSaved` re-reads
// and re-parses the whole saved list per call, and `recordProgress` parses,
// filters twice, spreads, slices and re-stringifies the history every tick.
// No DOM here, so a minimal in-memory Storage stands in for localStorage.
import {
  getHistory,
  getSaved,
  isSaved,
  recordProgress,
} from "../src/lib/reading-store";
import { bench, checksum, log } from "./harness";

class FakeStorage implements Storage {
  private readonly store = new Map<string, string>();

  get length(): number {
    return this.store.size;
  }

  clear(): void {
    this.store.clear();
  }

  getItem(key: string): string | null {
    return this.store.has(key) ? (this.store.get(key) as string) : null;
  }

  key(index: number): string | null {
    return [...this.store.keys()][index] ?? null;
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }
}

(globalThis as unknown as { localStorage: Storage }).localStorage =
  new FakeStorage();

// Seed a 100-entry saved list, then time 200 isSaved() lookups against it —
// the shape of a listing page's SaveButton column checking every row.
for (let i = 0; i < 100; i += 1) {
  localStorage.setItem(
    "howardism:reading-saved",
    JSON.stringify(
      Array.from({ length: i + 1 }, (_, j) => ({
        slug: `slug-${j}`,
        savedAt: j,
      }))
    )
  );
}
const checkSlugs = Array.from({ length: 200 }, (_, i) => `slug-${i}`);
bench("isSaved x200 (100-entry saved list)", () => {
  let hits = 0;
  for (const slug of checkSlugs) {
    if (isSaved(slug)) {
      hits += 1;
    }
  }
  return hits;
});

// Seed a full 50-entry history, then time 1000 recordProgress ticks against
// it — one throttled scroll tick per bench run, matching resume-reading.tsx.
localStorage.removeItem("howardism:reading-history");
for (let i = 0; i < 50; i += 1) {
  recordProgress(`hist-${i}`, 0.3);
}
let tick = 0;
bench(
  "recordProgress — per tick (50-entry history)",
  () => {
    tick += 1;
    recordProgress("hist-0", 0.25 + (tick % 70) / 100);
  },
  1000
);

// Timestamps are wall-clock, so drop them before checksumming — only the
// slug/pct shape needs to match between a before/after run.
log(
  `checksum saved=${checksum(getSaved().map((e) => e.slug))} history=${checksum(getHistory().map((e) => ({ slug: e.slug, pct: e.pct })))}`
);
