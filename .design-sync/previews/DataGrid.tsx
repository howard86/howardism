import { DataGrid } from "@howardism/design-system";

export const Colophon = () => (
  <DataGrid
    rows={[
      ["Curator", "Howard Tai"],
      ["Cadence", "Batched, not scheduled"],
      ["Notes", "412 across 14 domains"],
      ["Revised", "23 Nov 2026"],
    ]}
  />
);

export const StackedNarrow = () => (
  <div style={{ width: 320 }}>
    <DataGrid
      maxWidth={280}
      rows={[
        ["Domain", "Evals & Benchmarks"],
        ["Reading", "25′"],
        ["Kind", "Concept"],
      ]}
      stack
    />
  </div>
);
