import { Badge } from "@howardism/ui/components/badge";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";

import ExternalLink from "@/app/(common)/external-link";

import { SOCIAL_LINKS } from "../social-links";
import { Avatar } from "./avatar";
import { FOOTER_NAV, REFERENCE_LINKS } from "./constants";

const SOCIAL_LABEL: Record<string, string> = {
  "Follow on GitHub": "github.com/Howard86",
  "Follow on LinkedIn": "linkedin",
  "Follow on Twitter": "@howard86_",
  "Contact Howard via email": "howard@howardism.dev",
  "Follow on RSS feed": "RSS →",
};

export function Footer() {
  return (
    <footer className="mt-auto border-border border-t border-dashed px-gutter pt-6 pb-8">
      <div className="mx-auto flex max-w-[960px] flex-col gap-4">
        {/* Nav row */}
        <nav aria-label="footer">
          <ul className="flex list-none flex-wrap gap-1.5">
            {FOOTER_NAV.map(({ label, href }) => (
              <li key={label}>
                <Link href={href}>
                  <Badge variant="chip">{label}</Badge>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Caption row */}
        <div className="flex items-center gap-2.5">
          <Avatar label="Home" size={28} />
          <span className="font-mono text-[11px] text-foreground-subtle tracking-[0.02em]">
            &copy; Howardism &middot; {new Date().getFullYear()} &middot; Taiwan
            / anywhere
          </span>
        </div>

        {/* Socials row */}
        <ul className="flex list-none flex-wrap items-center gap-x-4 gap-y-2 p-0">
          {SOCIAL_LINKS.map((link) => (
            <li key={link.href}>
              <ExternalLink
                className="flex items-center gap-1.5 font-mono text-[10.5px] text-foreground-subtle uppercase tracking-[0.14em] no-underline transition-colors hover:text-brand"
                href={link.href}
              >
                <HugeiconsIcon className="size-3.5 shrink-0" icon={link.icon} />
                {SOCIAL_LABEL[link["aria-label"]] ?? link["aria-label"]}
              </ExternalLink>
            </li>
          ))}
        </ul>

        {/* Reference row */}
        <nav aria-label="Machine-readable references">
          <ul className="flex list-none flex-wrap items-center gap-x-4 gap-y-2 p-0">
            {REFERENCE_LINKS.map(({ label, href }) => (
              <li key={href}>
                <Link
                  className="font-mono text-[10.5px] text-foreground-subtle uppercase tracking-[0.14em] no-underline transition-colors hover:text-brand"
                  href={href}
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Colophon */}
        <span className="font-mono text-[10px] text-foreground-subtle tracking-[0.02em]">
          Set in Fraunces, Newsreader &amp; JetBrains Mono. The text is the
          work; the design is the chrome.
        </span>
      </div>
    </footer>
  );
}
