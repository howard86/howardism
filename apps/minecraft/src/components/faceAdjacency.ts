import type { Triplet } from "@react-three/cannon";

/**
 * Given a Three.js triangle `faceIndex` from a BoxGeometry and a cube's
 * current grid position, return the grid coordinates of the neighbouring
 * cell that a click/tap on that face should spawn a new cube into.
 *
 * BoxGeometry has 12 triangles (6 quads × 2). Dividing by 2 maps to 6 face
 * slots 0..5 — one per orthogonal axis.
 *
 * Returns `null` only when `faceIndex` is `null`/`undefined` — NEVER when
 * it's `0`, which is a legitimate index for the +x face. The previous
 * `if (event.faceIndex)` truthiness check silently dropped face-0 clicks.
 */
export function resolveAdjacentCell(
  faceIndex: number | null | undefined,
  [x, y, z]: Triplet
): Triplet | null {
  if (faceIndex === null || faceIndex === undefined) {
    return null;
  }
  const slot = Math.floor(faceIndex / 2);
  switch (slot) {
    case 4:
      return [x, y, z + 1];
    case 2:
      return [x, y + 1, z];
    case 1:
      return [x - 1, y, z];
    case 5:
      return [x, y, z - 1];
    case 3:
      return [x, y - 1, z];
    default:
      return [x + 1, y, z];
  }
}

/**
 * Face slot (0..5) for the hovered face, or `null` if the pointer event
 * carried no `faceIndex`. Guards against `0`-falsy drops the same way
 * `resolveAdjacentCell` does.
 */
export function resolveHoverSlot(
  faceIndex: number | null | undefined
): number | null {
  if (faceIndex === null || faceIndex === undefined) {
    return null;
  }
  return Math.floor(faceIndex / 2);
}
