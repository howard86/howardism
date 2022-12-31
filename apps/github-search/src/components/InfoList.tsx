import type { IconType } from "react-icons"
import { Link, ListIcon, ListItem } from "@chakra-ui/react"

import { RouteLink } from "@howardism/components-common"

interface InfoListProps {
  name: string
  url?: string
  icon?: IconType
}

export default function InfoList({ name, icon, url }: InfoListProps) {
  return (
    <ListItem fontSize={["md", "lg"]}>
      <ListIcon fontSize="xl" as={icon} />
      {url ? (
        <Link href={url} isExternal>
          {name}
        </Link>
      ) : (
        <RouteLink href={`/user/${name}`}>{name}</RouteLink>
      )}
    </ListItem>
  )
}
