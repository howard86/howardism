import { HugeiconsIcon } from "@hugeicons/react";

import ExternalLink from "@/app/(common)/external-link";

import { SOCIAL_LINKS } from "../social-links";
import { FEED_LINKS, isFileHref, MACHINE_LINKS } from "./constants";

const assetGroups = [
  { id: "subscribe", heading: "Subscribe", links: FEED_LINKS },
  { id: "machines", heading: "For machines", links: MACHINE_LINKS },
] as const;

/** Site assets live here; page navigation stays in the header. */
export function Footer() {
  return (
    <footer className="mt-auto pt-8 pb-8">
      <div className="mx-auto w-full max-w-wide px-gutter">
        <div className="grid gap-6 border-border border-t border-dashed pt-6 md:grid-cols-3">
          {assetGroups.map(({ id, heading, links }) => (
            <section aria-labelledby={`footer-${id}`} key={id}>
              <h2
                className="mb-3 font-mono text-[11px] text-muted-foreground uppercase tracking-[0.14em]"
                id={`footer-${id}`}
              >
                {heading}
              </h2>
              <ul className="flex list-none flex-wrap gap-x-4 gap-y-2 p-0">
                {links.map(({ label, href }) => {
                  const Anchor = isFileHref(href) ? "a" : ExternalLink;
                  return (
                    <li key={href}>
                      <Anchor
                        className="font-body text-[13px] text-foreground-subtle no-underline transition-colors hover:text-brand"
                        href={href}
                      >
                        {label}
                      </Anchor>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
          <section aria-labelledby="footer-elsewhere">
            <h2
              className="mb-3 font-mono text-[11px] text-muted-foreground uppercase tracking-[0.14em]"
              id="footer-elsewhere"
            >
              Elsewhere
            </h2>
            <ul className="flex list-none flex-wrap gap-x-4 gap-y-2 p-0">
              {SOCIAL_LINKS.map((link) => (
                <li key={link.href}>
                  <ExternalLink
                    className="inline-flex items-center gap-1.5 font-body text-[13px] text-foreground-subtle no-underline transition-colors hover:text-brand"
                    href={link.href}
                  >
                    <HugeiconsIcon className="size-4" icon={link.icon} />
                    <span>{link.label}</span>
                  </ExternalLink>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <div className="mt-6 flex flex-col gap-2 border-border border-t pt-4 font-mono text-foreground-subtle text-xs tracking-[0.02em] sm:flex-row sm:items-center sm:justify-between">
          <span>
            &copy; {new Date().getFullYear()} Howardism &middot; Taiwan /
            anywhere
          </span>
          <span>The text is the work; the design is the chrome.</span>
        </div>
      </div>
    </footer>
  );
}
