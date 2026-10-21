import { describe, expect, it } from "bun:test";

import { formatMinutesLeft } from "@/hooks/use-article-reading-state";

describe("formatMinutesLeft", () => {
  it("rounds remaining whole-article time up", () => {
    expect(formatMinutesLeft(7, 0.51)).toBe("4 min left");
  });

  it("omits unknown and completed time and labels less than a minute", () => {
    expect(formatMinutesLeft(undefined, 0.2)).toBeNull();
    expect(formatMinutesLeft(5, 1)).toBeNull();
    expect(formatMinutesLeft(0.5, 0)).toBe("<1 min left");
  });
});
