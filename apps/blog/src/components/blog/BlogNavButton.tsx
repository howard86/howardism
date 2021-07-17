import { Link, List } from "@chakra-ui/react";
import NextLink from "next/link";
import React, { FC } from "react";

interface NavButtonProps {
  title: string;
  id: number;
}

const NavButton: FC<NavButtonProps> = ({ title, id }) => (
  <List>
    <NextLink href={id > 0 ? `/blog/${id}` : "/"} passHref>
      <Link>{title}</Link>
    </NextLink>
  </List>
);

export default NavButton;
