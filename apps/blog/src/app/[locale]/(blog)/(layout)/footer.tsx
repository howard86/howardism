import { Badge } from "@howardism/ui/components/badge";
import Link from "next/link";
import { useTranslations } from "next-intl";

import ExternalLink from "@/app/(common)/external-link";

import { SOCIAL_LINKS } from "../social-links";
import { Avatar } from "./avatar";
import { FOOTER_NAV } from "./constants";

const SOCIAL_LABEL: Record<string, string> = {
  "Follow on GitHub": "github.com/Howard86",
  "Follow on LinkedIn": "linkedin",
  "Follow on Twitter": "@howard86_",
  "Contact Howard via email": "howard@howardism.dev",
  "Follow on RSS feed": "RSS →",
};

export function Footer() {
  const tFooter = useTranslations("Footer");
  const tNav = useTranslations("Nav");
  const year = new Date().getFullYear();
  return (
    <footer className="mt-auto border-border border-t border-dashed px-4 pt-6 pb-8">
      <div className="mx-auto flex max-w-[960px] flex-col gap-4">
        {/* Nav row */}
        <nav aria-label="footer">
          <ul className="flex list-none flex-wrap gap-1.5">
            {FOOTER_NAV.map((item) => {
              const label =
                item.namespace === "Footer"
                  ? tFooter(item.key)
                  : tNav(item.key);
              return (
                <li key={item.key}>
                  <Link href={item.href}>
                    <Badge variant="chip">{label}</Badge>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Caption row */}
        <div className="flex items-center gap-2.5">
          <Avatar label="Home" size={28} />
          <span className="font-mono text-[11px] text-foreground-subtle tracking-[0.02em]">
            {tFooter("copyright", { year })}
          </span>
        </div>

        {/* Socials row */}
        <ul className="flex list-none flex-wrap items-center gap-x-4 gap-y-2 p-0">
          {SOCIAL_LINKS.map((link) => (
            <li key={link.href}>
              <ExternalLink
                aria-label={link["aria-label"]}
                className="flex items-center gap-1.5 font-mono text-[10.5px] text-foreground-subtle uppercase tracking-[0.14em] no-underline transition-colors hover:text-brand"
                href={link.href}
              >
                <link.icon className="size-3.5 shrink-0 fill-current" />
                {SOCIAL_LABEL[link["aria-label"]] ?? link["aria-label"]}
              </ExternalLink>
            </li>
          ))}
        </ul>

        {/* Colophon */}
        <span className="font-mono text-[10px] text-foreground-subtle tracking-[0.02em]">
          {tFooter("colophon")}
        </span>
      </div>
    </footer>
  );
}
