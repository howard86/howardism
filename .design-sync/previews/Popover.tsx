import {
  Button,
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@howardism/design-system";

export const ReadingOptions = () => (
  <div className="flex h-full items-start justify-center pt-24">
    <Popover defaultOpen>
      <PopoverTrigger asChild>
        <Button variant="outline">Reading options</Button>
      </PopoverTrigger>
      <PopoverContent>
        <PopoverHeader>
          <PopoverTitle>Harness Swap vs. Rerun Noise</PopoverTitle>
          <PopoverDescription>
            25 min read, revised 23 Nov 2026. Save it to your shelf to pick it
            up later.
          </PopoverDescription>
        </PopoverHeader>
        <div className="flex gap-2">
          <Button size="sm">Save to shelf</Button>
          <Button size="sm" variant="outline">
            Copy link
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  </div>
);
