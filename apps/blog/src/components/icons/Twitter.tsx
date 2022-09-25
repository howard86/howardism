import { FaTwitter } from "react-icons/fa";
import { Icon, Link, LinkProps } from "@chakra-ui/react";

import { TWITTER_URL } from "@/constants/link";

export default function Twitter(props: LinkProps) {
  return (
    <Link href={TWITTER_URL} aria-label="Twitter link" isExternal {...props}>
      <Icon as={FaTwitter} fontSize="3xl" />
    </Link>
  );
}
