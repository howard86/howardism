import { IconType } from "react-icons"
import { FaGithub, FaTwitter } from "react-icons/fa"
import { GoMail } from "react-icons/go"

import { Container } from "./Container"

type SocialItem = {
  name: string
  href: string
  Icon: IconType
}

const SOCIAL_ITEMS: SocialItem[] = [
  { name: "GitHub", href: "https://github.com/Howard86", Icon: FaGithub },
  { name: "Twitter", href: "https://twitter.com/howard86_", Icon: FaTwitter },
  { name: "Email", href: "mailto:howard@howardism.dev", Icon: GoMail },
]

export default function Footer(): JSX.Element {
  return (
    <Container>
      <footer className="my-8 border-t border-gray-200 pt-8 text-zinc-400 md:flex md:items-center md:justify-between">
        <div className="flex gap-6 md:order-2">
          {SOCIAL_ITEMS.map((item) => (
            <a
              key={item.name}
              href={item.href}
              className=" hover:text-zinc-500"
              target="_blank"
              rel="noreferrer"
            >
              <span className="sr-only">{item.name}</span>
              <item.Icon className="h-6 w-6" aria-hidden="true" />
            </a>
          ))}
        </div>
        <p className="mt-8 text-base text-gray-400 md:order-1 md:mt-0">
          &copy; {new Date().getFullYear()} Howard86. All rights reserved.
        </p>
      </footer>
    </Container>
  )
}
