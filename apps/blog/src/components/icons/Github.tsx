import { Icon, Link, LinkProps } from "@chakra-ui/react";
import React, { FC } from "react";
import { FaGithub } from "react-icons/fa";

import { GITHUB_URL } from "@/constants/link";

const Github: FC<LinkProps> = (props) => (
  <Link href={GITHUB_URL} aria-label="GitHub link" isExternal {...props}>
    <Icon as={FaGithub} fontSize="3xl" />
  </Link>
);

export default Github;
