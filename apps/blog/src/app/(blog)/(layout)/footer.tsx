import { Badge } from "@howardism/ui/components/badge";
import Link from "next/link";

import { Avatar } from "./avatar";
import { FOOTER_NAV } from "./constants";

export function Footer() {
  return (
    <footer className="mt-auto border-border border-t border-dashed px-4 pt-6 pb-8">
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

        {/* Colophon */}
        <span className="font-mono text-[10px] text-foreground-subtle tracking-[0.02em]">
          Set in Fraunces, Newsreader &amp; JetBrains Mono.
        </span>
      </div>
    </footer>
  );
}
