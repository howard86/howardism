import { Link, LinkProps } from "@chakra-ui/react";
import NextLink from "next/link";

interface RouteLinkProps extends LinkProps {
  href: string;
}

const RouteLink = ({ href, ...props }: RouteLinkProps): JSX.Element => {
  return (
    <NextLink href={href} passHref>
      <Link {...props} />
    </NextLink>
  );
};

export default RouteLink;
