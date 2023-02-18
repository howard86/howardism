import { Popover } from "@headlessui/react"
import clsx from "clsx"
import { LinkProps } from "react-html-props"

interface MobileNavItemProps extends LinkProps {
  isActive: boolean
}

export default function MobileNavItem({ isActive, href, children }: MobileNavItemProps) {
  return (
    <li>
      <Popover.Button
        as="a"
        href={href}
        className={clsx("block py-2", isActive && "font-bold text-teal-500")}
      >
        {children}
      </Popover.Button>
    </li>
  )
}
