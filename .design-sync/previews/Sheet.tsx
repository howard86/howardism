import {
  Button,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@howardism/design-system";

const links = ["Home", "Articles", "Questions", "Shelf"];

export const MobileNav = () => (
  <Sheet defaultOpen>
    <SheetTrigger asChild>
      <Button variant="outline">Menu</Button>
    </SheetTrigger>
    <SheetContent side="right">
      <SheetHeader>
        <SheetTitle>Howardism</SheetTitle>
        <SheetDescription>
          Notes on AI agents, evals and context engineering.
        </SheetDescription>
      </SheetHeader>
      <nav className="flex flex-col gap-1 px-4">
        {links.map((l) => (
          <a
            className="rounded-md px-3 py-2 font-medium text-sm hover:bg-muted"
            href="/"
            key={l}
          >
            {l}
          </a>
        ))}
      </nav>
    </SheetContent>
  </Sheet>
);
