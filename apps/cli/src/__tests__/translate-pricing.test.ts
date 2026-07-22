import { describe, expect, it } from "bun:test";

import {
  computeCostUsd,
  DEFAULT_PRICES,
  type ModelPrice,
  parsePricingEnv,
  resolvePrices,
} from "../translate/pricing.ts";

const TRANSLATE_PRICING_RE = /TRANSLATE_PRICING/;

describe("DEFAULT_PRICES", () => {
  it("is deliberately empty — prices must be supplied via TRANSLATE_PRICING", () => {
    expect(DEFAULT_PRICES).toEqual({});
  });
});

describe("parsePricingEnv", () => {
  it("returns {} when unset or blank", () => {
    expect(parsePricingEnv(undefined)).toEqual({});
    expect(parsePricingEnv("  ")).toEqual({});
  });

  it("parses a valid pricing object", () => {
    expect(
      parsePricingEnv(
        JSON.stringify({
          "gpt-5.6-luna": {
            inputPerMTok: 1.25,
            cachedInputPerMTok: 0.125,
            outputPerMTok: 10,
          },
        })
      )
    ).toEqual({
      "gpt-5.6-luna": {
        inputPerMTok: 1.25,
        cachedInputPerMTok: 0.125,
        outputPerMTok: 10,
      },
    });
  });

  it("throws a clear error naming TRANSLATE_PRICING on invalid JSON", () => {
    expect(() => parsePricingEnv("{not json")).toThrow(TRANSLATE_PRICING_RE);
  });

  it("throws when the top-level value is not a JSON object", () => {
    expect(() => parsePricingEnv(JSON.stringify([1, 2, 3]))).toThrow(
      TRANSLATE_PRICING_RE
    );
  });

  it("throws when inputPerMTok/outputPerMTok are missing or negative", () => {
    expect(() =>
      parsePricingEnv(JSON.stringify({ m: { outputPerMTok: 1 } }))
    ).toThrow(TRANSLATE_PRICING_RE);
    expect(() =>
      parsePricingEnv(
        JSON.stringify({ m: { inputPerMTok: -1, outputPerMTok: 1 } })
      )
    ).toThrow(TRANSLATE_PRICING_RE);
  });
});

describe("resolvePrices", () => {
  it("merges DEFAULT_PRICES with TRANSLATE_PRICING from env", () => {
    expect(
      resolvePrices({
        TRANSLATE_PRICING: JSON.stringify({
          "gpt-5.6-luna": { inputPerMTok: 1, outputPerMTok: 2 },
        }),
      })
    ).toEqual({
      "gpt-5.6-luna": { inputPerMTok: 1, outputPerMTok: 2 },
    });
  });

  it("returns DEFAULT_PRICES unchanged when TRANSLATE_PRICING is unset", () => {
    expect(resolvePrices({})).toEqual(DEFAULT_PRICES);
  });
});

describe("computeCostUsd", () => {
  const price: ModelPrice = {
    cachedInputPerMTok: 0.1,
    inputPerMTok: 1,
    outputPerMTok: 10,
  };

  it("returns null when the model has no configured price", () => {
    expect(
      computeCostUsd({ inputTokens: 100, outputTokens: 10 }, undefined)
    ).toBeNull();
  });

  it("bills the cached subset at cachedInputPerMTok and the rest at inputPerMTok", () => {
    const cost = computeCostUsd(
      {
        inputTokens: 1_000_000,
        cachedInputTokens: 400_000,
        outputTokens: 100_000,
      },
      price
    );
    // cached: 400_000 * 0.1 / 1e6 = 0.04; uncached: 600_000 * 1 / 1e6 = 0.6
    // output: 100_000 * 10 / 1e6 = 1
    expect(cost).toBeCloseTo(0.04 + 0.6 + 1);
  });

  it("falls back to inputPerMTok for the cached rate when cachedInputPerMTok is absent", () => {
    const cost = computeCostUsd(
      { inputTokens: 1_000_000, cachedInputTokens: 500_000, outputTokens: 0 },
      { inputPerMTok: 2, outputPerMTok: 5 }
    );
    expect(cost).toBeCloseTo(2);
  });

  it("clamps the uncached remainder at >= 0 when cachedInputTokens exceeds inputTokens", () => {
    const cost = computeCostUsd(
      { inputTokens: 100, cachedInputTokens: 500, outputTokens: 0 },
      price
    );
    expect(cost).toBeCloseTo((500 * 0.1) / 1_000_000);
  });
});
