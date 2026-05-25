import { describe, expect, it } from "bun:test";
import { routing } from "@/i18n/routing";
import enMessages from "../../messages/en.json";
import zhTwMessages from "../../messages/zh-TW.json";

type MessageNode = string | { [key: string]: MessageNode };

/**
 * Recursive walk that produces a flat set of `Namespace.key.subkey` paths for
 * every leaf string in a messages tree. Used to compare key sets across
 * locales — any divergence means the bundle is out of sync.
 */
function collectKeyPaths(
  node: MessageNode,
  prefix: string,
  paths: Set<string>
): void {
  if (typeof node === "string") {
    paths.add(prefix);
    return;
  }
  for (const [key, value] of Object.entries(node)) {
    const next = prefix === "" ? key : `${prefix}.${key}`;
    collectKeyPaths(value, next, paths);
  }
}

const ICU_PLACEHOLDER = /\{(\w+)(?:,[^}]*)?\}/g;

/** All `{name}` placeholders that ICU MessageFormat would substitute. */
function extractPlaceholders(value: string): Set<string> {
  const matches = value.matchAll(ICU_PLACEHOLDER);
  return new Set(Array.from(matches, (m) => m[1]));
}

/** Flat path → leaf string map for a messages tree. */
function flattenLeaves(
  node: MessageNode,
  prefix: string,
  out: Map<string, string>
): void {
  if (typeof node === "string") {
    out.set(prefix, node);
    return;
  }
  for (const [key, value] of Object.entries(node)) {
    const next = prefix === "" ? key : `${prefix}.${key}`;
    flattenLeaves(value, next, out);
  }
}

describe("messages parity", () => {
  it("every configured locale has a message bundle that this test loads", () => {
    // Sanity check: this test only loads en + zh-TW; if a third locale is
    // added to routing without an updated parity test, fail loudly.
    expect([...routing.locales].sort()).toEqual(["en", "zh-TW"]);
  });

  it("en.json and zh-TW.json declare the same set of keys", () => {
    const enPaths = new Set<string>();
    const zhPaths = new Set<string>();
    collectKeyPaths(enMessages as MessageNode, "", enPaths);
    collectKeyPaths(zhTwMessages as MessageNode, "", zhPaths);

    const onlyInEn = [...enPaths].filter((p) => !zhPaths.has(p)).sort();
    const onlyInZh = [...zhPaths].filter((p) => !enPaths.has(p)).sort();

    expect(onlyInEn).toEqual([]);
    expect(onlyInZh).toEqual([]);
  });

  it("ICU placeholders match for every shared key", () => {
    const enLeaves = new Map<string, string>();
    const zhLeaves = new Map<string, string>();
    flattenLeaves(enMessages as MessageNode, "", enLeaves);
    flattenLeaves(zhTwMessages as MessageNode, "", zhLeaves);

    const mismatches: { en: string[]; key: string; zh: string[] }[] = [];
    for (const [key, enValue] of enLeaves) {
      const zhValue = zhLeaves.get(key);
      if (zhValue === undefined) {
        continue;
      }
      const enPlaceholders = [...extractPlaceholders(enValue)].sort();
      const zhPlaceholders = [...extractPlaceholders(zhValue)].sort();
      if (
        enPlaceholders.length !== zhPlaceholders.length ||
        enPlaceholders.some((name, i) => name !== zhPlaceholders[i])
      ) {
        mismatches.push({ key, en: enPlaceholders, zh: zhPlaceholders });
      }
    }

    expect(mismatches).toEqual([]);
  });
});
