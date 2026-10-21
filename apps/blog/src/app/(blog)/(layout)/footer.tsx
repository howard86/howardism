import { HugeiconsIcon } from "@hugeicons/react";

import { Container } from "@/app/(common)/container";
import ExternalLink from "@/app/(common)/external-link";

import { SOCIAL_LINKS } from "../social-links";
import { Avatar } from "./avatar";
import { REFERENCE_LINKS } from "./constants";

/**
 * Two quiet lines below every page. Route nav is left to the site bar, which
 * returns on scroll-up; the footer keeps only what the bar does not carry.
 */
export function Footer() {
  return (
    <footer className="mt-auto border-border border-t border-dashed pt-6 pb-8">
      <Container>
        <div className="flex flex-col gap-3">
          {/* Caption + socials */}
          <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
            <div className="flex items-center gap-2.5">
              <Avatar label="Home" size={28} />
              <span className="font-mono text-[11px] text-foreground-subtle tracking-[0.02em]">
                &copy; Howardism &middot; {new Date().getFullYear()} &middot;
                Taiwan / anywhere
              </span>
            </div>
            <ul className="-mx-1.5 flex list-none items-center gap-1 p-0">
              {SOCIAL_LINKS.map((link) => (
                <li key={link.href}>
                  <ExternalLink
                    aria-label={link["aria-label"]}
                    className="flex size-8 items-center justify-center rounded-full text-foreground-subtle transition-colors hover:text-brand"
                    href={link.href}
                  >
                    <HugeiconsIcon className="size-4" icon={link.icon} />
                  </ExternalLink>
                </li>
              ))}
            </ul>
          </div>

          {/* References + colophon */}
          <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
            <nav aria-label="Machine-readable references">
              <ul className="flex list-none flex-wrap items-center gap-x-4 gap-y-2 p-0">
                {REFERENCE_LINKS.map(({ label, href }) => (
                  <li key={href}>
                    <a
                      className="font-mono text-[10.5px] text-foreground-subtle uppercase tracking-[0.14em] no-underline transition-colors hover:text-brand"
                      href={href}
                    >
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
            <span className="font-mono text-[10px] text-foreground-subtle tracking-[0.02em]">
              The text is the work; the design is the chrome.
            </span>
          </div>
        </div>
      </Container>
    </footer>
  );
}
