import type { EngineUsage } from "./engines.ts";

/** USD price per million tokens for a single model. */
export interface ModelPrice {
  cachedInputPerMTok?: number;
  inputPerMTok: number;
  outputPerMTok: number;
}

/**
 * Per-model USD pricing table. Deliberately EMPTY: published per-token prices
 * vary by account/contract and would go stale silently if hardcoded here.
 * Configure real prices via the `TRANSLATE_PRICING` env var (see
 * {@link parsePricingEnv} / {@link resolvePrices}) — tokens are always
 * recorded exactly regardless; a USD cost only appears once a price is
 * supplied, and should then be flagged as estimated.
 */
export const DEFAULT_PRICES: Record<string, ModelPrice> = {};

const isFiniteNonNegative = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && value >= 0;

/**
 * Parse the `TRANSLATE_PRICING` env var: a JSON object keyed by model name,
 * e.g. `{"gpt-5.6-luna":{"inputPerMTok":1.25,"cachedInputPerMTok":0.125,"outputPerMTok":10}}`.
 * Returns `{}` when `raw` is unset/blank. Throws a clear error naming
 * `TRANSLATE_PRICING` on invalid JSON or an invalid price entry.
 */
export function parsePricingEnv(
  raw: string | undefined
): Record<string, ModelPrice> {
  const trimmed = raw?.trim();
  if (!trimmed) {
    return {};
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch (err) {
    throw new Error(
      `TRANSLATE_PRICING must be valid JSON: ${(err as Error).message}`
    );
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new Error(
      "TRANSLATE_PRICING must be a JSON object of model name -> price"
    );
  }
  const prices: Record<string, ModelPrice> = {};
  for (const [model, value] of Object.entries(
    parsed as Record<string, unknown>
  )) {
    if (typeof value !== "object" || value === null) {
      throw new Error(
        `TRANSLATE_PRICING["${model}"] must be an object with inputPerMTok/outputPerMTok`
      );
    }
    const price = value as Record<string, unknown>;
    if (!isFiniteNonNegative(price.inputPerMTok)) {
      throw new Error(
        `TRANSLATE_PRICING["${model}"].inputPerMTok must be a finite non-negative number`
      );
    }
    if (!isFiniteNonNegative(price.outputPerMTok)) {
      throw new Error(
        `TRANSLATE_PRICING["${model}"].outputPerMTok must be a finite non-negative number`
      );
    }
    if (
      price.cachedInputPerMTok !== undefined &&
      !isFiniteNonNegative(price.cachedInputPerMTok)
    ) {
      throw new Error(
        `TRANSLATE_PRICING["${model}"].cachedInputPerMTok must be a finite non-negative number`
      );
    }
    prices[model] = {
      cachedInputPerMTok: price.cachedInputPerMTok as number | undefined,
      inputPerMTok: price.inputPerMTok as number,
      outputPerMTok: price.outputPerMTok as number,
    };
  }
  return prices;
}

/**
 * Merge {@link DEFAULT_PRICES} with `TRANSLATE_PRICING` parsed from `env`
 * (env wins per-model).
 */
export function resolvePrices(
  env: Record<string, string | undefined>
): Record<string, ModelPrice> {
  return { ...DEFAULT_PRICES, ...parsePricingEnv(env.TRANSLATE_PRICING) };
}

/**
 * Compute a USD cost from `usage` given `price`. Returns `null` when `price`
 * is undefined (no configured price for the model actually used). Bills the
 * cached subset of `inputTokens` at `cachedInputPerMTok` (falling back to
 * `inputPerMTok` when not given) and the remainder — clamped to >= 0 so a
 * malformed usage payload can't produce a negative cost — at `inputPerMTok`,
 * plus `outputTokens` at `outputPerMTok`.
 */
export function computeCostUsd(
  usage: EngineUsage,
  price: ModelPrice | undefined
): number | null {
  if (!price) {
    return null;
  }
  const inputTokens = usage.inputTokens ?? 0;
  const cachedInputTokens = usage.cachedInputTokens ?? 0;
  const uncachedInputTokens = Math.max(inputTokens - cachedInputTokens, 0);
  const cachedInputPerMTok = price.cachedInputPerMTok ?? price.inputPerMTok;
  const outputTokens = usage.outputTokens ?? 0;
  return (
    (cachedInputTokens * cachedInputPerMTok) / 1_000_000 +
    (uncachedInputTokens * price.inputPerMTok) / 1_000_000 +
    (outputTokens * price.outputPerMTok) / 1_000_000
  );
}
