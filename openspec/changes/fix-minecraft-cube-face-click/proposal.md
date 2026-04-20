## Why

`apps/minecraft/src/components/Cube.tsx` guards face-click + hover handlers with truthy checks (`if (event.faceIndex)` and `if (!(event.faceIndex && ref.current))`). Three.js `BoxGeometry` emits `faceIndex` values `0..11`, where `0` is the first triangle of the `+x` face — a legitimate click target. The truthy check silently drops every interaction on face 0, so users cannot spawn a cube adjacent to the `+x` face or hover-highlight it. The inline `switch (faceIndex) { … default: addCube(x+1, y, z) }` masks the hover bug's impact on click because `case 0` falls through to `default`, but that's accidental — the early return on face 0 means the click never reaches the switch at all.

## What Changes

- Extract the face-index → adjacent-grid-cell math into a pure module `apps/minecraft/src/components/faceAdjacency.ts` exporting `resolveAdjacentCell(faceIndex, [x, y, z])` and `resolveHoverSlot(faceIndex)`, each explicitly checking `faceIndex === null || faceIndex === undefined` instead of truthy so `0` passes through.
- Replace the inline truthy guards and `switch` in `Cube.tsx` with calls to these functions, preserving the existing behaviour for faces 1..5 and restoring it for face 0.
- Add `apps/minecraft/src/components/faceAdjacency.test.ts` — `bun:test` unit tests including regression coverage for `faceIndex === 0` on both functions.

## Capabilities

### New Capabilities

- `minecraft-cube-interactions`: Pointer-move hover highlighting and click-to-spawn behaviour for the 3D cube grid, driven by Three.js `BoxGeometry` `faceIndex` values. Face 0 MUST be treated as a valid interaction, not as "no face".

### Modified Capabilities

_(none — no existing `openspec/specs/` capability covers the minecraft app yet.)_

## Impact

- **Code**:
  - `apps/minecraft/src/components/Cube.tsx` (edit)
  - `apps/minecraft/src/components/faceAdjacency.ts` (new)
  - `apps/minecraft/src/components/faceAdjacency.test.ts` (new)
- **APIs**: none (app-internal module).
- **Dependencies**: none added.
- **Data model**: n/a.
- **GitHub issues closed**: #529.
- **Not closed**: #538 (cube store uses `ReactNode[]` for game state — out of scope; would change the store contract).
