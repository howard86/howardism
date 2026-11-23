import { Button } from "@howardism/design-system";

export const Variants = () => (
  <div className="flex flex-wrap items-center gap-3">
    <Button>Save article</Button>
    <Button variant="secondary">Add to shelf</Button>
    <Button variant="outline">Compare</Button>
    <Button variant="ghost">Cancel</Button>
    <Button variant="destructive">Clear reading data</Button>
    <Button variant="link">Read the source</Button>
  </div>
);

export const Sizes = () => (
  <div className="flex flex-wrap items-center gap-3">
    <Button size="xs">Extra small</Button>
    <Button size="sm">Small</Button>
    <Button>Default</Button>
    <Button size="lg">Large</Button>
  </div>
);

export const Disabled = () => (
  <div className="flex flex-wrap items-center gap-3">
    <Button disabled>Saving…</Button>
    <Button disabled variant="outline">
      Unavailable
    </Button>
  </div>
);
