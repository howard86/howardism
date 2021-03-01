import React, { FC, memo } from "react";
import { Box, Text } from "@chakra-ui/react";

import { NAV_OPTIONS } from "@/constants/nav";
import RouteLink from "../common/RouteLink";

interface NavProps {
  path: string;
}

const Nav: FC<NavProps> = ({ path }) => (
  <Box as="nav" textAlign="center">
    <Box as="ul">
      {NAV_OPTIONS.map(({ title, href }) => (
        <Box as="li" key={title}>
          <RouteLink href={href}>
            <Text fontWeight={path === href ? "bold" : "inherit"}>{title}</Text>
          </RouteLink>
        </Box>
      ))}
    </Box>
  </Box>
);

export default memo(Nav);
