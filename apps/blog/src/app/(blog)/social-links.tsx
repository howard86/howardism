import {
  Github01Icon,
  Linkedin01Icon,
  Mail01Icon,
  NewTwitterIcon,
  RssIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";

import ExternalLink from "@/app/(common)/external-link";

interface SocialLink {
  "aria-label": string;
  href: string;
  icon: IconSvgElement;
}

export const SOCIAL_LINKS: SocialLink[] = [
  {
    href: "https://github.com/Howard86/",
    "aria-label": "Follow on GitHub",
    icon: Github01Icon,
  },
  {
    href: "https://www.linkedin.com/in/howard-tai-4b52b086/",
    "aria-label": "Follow on LinkedIn",
    icon: Linkedin01Icon,
  },
  {
    href: "https://twitter.com/howard86_",
    "aria-label": "Follow on Twitter",
    icon: NewTwitterIcon,
  },
  {
    href: "mailto:howard@howardism.dev",
    "aria-label": "Contact Howard via email",
    icon: Mail01Icon,
  },
  { href: "/rss/feed.xml", "aria-label": "Follow on RSS feed", icon: RssIcon },
];

export default function SocialLinks() {
  return (
    <ul className="mt-6 flex gap-2">
      {SOCIAL_LINKS.map((link) => (
        <li className="group" key={link.href}>
          <ExternalLink
            aria-label={link["aria-label"]}
            className="inline-flex size-8 items-center justify-center rounded-full transition-colors hover:bg-muted"
            href={link.href}
          >
            <HugeiconsIcon
              className="size-6 text-current transition-colors group-hover:text-secondary"
              icon={link.icon}
            />
          </ExternalLink>
        </li>
      ))}
    </ul>
  );
}
