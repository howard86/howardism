import { Toggle } from "@howardism/design-system";

export const Variants = () => (
  <div className="flex flex-wrap items-center gap-3">
    <Toggle>Concept</Toggle>
    <Toggle variant="outline">Entity</Toggle>
    <Toggle defaultPressed variant="outline">
      Essay
    </Toggle>
  </div>
);

export const Sizes = () => (
  <div className="flex flex-wrap items-center gap-3">
    <Toggle size="sm" variant="outline">
      Small
    </Toggle>
    <Toggle variant="outline">Default</Toggle>
    <Toggle size="lg" variant="outline">
      Large
    </Toggle>
  </div>
);

export const States = () => (
  <div className="flex flex-wrap items-center gap-3">
    <Toggle defaultPressed>Show revised only</Toggle>
    <Toggle disabled>Unavailable</Toggle>
  </div>
);
