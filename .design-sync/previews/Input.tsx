import { Input, Label } from "@howardism/design-system";

export const Search = () => (
  <div className="grid w-80 gap-2">
    <Label htmlFor="q">Search notes</Label>
    <Input id="q" placeholder="Search 631 notes…" type="search" />
  </div>
);

export const States = () => (
  <div className="grid w-80 gap-3">
    <Input defaultValue="Evals & Benchmarks" />
    <Input disabled placeholder="Search is rebuilding…" />
    <Input aria-invalid defaultValue="not-an-email" type="email" />
  </div>
);
