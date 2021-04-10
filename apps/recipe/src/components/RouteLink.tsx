import React, { FC } from "react";
import NextLink from "next/link";
import { Link, LinkProps } from "@chakra-ui/react";

interface RouteLinkProps extends LinkProps {
  href: string;
}

const RouteLink: FC<RouteLinkProps> = ({ href, children, ...props }) => (
  <NextLink href={href} passHref>
    <Link {...props}>{children}</Link>
  </NextLink>
);

export default RouteLink;
