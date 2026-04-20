## ADDED Requirements

### Requirement: Face 0 clicks spawn an adjacent cube

The system SHALL, when a `ThreeEvent<MouseEvent>` with `faceIndex === 0` reaches `Cube`'s click handler, spawn a new cube at the `+x` grid neighbour of the clicked cube's current position.

#### Scenario: Click face 0 of a cube at origin

- **WHEN** `resolveAdjacentCell(0, [0, 0, 0])` is called
- **THEN** the function returns `[1, 0, 0]`

#### Scenario: Click face 1 (second triangle of the +x quad)

- **WHEN** `resolveAdjacentCell(1, [0, 0, 0])` is called
- **THEN** the function returns `[1, 0, 0]` — both triangles of a quad map to the same face

### Requirement: Face-slot axis mapping is preserved

The system SHALL map `Math.floor(faceIndex / 2)` to grid deltas as follows: slot `0` → `+x`, slot `1` → `-x`, slot `2` → `+y`, slot `3` → `-y`, slot `4` → `+z`, slot `5` → `-z`.

#### Scenario: -x face

- **WHEN** `resolveAdjacentCell(2, [5, 0, 0])` is called
- **THEN** the function returns `[4, 0, 0]`

#### Scenario: +y face

- **WHEN** `resolveAdjacentCell(4, [0, 1, 0])` is called
- **THEN** the function returns `[0, 2, 0]`

#### Scenario: -y face

- **WHEN** `resolveAdjacentCell(6, [0, 1, 0])` is called
- **THEN** the function returns `[0, 0, 0]`

#### Scenario: +z face

- **WHEN** `resolveAdjacentCell(8, [0, 0, 2])` is called
- **THEN** the function returns `[0, 0, 3]`

#### Scenario: -z face

- **WHEN** `resolveAdjacentCell(10, [0, 0, 2])` is called
- **THEN** the function returns `[0, 0, 1]`

### Requirement: Missing faceIndex is rejected

The system SHALL return `null` from `resolveAdjacentCell` and `resolveHoverSlot` if and only if `faceIndex` is `null` or `undefined`. Numeric `0` MUST NOT be treated as missing.

#### Scenario: null faceIndex on resolveAdjacentCell

- **WHEN** `resolveAdjacentCell(null, [0, 0, 0])` is called
- **THEN** the function returns `null`

#### Scenario: undefined faceIndex on resolveAdjacentCell

- **WHEN** `resolveAdjacentCell(undefined, [0, 0, 0])` is called
- **THEN** the function returns `null`

#### Scenario: null faceIndex on resolveHoverSlot

- **WHEN** `resolveHoverSlot(null)` is called
- **THEN** the function returns `null`

#### Scenario: faceIndex 0 on resolveHoverSlot

- **WHEN** `resolveHoverSlot(0)` is called
- **THEN** the function returns `0` — NOT `null`

### Requirement: Hover slot mirrors click logic

The system SHALL return `Math.floor(faceIndex / 2)` from `resolveHoverSlot` for any non-nullish `faceIndex`, matching the slot index used by `resolveAdjacentCell` so hover highlight and click spawn axis-align.

#### Scenario: Non-zero faceIndex

- **WHEN** `resolveHoverSlot(3)` is called
- **THEN** the function returns `1`
