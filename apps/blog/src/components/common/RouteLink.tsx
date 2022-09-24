import { Link, LinkProps } from "@chakra-ui/react";
import NextLink from "next/link";
import { FC, memo } from "react";

interface RouteLinkProps extends LinkProps {
  href: string;
}

const RouteLink: FC<RouteLinkProps> = (props) => {
  const { href, children, ...rest } = props;

  return (
    <NextLink href={href} passHref>
      <Link {...rest}>{children}</Link>
    </NextLink>
  );
};

export default memo(RouteLink);
