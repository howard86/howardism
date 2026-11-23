import { Badge } from "@howardism/design-system";

export const Variants = () => (
  <div className="flex flex-wrap items-center gap-3">
    <Badge>Concept</Badge>
    <Badge variant="secondary">Entity</Badge>
    <Badge variant="outline">Essay</Badge>
    <Badge variant="ghost">Index</Badge>
    <Badge variant="destructive">Superseded</Badge>
  </div>
);

export const Subjects = () => (
  <div className="flex flex-wrap items-center gap-2">
    <Badge variant="secondary">Agent Systems</Badge>
    <Badge variant="secondary">Evals & Benchmarks</Badge>
    <Badge variant="secondary">Retrieval</Badge>
    <Badge variant="outline">25′ read</Badge>
  </div>
);
