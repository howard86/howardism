import React, { FC, memo } from "react";
import NextLink from "next/link";
import { useRouter } from "next/router";
import { Link, List, ListItem, VStack } from "@chakra-ui/react";
import { NAV_OPTIONS } from "@/constants/nav";

const Nav: FC = () => {
  const router = useRouter();

  return (
    <VStack as="nav" textAlign="center">
      <List>
        {NAV_OPTIONS.map(({ title, href }) => (
          <ListItem key={title}>
            <NextLink href={href} passHref>
              <Link
                textTransform="capitalize"
                fontWeight={router.pathname === href ? "semibold" : "normal"}
                _hover={{
                  color: "secondary.600",
                }}
              >
                {title}
              </Link>
            </NextLink>
          </ListItem>
        ))}
      </List>
    </VStack>
  );
};

export default memo(Nav);
