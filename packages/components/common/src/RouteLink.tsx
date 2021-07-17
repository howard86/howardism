import { Link, LinkProps } from "@chakra-ui/react";
import NextLink from "next/link";
import React, { memo, ReactNode } from "react";

interface RouteLinkProps extends LinkProps {
  children: ReactNode;
  href: string;
}

const RouteLink = ({ href, children, ...props }: RouteLinkProps): JSX.Element => {
  return (
    <NextLink href={href} passHref>
      <Link {...props}>{children}</Link>
    </NextLink>
  );
};

export default memo(RouteLink);
