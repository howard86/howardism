import { SubjectChip } from "@howardism/design-system";

export const Linked = () => (
  <div className="flex gap-2">
    <SubjectChip href="/articles/tagged/agents" tag="agents" />
    <SubjectChip href="/articles/tagged/evals" tag="evals" />
  </div>
);

export const Inert = () => (
  <div className="flex gap-2">
    <SubjectChip tag="contamination" />
    <SubjectChip tag="reward hacking" />
  </div>
);
