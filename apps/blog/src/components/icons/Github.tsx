import { FaGithub } from "react-icons/fa";
import { Icon, Link, LinkProps } from "@chakra-ui/react";

import { GITHUB_URL } from "@/constants/link";

export default function Github(props: LinkProps) {
  return (
    <Link href={GITHUB_URL} aria-label="GitHub link" isExternal {...props}>
      <Icon as={FaGithub} fontSize="3xl" />
    </Link>
  );
}
