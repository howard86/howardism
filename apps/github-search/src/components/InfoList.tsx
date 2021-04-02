import React, { FC } from "react";
import NextLink from "next/link";
import { Link, ListIcon, ListItem } from "@chakra-ui/react";
import type { IconType } from "react-icons";

interface InfoListProps {
  name: string;
  url?: string;
  icon?: IconType;
}

const InfoList: FC<InfoListProps> = ({ name, icon, url }) => (
  <ListItem fontSize={["md", "lg"]}>
    <ListIcon fontSize="xl" as={icon} />
    {url ? (
      <Link href={url} isExternal>
        {name}
      </Link>
    ) : (
      <NextLink href={`/user/${name}`} passHref>
        <Link>{name}</Link>
      </NextLink>
    )}
  </ListItem>
);

export default InfoList;
