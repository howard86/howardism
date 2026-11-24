import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@howardism/design-system";

export const ClearReadingData = () => (
  <Dialog defaultOpen>
    <DialogTrigger asChild>
      <Button variant="outline">Clear reading data</Button>
    </DialogTrigger>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Clear reading data?</DialogTitle>
        <DialogDescription>
          This removes your saved shelf, reading progress on 12 articles and
          your recent searches from this browser. It cannot be undone.
        </DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <Button variant="outline">Cancel</Button>
        <Button variant="destructive">Clear data</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);
