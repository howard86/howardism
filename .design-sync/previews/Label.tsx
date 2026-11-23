import { Input, Label } from "@howardism/design-system";

export const WithInput = () => (
  <div className="grid w-80 gap-2">
    <Label htmlFor="email">Email for the weekly digest</Label>
    <Input id="email" placeholder="you@example.com" type="email" />
  </div>
);

export const Stacked = () => (
  <div className="grid w-80 gap-4">
    <div className="grid gap-2">
      <Label htmlFor="title">Note title</Label>
      <Input defaultValue="Tool-use evaluation harnesses" id="title" />
    </div>
    <div className="grid gap-2">
      <Label htmlFor="src">Source URL</Label>
      <Input id="src" placeholder="https://arxiv.org/abs/…" />
    </div>
  </div>
);
