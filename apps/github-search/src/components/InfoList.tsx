import { Link, ListIcon, ListItem } from "@chakra-ui/react";
import { RouteLink } from "@howardism/components-common";
import type { IconType } from "react-icons";

interface InfoListProps {
  icon?: IconType;
  name: string;
  url?: string;
}

export default function InfoList({ name, icon, url }: InfoListProps) {
  return (
    <ListItem fontSize={["md", "lg"]}>
      <ListIcon as={icon} fontSize="xl" />
      {url ? (
        <Link href={url} isExternal>
          {name}
        </Link>
      ) : (
        <RouteLink href={`/user/${name}`}>{name}</RouteLink>
      )}
    </ListItem>
  );
}
