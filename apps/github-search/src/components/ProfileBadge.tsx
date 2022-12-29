import { Icon, Tooltip, WrapItem } from "@chakra-ui/react"

import matchIcon from "@/utils/match-icons"

interface ProfileBadgeProps {
  name: string
}

export default function ProfileBadge({ name }: ProfileBadgeProps) {
  return (
    <Tooltip label={name} aria-label={`${name} tooltip`} placement="bottom-start">
      <WrapItem>
        <Icon fontSize="4xl" as={matchIcon(name)} />
      </WrapItem>
    </Tooltip>
  )
}
