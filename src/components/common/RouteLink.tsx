import React, { FC, memo } from "react";
import NextLink from "next/link";
import { Link as RebassLink, LinkProps } from "rebass";

interface RouteLinkProps extends LinkProps {
  href: string;
}

const RouteLink: FC<RouteLinkProps> = (props) => {
  const { href, children, ...rebassProps } = props;

  return (
    <NextLink href={href} passHref>
      <RebassLink {...rebassProps}>{children}</RebassLink>
    </NextLink>
  );
};

export default memo(RouteLink);
