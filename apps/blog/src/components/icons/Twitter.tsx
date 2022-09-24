import { Icon, Link, LinkProps } from "@chakra-ui/react";
import { FC } from "react";
import { FaTwitter } from "react-icons/fa";

import { TWITTER_URL } from "@/constants/link";

const Twitter: FC<LinkProps> = (props) => (
  <Link href={TWITTER_URL} aria-label="Twitter link" isExternal {...props}>
    <Icon as={FaTwitter} fontSize="3xl" />
  </Link>
);

export default Twitter;
