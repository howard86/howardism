import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@howardism/design-system";

export const Domains = () => (
  <div className="h-80 w-72">
    <Select defaultOpen defaultValue="evals">
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Choose a domain" />
      </SelectTrigger>
      <SelectContent position="popper">
        <SelectGroup>
          <SelectLabel>Domains</SelectLabel>
          <SelectItem value="agents">Agent Systems</SelectItem>
          <SelectItem value="evals">Evals & Benchmarks</SelectItem>
          <SelectItem value="interpretability">Interpretability</SelectItem>
          <SelectItem value="alignment-and-safety">
            Alignment &amp; Safety
          </SelectItem>
        </SelectGroup>
        <SelectSeparator />
        <SelectGroup>
          <SelectLabel>Other</SelectLabel>
          <SelectItem value="syntheses">Syntheses</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  </div>
);
