import { List, ListItem, VStack } from "@chakra-ui/react";
import { RouteLink } from "@howardism/components-common";
import { useRouter } from "next/router";

import { NAV_OPTIONS } from "@/constants/nav";

export default function Nav() {
  const router = useRouter();

  return (
    <VStack as="nav" textAlign="center">
      <List>
        {NAV_OPTIONS.map(({ title, href }) => (
          <ListItem key={title}>
            <RouteLink
              href={href}
              textTransform="capitalize"
              fontWeight={router.pathname === href ? "semibold" : "normal"}
              _hover={{
                color: "secondary.600",
              }}
            >
              {title}
            </RouteLink>
          </ListItem>
        ))}
      </List>
    </VStack>
  );
}
