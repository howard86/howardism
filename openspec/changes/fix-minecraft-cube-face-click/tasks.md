## 1. Pure function extraction

- [x] 1.1 Create `apps/minecraft/src/components/faceAdjacency.ts` exporting `resolveAdjacentCell(faceIndex, [x, y, z])` and `resolveHoverSlot(faceIndex)`, each returning `null` only when `faceIndex` is `null` or `undefined` (never for `0`).
- [x] 1.2 Port the six-case `switch` from `Cube.tsx` into `resolveAdjacentCell`, keeping the existing axis mapping (slot `4` → `+z`, `2` → `+y`, `1` → `-x`, `5` → `-z`, `3` → `-y`, default → `+x`).

## 2. Consume from `Cube.tsx`

- [x] 2.1 Import `resolveAdjacentCell` + `resolveHoverSlot` in `Cube.tsx`.
- [x] 2.2 Rewrite `handlePointerMove` to call `resolveHoverSlot(event.faceIndex)` and guard with `!== null` (so face 0 registers).
- [x] 2.3 Rewrite `handleOnClick` to call `resolveAdjacentCell(event.faceIndex, [x, y, z])` after the `ref.current` null-check; spread the returned triplet into `addCube`.
- [x] 2.4 Delete the now-dead inline `switch` block.

## 3. Regression tests

- [x] 3.1 Add `apps/minecraft/src/components/faceAdjacency.test.ts` with explicit `faceIndex === 0` cases for both functions (the regression for #529).
- [x] 3.2 Cover each face slot (`0`, `2`, `4`, `6`, `8`, `10`) with an expected grid delta.
- [x] 3.3 Cover `null` + `undefined` returning `null` on both functions.

## 4. Verification

- [x] 4.1 `bun test apps/minecraft/src/components/faceAdjacency.test.ts` — all pass.
- [x] 4.2 `bun run type-check` inside `apps/minecraft` — clean.
- [ ] 4.3 Manual smoke: `bun run dev` in `apps/minecraft`, click top face of the default cube (which is face 0 via `+x` orientation depending on camera), verify a new cube spawns adjacent.
