import { Badge } from "@howardism/ui/components/badge";
import Link from "next/link";

import {
  AUTHOR_EMAIL,
  AUTHOR_HANDLE,
  AUTHOR_NAME,
  SITE_LOCATION,
  SITE_NAME,
  SITE_TAGLINE,
} from "../../constants";
import { Avatar } from "./avatar";
import { FOOTER_NAV } from "./constants";

export function Footer() {
  return (
    <footer className="mt-auto border-border border-t border-dashed px-4 pt-6 pb-8">
      <div className="mx-auto flex max-w-[960px] flex-col gap-4">
        {/* Nav row */}
        <nav aria-label="footer">
          <ul className="m-0 flex list-none flex-wrap gap-x-0.5 gap-y-1 p-0">
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
            &copy; {SITE_NAME} &middot; {new Date().getFullYear()} &middot;{" "}
            {SITE_LOCATION}
          </span>
        </div>

        {/* Tagline */}
        <span className="max-w-[60ch] font-body text-[12px] text-muted-foreground italic leading-[1.5]">
          {SITE_TAGLINE}
        </span>

        {/* Colophon */}
        <span className="font-mono text-[10px] text-foreground-subtle tracking-[0.02em]">
          {AUTHOR_NAME} &middot; {AUTHOR_EMAIL} &middot; {AUTHOR_HANDLE}
          {" — "}
          Set in Fraunces, Newsreader &amp; JetBrains Mono. ✨
        </span>
      </div>
    </footer>
  );
}
