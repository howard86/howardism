import { Link, LinkProps } from "@chakra-ui/react";
import NextLink from "next/link";
import React, { FC } from "react";

interface RouteLinkProps extends LinkProps {
  href: string;
}

const RouteLink: FC<RouteLinkProps> = ({ href, children, ...props }) => (
  <NextLink href={href} passHref>
    <Link {...props}>{children}</Link>
  </NextLink>
);

export default RouteLink;
