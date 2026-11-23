import { SubjectChipList } from "@howardism/design-system";

const navigable = new Set(["agents", "evals", "context-engineering"]);

export const Canonical = () => (
  <SubjectChipList
    navigable={navigable}
    tags={["agents", "context-engineering", "evals"]}
  />
);

export const Limited = () => (
  <SubjectChipList
    limit={3}
    navigable={navigable}
    tags={["agents", "evals", "benchmarks", "contamination", "rl", "judges"]}
  />
);
