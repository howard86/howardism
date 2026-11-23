import { Label, Textarea } from "@howardism/design-system";

export const Default = () => (
  <div className="grid w-96 gap-2">
    <Label htmlFor="note">Reader note</Label>
    <Textarea
      id="note"
      placeholder="What did this note change about how you think about agent evals?"
    />
  </div>
);

export const States = () => (
  <div className="grid w-96 gap-3">
    <Textarea defaultValue="Benchmarks saturate quickly; held-out task suites age better." />
    <Textarea aria-invalid defaultValue="Too short." />
    <Textarea disabled placeholder="Comments are closed on this note." />
  </div>
);
