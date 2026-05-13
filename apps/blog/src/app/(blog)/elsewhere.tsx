import { Card } from "@howardism/ui/components/card";

import ExternalLink from "@/app/(common)/external-link";

import { SOCIAL_LINKS } from "./social-links";

const LABEL_MAP: Record<string, string> = {
  "Follow on Twitter": "Twitter",
  "Follow on GitHub": "GitHub",
  "Follow on LinkedIn": "LinkedIn",
  "Contact Howard via email": "Email",
  "Follow on RSS feed": "RSS",
};

export function Elsewhere() {
  return (
    <Card className="px-6 py-5">
      <div className="mb-4 font-medium font-mono text-[10px] text-foreground-subtle uppercase tracking-[0.16em]">
        Elsewhere
      </div>
      <ul className="m-0 list-none p-0">
        {SOCIAL_LINKS.map((link) => {
          const label = LABEL_MAP[link["aria-label"]] ?? link["aria-label"];
          return (
            <li className="border-border border-b" key={link.href}>
              <ExternalLink
                aria-label={link["aria-label"]}
                className="flex items-center gap-2.5 py-2.5 text-muted-foreground no-underline"
                href={link.href}
              >
                <link.icon className="size-4 shrink-0 fill-current text-foreground-subtle" />
                <span className="font-body text-[13px] text-foreground">
                  {label}
                </span>
              </ExternalLink>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
