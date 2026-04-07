import { Button } from "@howardism/ui/components/button";

import { CloseIcon } from "@/app/(common)/icons";

export default function ThemePreview() {
  return (
    <section className="space-y-8">
      <div>
        <h2 className="px-2 pb-4 font-bold text-xl">Custom</h2>

        <div className="not-prose grid gap-3 rounded-box border border-border/5 bg-background p-6 text-foreground">
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            <Button type="button">Default</Button>
            <Button aria-label="Close" size="icon" type="button">
              <CloseIcon className="w-8" />
            </Button>
          </div>
        </div>
      </div>

      <div>
        <h2 className="px-2 pb-4 font-bold text-xl">Preview</h2>
        <div className="not-prose grid gap-6 rounded-box border border-border/5 bg-background p-6 text-foreground">
          {/* Button Variants */}
          <div>
            <h3 className="mb-3 font-semibold text-muted-foreground text-sm">
              Variants
            </h3>
            <div className="flex flex-wrap gap-2">
              <Button type="button">Default</Button>
              <Button type="button" variant="secondary">
                Secondary
              </Button>
              <Button type="button" variant="outline">
                Outline
              </Button>
              <Button type="button" variant="ghost">
                Ghost
              </Button>
              <Button type="button" variant="link">
                Link
              </Button>
              <Button type="button" variant="destructive">
                Destructive
              </Button>
            </div>
          </div>

          {/* Button Sizes */}
          <div>
            <h3 className="mb-3 font-semibold text-muted-foreground text-sm">
              Sizes
            </h3>
            <div className="flex flex-wrap items-center gap-2">
              <Button size="xs" type="button">
                Extra Small
              </Button>
              <Button size="sm" type="button">
                Small
              </Button>
              <Button type="button">Default</Button>
              <Button size="lg" type="button">
                Large
              </Button>
            </div>
          </div>

          {/* Icon Buttons */}
          <div>
            <h3 className="mb-3 font-semibold text-muted-foreground text-sm">
              Icon Buttons
            </h3>
            <div className="flex flex-wrap items-center gap-2">
              <Button aria-label="Close xs" size="icon-xs" type="button">
                <CloseIcon className="w-3" />
              </Button>
              <Button aria-label="Close sm" size="icon-sm" type="button">
                <CloseIcon className="w-4" />
              </Button>
              <Button aria-label="Close" size="icon" type="button">
                <CloseIcon className="w-5" />
              </Button>
              <Button aria-label="Close lg" size="icon-lg" type="button">
                <CloseIcon className="w-6" />
              </Button>
              <Button
                aria-label="Close ghost"
                size="icon"
                type="button"
                variant="ghost"
              >
                <CloseIcon className="w-5" />
              </Button>
              <Button
                aria-label="Close outline"
                size="icon"
                type="button"
                variant="outline"
              >
                <CloseIcon className="w-5" />
              </Button>
            </div>
          </div>

          {/* Disabled */}
          <div>
            <h3 className="mb-3 font-semibold text-muted-foreground text-sm">
              Disabled
            </h3>
            <div className="flex flex-wrap gap-2">
              <Button disabled type="button">
                Default
              </Button>
              <Button disabled type="button" variant="secondary">
                Secondary
              </Button>
              <Button disabled type="button" variant="outline">
                Outline
              </Button>
              <Button disabled type="button" variant="ghost">
                Ghost
              </Button>
              <Button disabled type="button" variant="destructive">
                Destructive
              </Button>
            </div>
          </div>

          {/* Inputs */}
          <div>
            <h3 className="mb-3 font-semibold text-muted-foreground text-sm">
              Inputs
            </h3>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <input
                className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm"
                placeholder="Default"
                type="text"
              />
              <input
                className="w-full rounded-md border border-primary bg-background px-3 py-1.5 text-sm"
                placeholder="Primary"
                type="text"
              />
              <input
                className="w-full rounded-md border border-secondary bg-background px-3 py-1.5 text-sm"
                placeholder="Secondary"
                type="text"
              />
              <input
                className="w-full rounded-md border border-destructive bg-background px-3 py-1.5 text-sm"
                placeholder="Destructive"
                type="text"
              />
            </div>
          </div>

          {/* Color Tokens */}
          <div>
            <h3 className="mb-3 font-semibold text-muted-foreground text-sm">
              Color Tokens
            </h3>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
              <div className="rounded-md bg-background p-3 text-sm ring-1 ring-border">
                background
              </div>
              <div className="rounded-md bg-muted p-3 text-muted-foreground text-sm">
                muted
              </div>
              <div className="rounded-md bg-primary p-3 text-primary-foreground text-sm">
                primary
              </div>
              <div className="rounded-md bg-secondary p-3 text-secondary-foreground text-sm">
                secondary
              </div>
              <div className="rounded-md bg-accent p-3 text-accent-foreground text-sm">
                accent
              </div>
              <div className="rounded-md bg-destructive/10 p-3 text-destructive text-sm">
                destructive
              </div>
              <div className="rounded-md bg-card p-3 text-card-foreground text-sm ring-1 ring-border">
                card
              </div>
              <div className="rounded-md border border-border p-3 text-sm">
                border
              </div>
            </div>
          </div>

          {/* Typography */}
          <div>
            <h3 className="mb-3 font-semibold text-muted-foreground text-sm">
              Typography
            </h3>
            <div className="flex flex-col gap-1">
              <div className="font-bold text-5xl">Text 5XL</div>
              <div className="font-bold text-4xl">Text 4XL</div>
              <div className="font-bold text-3xl">Text 3XL</div>
              <div className="font-bold text-2xl">Text 2XL</div>
              <div className="font-bold text-xl">Text XL</div>
              <div className="font-bold text-lg">Text LG</div>
              <div className="font-bold text-base">Text Base</div>
              <div className="font-bold text-sm">Text SM</div>
              <div className="font-bold text-xs">Text XS</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
