import { Icon, Link, LinkProps, Tooltip } from "@chakra-ui/react";
import type { IconType } from "react-icons";

interface SocialIconLinkProps extends LinkProps {
  label: string;
  href: string;
  icon: IconType;
}

const SocialIconLink = ({ label, href, icon, ...props }: SocialIconLinkProps) => (
  <Tooltip
    label={label}
    aria-label={`${label} account link tooltip`}
    placement="top"
    color="primary.800"
    bg="white"
    transition="0.35s cubic-bezier(0.165, 0.84, 0.44, 1)"
    openDelay={100}
    hasArrow
  >
    <Link href={href} mx={[1, 1.5, 2]} isExternal {...props}>
      <Icon aria-label={`${label} account`} as={icon} fontSize={["xl", "2xl", "3xl"]} />
    </Link>
  </Tooltip>
);

export default SocialIconLink;
