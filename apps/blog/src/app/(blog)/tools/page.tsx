import { PencilSquareIcon } from "@heroicons/react/24/outline";
import { cn } from "@howardism/ui/lib/utils";

import { Card, CardDescription, CardTitle } from "@/app/(common)/Card";
import { SimpleLayout } from "@/app/(common)/SimpleLayout";

const items = [
  {
    title: "Strip HTML Tags",
    path: "strip-html-tags",
    description:
      "Remove and shorten long html tags for further analysis, e.g. SEO check",
    icon: PencilSquareIcon,
    background: "bg-pink-500",
  },
];

export default function ToolsPage() {
  return (
    <SimpleLayout
      intro="A collection of tools and resources that I use to build my projects."
      title="Public resources"
    >
      <div className="md:border-zinc-100 md:border-l md:pl-6 md:dark:border-zinc-700/40">
        <div className="flex max-w-3xl flex-col space-y-16">
          {items.map((item) => (
            <Card as="li" key={item.title}>
              <div className="flex justify-center gap-4">
                <div
                  className={cn(
                    item.background,
                    "z-10 flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-lg"
                  )}
                >
                  <item.icon
                    aria-hidden="true"
                    className="h-6 w-6 text-white"
                  />
                </div>
                <div>
                  <CardTitle href={`/tools/${item.path}`}>
                    {item.title}
                    <span>{item.title}</span>
                    <span aria-hidden="true"> &rarr;</span>
                  </CardTitle>
                  <CardDescription>{item.description}</CardDescription>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </SimpleLayout>
  );
}
