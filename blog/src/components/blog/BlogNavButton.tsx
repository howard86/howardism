import React, { FC } from "react";
import { Box } from "rebass/styled-components";
import RouteLink from "@/components/common/RouteLink";

interface NavButtonProps {
  title?: string;
  date?: string;
}

const NavButton: FC<NavButtonProps> = ({ title = "Back to Home", date }) => (
  <Box as="li">
    <RouteLink href={date ? `/blog/${date}` : "/"}>{title}</RouteLink>
  </Box>
);

export default NavButton;
