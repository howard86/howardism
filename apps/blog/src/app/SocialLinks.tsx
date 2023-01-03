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
    <div className="mt-6 flex gap-6">
      {SOCIAL_LINKS.map((link) => (
        <ExternalLink
          key={link.href}
          className="group -m-1 p-1"
          aria-label={link["aria-label"]}
          href={link.href}
        >
          <link.icon className="h-6 w-6 fill-zinc-500 transition group-hover:fill-zinc-600 dark:fill-zinc-400 dark:group-hover:fill-zinc-300" />
        </ExternalLink>
      ))}
    </div>
  )
}
