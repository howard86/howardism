import { Link, List } from "@chakra-ui/react";
import NextLink from "next/link";
import React, { FC } from "react";

interface NavButtonProps {
  title?: string;
  date?: string;
}

const NavButton: FC<NavButtonProps> = ({ title = "Back to Home", date }) => (
  <List>
    <NextLink href={date ? `/blog/${date}` : "/"} passHref>
      <Link>{title}</Link>
    </NextLink>
  </List>
);

export default NavButton;
