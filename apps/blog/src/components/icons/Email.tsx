import { Icon, Link, LinkProps } from "@chakra-ui/react";
import React, { FC } from "react";
import { HiOutlineMail } from "react-icons/hi";

import { EMAIL_URL } from "@/constants/link";

const Email: FC<LinkProps> = (props) => (
  <Link href={EMAIL_URL} aria-label="Mail to Howard" isExternal {...props}>
    <Icon as={HiOutlineMail} fontSize="4xl" />
  </Link>
);

export default Email;
