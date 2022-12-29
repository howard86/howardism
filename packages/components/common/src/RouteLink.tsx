import { Link, LinkProps } from "@chakra-ui/react"
import NextLink from "next/link"

export interface RouteLinkProps extends LinkProps {
  href: string
}

export default function RouteLink({ href, ...props }: RouteLinkProps): JSX.Element {
  return (
    <NextLink href={href} passHref legacyBehavior>
      <Link {...props} />
    </NextLink>
  )
}
