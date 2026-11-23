import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@howardism/design-system";

const domains = [
  ["Agent Systems", "Harnesses, tools and orchestration"],
  ["Evals & Benchmarks", "Measuring what models can really do"],
  ["AI Coding Practice", "How coding agents change the craft"],
  ["Alignment & Safety", "Failure modes, oversight and honesty"],
];

export const Domains = () => (
  <div className="flex h-full justify-center pt-8">
    <NavigationMenu defaultValue="domains">
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuLink href="/">Home</NavigationMenuLink>
        </NavigationMenuItem>
        <NavigationMenuItem value="domains">
          <NavigationMenuTrigger>Domains</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid grid-cols-2 gap-1 p-1" style={{ width: 440 }}>
              {domains.map(([name, desc]) => (
                <li key={name}>
                  <NavigationMenuLink href="/">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium">{name}</span>
                      <span className="text-muted-foreground text-xs">
                        {desc}
                      </span>
                    </div>
                  </NavigationMenuLink>
                </li>
              ))}
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuLink href="/">Questions</NavigationMenuLink>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  </div>
);
