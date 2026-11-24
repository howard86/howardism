import {
  Badge,
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@howardism/design-system";

export const ArticlePreview = () => (
  <div className="flex h-full items-start justify-center pt-24">
    <p className="max-w-md text-sm">
      Contamination is the usual suspect when a score jumps; see{" "}
      <HoverCard open>
        <HoverCardTrigger asChild>
          <a className="underline underline-offset-4" href="/">
            Benchmark Contamination Checks
          </a>
        </HoverCardTrigger>
        <HoverCardContent>
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold">
                Benchmark Contamination Checks
              </span>
              <Badge variant="secondary">Concept</Badge>
            </div>
            <p className="text-muted-foreground">
              How to tell whether a model has seen the test set, and what
              holdout designs make leakage visible.
            </p>
            <p className="text-muted-foreground text-xs">
              Evals &amp; Benchmarks · 18 min read
            </p>
          </div>
        </HoverCardContent>
      </HoverCard>{" "}
      before trusting a delta.
    </p>
  </div>
);
