import { Separator } from "@howardism/design-system";

export const Horizontal = () => (
  <div className="w-80">
    <h4 className="font-medium text-sm">Evals & Benchmarks</h4>
    <p className="text-muted-foreground text-sm">
      Measuring what agents can actually do.
    </p>
    <Separator className="my-4 h-px w-full" />
    <p className="text-sm">42 notes · revised 23 Nov 2026</p>
  </div>
);

export const Vertical = () => (
  <div className="flex h-5 items-center gap-4 text-sm">
    <span>Notes</span>
    <Separator className="h-full w-px" orientation="vertical" />
    <span>Sources</span>
    <Separator className="h-full w-px" orientation="vertical" />
    <span>Questions</span>
  </div>
);
