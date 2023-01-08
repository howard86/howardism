import { FC } from "react"
import { SVGProps } from "react-html-props"

export interface ContactListItemProps {
  Icon: FC<SVGProps>
  text: string
}

export function ContactListItem({ Icon, text }: ContactListItemProps) {
  return (
    <li className="flex items-center">
      <Icon className="mr-1 h-3 w-3 shrink-0 align-middle" />
      <span>{text}</span>
    </li>
  )
}
