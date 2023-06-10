import type { FC } from "react"
import type { SVGProps } from "react-html-props"

import ExternalLink from "@/components/template/ExternalLink"
import {
  EmailIcon,
  GitHubIcon,
  LinkedInIcon,
  RssIcon,
  TwitterIcon,
} from "@/components/template/SocialIcons"

type SocialLink = {
  href: string
  icon: FC<SVGProps>
  "aria-label": string
}

export const SOCIAL_LINKS: SocialLink[] = [
  {
    href: "https://twitter.com/howard86_",
    "aria-label": "Follow on Twitter",
    icon: TwitterIcon,
  },
  {
    href: "https://github.com/Howard86/",
    "aria-label": "Follow on GitHub",
    icon: GitHubIcon,
  },
  {
    href: "https://www.linkedin.com/in/howard-tai-4b52b086/",
    "aria-label": "Follow on LinkedIn",
    icon: LinkedInIcon,
  },
  {
    href: "mailto:howard@howardism.dev",
    "aria-label": "Contact Howard via email",
    icon: EmailIcon,
  },
  { href: "/rss/feed.xml", "aria-label": "Follow on RSS feed", icon: RssIcon },
]

export default function SocialLinks() {
  return (
    <div className="mt-6 flex gap-2">
      {SOCIAL_LINKS.map((link) => (
        <ExternalLink
          key={link.href}
          className="group btn-ghost btn-sm btn-circle btn"
          aria-label={link["aria-label"]}
          href={link.href}
        >
          <link.icon className="h-6 w-6 fill-current" />
        </ExternalLink>
      ))}
    </div>
  )
}
