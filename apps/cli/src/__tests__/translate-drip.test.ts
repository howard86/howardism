/**
 * Unit tests for the drip driver's pure decision logic: argv/env parsing,
 * check-JSON extraction, actionable counting, and per-cycle bookkeeping. The
 * subprocess loop itself is out of scope (it just wires these together).
 */
import { describe, expect, it } from "bun:test";
import {
  countActionable,
  DRIP_DEFAULTS,
  evaluateCycle,
  MAX_ZERO_PROGRESS_CYCLES,
  parseCheckJson,
  parseDripArgs,
} from "../translate/drip.ts";

describe("parseDripArgs", () => {
  it("uses defaults when nothing is supplied", () => {
    expect(parseDripArgs([], {})).toEqual({
      limit: DRIP_DEFAULTS.limit,
      intervalMin: DRIP_DEFAULTS.intervalMin,
      maxCycles: DRIP_DEFAULTS.maxCycles,
    });
  });

  it("reads flags", () => {
    expect(
      parseDripArgs(
        ["--limit", "3", "--interval-min", "5", "--max-cycles", "7"],
        {}
      )
    ).toEqual({ limit: 3, intervalMin: 5, maxCycles: 7 });
  });

  it("falls back to env vars", () => {
    expect(
      parseDripArgs([], {
        DRIP_LIMIT: "4",
        DRIP_INTERVAL_MIN: "60",
        DRIP_MAX_CYCLES: "8",
      })
    ).toEqual({ limit: 4, intervalMin: 60, maxCycles: 8 });
  });

  it("prefers flags over env vars", () => {
    expect(parseDripArgs(["--limit", "2"], { DRIP_LIMIT: "9" }).limit).toBe(2);
  });

  it("allows interval-min of 0 but not a limit of 0", () => {
    expect(parseDripArgs(["--interval-min", "0"], {}).intervalMin).toBe(0);
    expect(() => parseDripArgs(["--limit", "0"], {})).toThrow();
    expect(() => parseDripArgs(["--max-cycles", "0"], {})).toThrow();
  });

  it("rejects non-integer and missing values", () => {
    expect(() => parseDripArgs(["--limit", "abc"], {})).toThrow();
    expect(() => parseDripArgs(["--limit"], {})).toThrow();
    expect(() => parseDripArgs([], { DRIP_MAX_CYCLES: "abc" })).toThrow();
  });
});

describe("countActionable", () => {
  it("sums stale, missing, verbatim-drift, and untranslated only", () => {
    expect(
      countActionable({
        buckets: {
          fresh: ["a", "b", "c"],
          missing: ["d"],
          stale: ["e", "f"],
          "verbatim-drift": ["g"],
          orphan: ["h", "i"],
          untranslated: ["j"],
        },
      })
    ).toBe(5);
  });

  it("ignores fresh and orphan", () => {
    expect(
      countActionable({ buckets: { fresh: ["a"], orphan: ["b", "c"] } })
    ).toBe(0);
  });

  it("tolerates missing keys and an absent buckets field", () => {
    expect(countActionable({ buckets: {} })).toBe(0);
    expect(countActionable({})).toBe(0);
  });
});

describe("parseCheckJson", () => {
  it("extracts the JSON object from mixed stdout", () => {
    const stdout = [
      "=== Translate check (zh-TW) ===",
      "Fresh:            3  (a, b, c)",
      "Stale:            1  (d)",
      "Recorded spend: $1.2345 across 4 tracked",
      JSON.stringify({ locale: "zh-TW", buckets: { stale: ["d"] } }),
    ].join("\n");
    expect(parseCheckJson(stdout)?.buckets).toEqual({ stale: ["d"] });
  });

  it("returns the last object carrying buckets when several lines are JSON", () => {
    const stdout = [
      JSON.stringify({ note: "not it" }),
      JSON.stringify({ buckets: { stale: ["x"] } }),
    ].join("\n");
    expect(parseCheckJson(stdout)?.buckets).toEqual({ stale: ["x"] });
  });

  it("returns null when there is no bucket JSON", () => {
    expect(parseCheckJson("Fresh: 3\nStale: 0\n")).toBeNull();
    expect(parseCheckJson("")).toBeNull();
  });
});

describe("evaluateCycle", () => {
  const base = {
    consecutiveZeroProgress: 0,
    cycle: 1,
    maxCycles: 20,
    prevRemaining: 10,
    remaining: 5,
  };

  it("reports progress and keeps going", () => {
    const d = evaluateCycle(base);
    expect(d).toMatchObject({
      done: false,
      abort: false,
      translated: 5,
      consecutiveZeroProgress: 0,
    });
  });

  it("finishes when nothing is actionable", () => {
    const d = evaluateCycle({ ...base, remaining: 0 });
    expect(d.done).toBe(true);
    expect(d.abort).toBe(false);
    expect(d.consecutiveZeroProgress).toBe(0);
  });

  it("increments the zero-progress counter when the backlog does not shrink", () => {
    const d = evaluateCycle({
      ...base,
      prevRemaining: 5,
      remaining: 5,
      consecutiveZeroProgress: 1,
    });
    expect(d.translated).toBe(0);
    expect(d.consecutiveZeroProgress).toBe(2);
    expect(d.abort).toBe(false);
  });

  it("aborts after the configured consecutive zero-progress cycles", () => {
    const d = evaluateCycle({
      ...base,
      prevRemaining: 5,
      remaining: 5,
      consecutiveZeroProgress: MAX_ZERO_PROGRESS_CYCLES - 1,
    });
    expect(d.abort).toBe(true);
    expect(d.done).toBe(false);
    expect(d.consecutiveZeroProgress).toBe(MAX_ZERO_PROGRESS_CYCLES);
  });

  it("resets the counter after a productive cycle", () => {
    const d = evaluateCycle({ ...base, consecutiveZeroProgress: 2 });
    expect(d.consecutiveZeroProgress).toBe(0);
  });

  it("aborts once the cycle cap is reached with work still pending", () => {
    const d = evaluateCycle({
      ...base,
      cycle: 20,
      maxCycles: 20,
      prevRemaining: 10,
      remaining: 4,
    });
    expect(d.abort).toBe(true);
    expect(d.reason).toContain("max cycles");
  });

  it("never reports negative progress", () => {
    const d = evaluateCycle({ ...base, prevRemaining: 3, remaining: 8 });
    expect(d.translated).toBe(0);
    expect(d.consecutiveZeroProgress).toBe(1);
  });
});
