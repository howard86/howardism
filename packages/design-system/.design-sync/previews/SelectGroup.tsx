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

export const GroupedKinds = () => (
  <div className="h-80">
    <Select defaultOpen defaultValue="concept">
      <SelectTrigger style={{ width: 256 }}>
        <SelectValue placeholder="Article kind" />
      </SelectTrigger>
      <SelectContent position="popper">
        <SelectGroup>
          <SelectLabel>Notes</SelectLabel>
          <SelectItem value="concept">Concept</SelectItem>
          <SelectItem value="entity">Entity</SelectItem>
        </SelectGroup>
        <SelectSeparator />
        <SelectGroup>
          <SelectLabel>Longer form</SelectLabel>
          <SelectItem value="essay">Essay</SelectItem>
          <SelectItem value="index">Index</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  </div>
);
