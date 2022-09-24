import { Link, LinkProps } from "@chakra-ui/react";
import NextLink from "next/link";

interface RouteLinkProps extends LinkProps {
  href: string;
}

const RouteLink = (props: RouteLinkProps) => {
  const { href, children, ...rest } = props;

  return (
    <NextLink href={href} passHref>
      <Link {...rest}>{children}</Link>
    </NextLink>
  );
};

export default RouteLink;
