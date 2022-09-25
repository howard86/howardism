import { HiOutlineMail } from "react-icons/hi";
import { Icon, Link, LinkProps } from "@chakra-ui/react";

import { EMAIL_URL } from "@/constants/link";

export default function Email(props: LinkProps) {
  return (
    <Link href={EMAIL_URL} aria-label="Mail to Howard" isExternal {...props}>
      <Icon as={HiOutlineMail} fontSize="4xl" />
    </Link>
  );
}
