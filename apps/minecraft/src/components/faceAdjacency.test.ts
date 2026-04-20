import { describe, expect, it } from "bun:test";

import { resolveAdjacentCell, resolveHoverSlot } from "./faceAdjacency";

describe("resolveAdjacentCell", () => {
  it("returns null when faceIndex is null", () => {
    expect(resolveAdjacentCell(null, [0, 0, 0])).toBeNull();
  });

  it("returns null when faceIndex is undefined", () => {
    expect(resolveAdjacentCell(undefined, [0, 0, 0])).toBeNull();
  });

  // Regression for #529 — truthy check treated 0 as missing.
  it("treats faceIndex 0 as a valid click on the +x face", () => {
    expect(resolveAdjacentCell(0, [0, 0, 0])).toEqual([1, 0, 0]);
  });

  it("maps faceIndex 1 (triangle 2 of +x face) to +x as well", () => {
    // Math.floor(1 / 2) === 0 → default case → +x
    expect(resolveAdjacentCell(1, [0, 0, 0])).toEqual([1, 0, 0]);
  });

  it("maps faceIndex 2 (first triangle of -x face) to -x", () => {
    expect(resolveAdjacentCell(2, [5, 0, 0])).toEqual([4, 0, 0]);
  });

  it("maps faceIndex 4 (+y face) to +y", () => {
    expect(resolveAdjacentCell(4, [0, 1, 0])).toEqual([0, 2, 0]);
  });

  it("maps faceIndex 6 (-y face) to -y", () => {
    expect(resolveAdjacentCell(6, [0, 1, 0])).toEqual([0, 0, 0]);
  });

  it("maps faceIndex 8 (+z face) to +z", () => {
    expect(resolveAdjacentCell(8, [0, 0, 2])).toEqual([0, 0, 3]);
  });

  it("maps faceIndex 10 (-z face) to -z", () => {
    expect(resolveAdjacentCell(10, [0, 0, 2])).toEqual([0, 0, 1]);
  });
});

describe("resolveHoverSlot", () => {
  it("returns null for null/undefined faceIndex", () => {
    expect(resolveHoverSlot(null)).toBeNull();
    expect(resolveHoverSlot(undefined)).toBeNull();
  });

  // Regression for #529 — hover also dropped face-0.
  it("returns 0 for faceIndex 0 (does not treat it as missing)", () => {
    expect(resolveHoverSlot(0)).toBe(0);
  });

  it("returns the floored slot for non-zero indices", () => {
    expect(resolveHoverSlot(3)).toBe(1);
    expect(resolveHoverSlot(10)).toBe(5);
  });
});
