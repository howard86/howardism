import { Button } from "@howardism/ui/components/button";
import Link from "next/link";

import ExternalLink from "@/app/(common)/external-link";
import { DataGrid } from "@/components/howardism/data-grid";
import { SunDisc } from "@/components/howardism/sun-disc";

import { SOCIAL_LINKS } from "./social-links";

export function HeroDisc() {
  return (
    <section className="hw-grain relative">
      <div className="mx-auto grid min-h-[62vh] max-w-[1120px] grid-cols-1 items-center gap-12 px-8 pt-12 pb-6 min-[820px]:grid-cols-2">
        <div>
          <div className="mb-6 font-medium font-mono text-[0.6875rem] text-foreground-subtle uppercase tracking-[0.16em]">
            <span className="inline-flex items-center gap-2">
              <span aria-hidden="true" className="h-px w-[18px] bg-brand" />
              Vol. 03 · Journal of quiet software
            </span>
          </div>

          <h1 className="m-0 font-display font-normal text-[clamp(44px,6vw,80px)] text-foreground leading-[1.02] tracking-[-0.03em]">
            Built in public,{" "}
            <em className="text-brand italic">read in quiet.</em>
          </h1>

          <div className="mt-8">
            <Button asChild className="motion-safe:hover:-translate-y-px">
              <Link href="/articles">
                Enter the journal
                <span aria-hidden="true">→</span>
              </Link>
            </Button>
          </div>

          <ul className="mt-5 flex list-none gap-1 p-0">
            {SOCIAL_LINKS.map((link) => (
              <li key={link.href}>
                <ExternalLink
                  aria-label={link["aria-label"]}
                  className="inline-flex size-8 items-center justify-center rounded-full text-foreground-subtle transition-colors hover:bg-muted hover:text-foreground"
                  href={link.href}
                >
                  <link.icon className="w-5 fill-current" />
                </ExternalLink>
              </li>
            ))}
          </ul>

          <div className="mt-9">
            <DataGrid
              rows={[
                ["Curator", "Howardism"],
                ["Based", "Taiwan, 23°N"],
                ["Writing", "Since 2022"],
                ["Frequency", "Monthly, ish"],
              ]}
            />
          </div>
        </div>

        <div className="mt-6 flex justify-center min-[820px]:mt-0 min-[820px]:max-w-full min-[820px]:justify-end min-[820px]:justify-self-end">
          <SunDisc number="01" plate="Plate I · Surface" size={420} />
        </div>
      </div>
    </section>
  );
}
