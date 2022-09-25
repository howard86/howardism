import { Link as ChakraLink } from "@chakra-ui/react";
import { RouteLink, RouteLinkProps } from "@howardism/components-common";

export default function Link({ href, ...props }: Partial<RouteLinkProps>) {
  if (!href?.startsWith("/")) {
    return <ChakraLink href={href} isExternal {...props} />;
  }

  return <RouteLink href={href} {...props} />;
}
