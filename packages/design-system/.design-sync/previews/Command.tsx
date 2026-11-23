import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@howardism/design-system";

export const SearchPalette = () => (
  <Command className="w-96 rounded-lg border shadow-md">
    <CommandInput placeholder="Search notes..." />
    <CommandList>
      <CommandEmpty>No notes found.</CommandEmpty>
      <CommandGroup heading="Articles">
        <CommandItem>Agent Context Files</CommandItem>
        <CommandItem>Benchmark Contamination Checks</CommandItem>
        <CommandItem>Harness Swap vs. Rerun Noise</CommandItem>
      </CommandGroup>
      <CommandSeparator />
      <CommandGroup heading="Go to">
        <CommandItem>Questions</CommandItem>
        <CommandItem>Shelf</CommandItem>
      </CommandGroup>
    </CommandList>
  </Command>
);

export const NoResults = () => (
  <Command className="w-96 rounded-lg border shadow-md">
    <CommandInput placeholder="Search notes..." value="quantum gravity" />
    <CommandList>
      <CommandEmpty>No notes found.</CommandEmpty>
    </CommandList>
  </Command>
);
